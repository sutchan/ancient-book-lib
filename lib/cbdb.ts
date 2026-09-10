// lib/cbdb.ts v1.5.1
/**
 * CBDB（中国历代人物传记资料库）索引加载工具
 * 数据来源：cbdb-project/cbdb_sqlite 2026-09-05 版（661,350 人）
 * 产物：public/index/cbdb/（meta.json + surnames/*.json + search.json）
 */
import { toSimplified } from "./t2s";

export interface CbdbMeta {
  total: number;
  female: number;
  source: {
    name: string;
    url: string;
    sqlite_repo: string;
    release_file: string;
    release_date: string;
    sha256: string;
    license: string;
  };
  generatedAt: string;
  dynasty: { dynasty: string; count: number }[];
  surnames: { surname: string; count: number; file?: string; standalone: boolean }[];
  surnameTotal: number;
  searchIndexSize: number;
  note: string;
}

// 人物紧凑数组：[id, 姓名, 拼音, 生年, 卒年, 指数年, 性别(1女), 朝代, 籍贯]
export type CbdbPerson = [
  number,
  string,
  string,
  number,
  number,
  number,
  0 | 1,
  string,
  string
];

// 所有运行时索引均走根路径绝对地址：静态导出 trailingSlash 页面（如 /people/）下
// 相对路径会解析成 /people/surnames/... 导致 404。
const CBDB_BASE = "/index/cbdb";
const META_URL = `${CBDB_BASE}/meta.json`;
const SEARCH_URL = `${CBDB_BASE}/search.json`;
const OTHERS_URL = `${CBDB_BASE}/surnames/_others.json`;

let metaCache: CbdbMeta | null = null;
let searchCache: [string, number][] | null = null;
// 与 searchCache 平行的简体归一化副本（仅构建一次），让简体查询能命中繁体原名
let normSearchCache: [string, number][] | null = null;
let othersCache: [string, ...CbdbPerson][] | null = null;

export async function loadCbdbMeta(): Promise<CbdbMeta> {
  if (metaCache) return metaCache;
  const resp = await fetch(META_URL);
  if (!resp.ok) throw new Error(`CBDB 索引加载失败: ${resp.status}`);
  metaCache = (await resp.json()) as CbdbMeta;
  return metaCache;
}

/** 加载姓名搜索索引（[姓名, id] 按姓名排序） */
export async function loadSearchIndex(): Promise<[string, number][]> {
  if (searchCache) return searchCache;
  const resp = await fetch(SEARCH_URL);
  if (!resp.ok) throw new Error(`CBDB 姓名索引加载失败: ${resp.status}`);
  searchCache = (await resp.json()) as [string, number][];
  return searchCache;
}

/** 加载简体归一化姓名索引（与 loadSearchIndex 同序，按需构建一次后缓存） */
async function loadNormSearchIndex(): Promise<[string, number][]> {
  if (normSearchCache) return normSearchCache;
  const index = await loadSearchIndex();
  normSearchCache = index.map(([name, id]) => [toSimplified(name), id]);
  return normSearchCache;
}

/** 加载小姓合集分片（rank 200 之后的姓氏全部聚合在 _others.json） */
async function loadOthers(): Promise<[string, ...CbdbPerson][]> {
  if (othersCache) return othersCache;
  const resp = await fetch(OTHERS_URL);
  if (!resp.ok) throw new Error(`CBDB 小姓分片加载失败: ${resp.status}`);
  othersCache = (await resp.json()) as [string, ...CbdbPerson][];
  return othersCache;
}

/** 按姓氏加载人物分片 */
export async function loadSurnamePersons(
  meta: CbdbMeta,
  surname: string
): Promise<CbdbPerson[]> {
  const entry = meta.surnames.find((s) => s.surname === surname);
  // meta.surnames 只收录前 200 大姓：entry 缺失或非独立分片时，统一回退 _others.json
  if (!entry || !entry.standalone) {
    const all = await loadOthers();
    return all.filter((p) => p[0] === surname).map((p) => p.slice(1) as CbdbPerson);
  }
  // entry.file 为相对产物路径（如 surnames/%E6%9D%8E.json），需拼上索引根路径
  const resp = await fetch(`${CBDB_BASE}/${entry.file}`);
  if (!resp.ok) throw new Error(`姓氏分片加载失败: ${resp.status}`);
  return (await resp.json()) as CbdbPerson[];
}

/** 人名搜索（前缀匹配，繁简双向兼容，返回前 limit 条） */
export async function searchPersons(
  query: string,
  limit = 20
): Promise<{ id: number; name: string }[]> {
  const q = query.trim();
  if (!q) return [];
  const qNorm = toSimplified(q);
  const [index, normIndex] = await Promise.all([
    loadSearchIndex(),
    loadNormSearchIndex(),
  ]);
  const results: { id: number; name: string }[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < index.length; i++) {
    const [name, id] = index[i];
    // 原名前缀命中（繁体查询）或简体归一化后前缀命中（简体查询）
    if (name.startsWith(q) || (qNorm !== q && normIndex[i][0].startsWith(qNorm))) {
      if (!seen.has(id)) {
        seen.add(id);
        results.push({ id, name });
        if (results.length >= limit) break;
      }
    }
  }
  return results;
}

/** 按 ID 查找人物（利用 searchIndex 定位姓名 → 姓氏分片） */
export async function findPersonById(id: number): Promise<CbdbPerson | null> {
  const meta = await loadCbdbMeta();
  const index = await loadSearchIndex();
  let name = "";
  for (const [n, i] of index) {
    if (i === id) {
      name = n;
      break;
    }
  }
  if (!name) return null;
  const surname = name.charAt(0);
  const list = await loadSurnamePersons(meta, surname);
  return list.find((p) => p[0] === id) || null;
}

/** 格式化生卒年（含公元前） */
export function formatYear(year: number): string {
  if (!year) return "不详";
  return year < 0 ? `公元前 ${-year} 年` : `${year} 年`;
}

/** 格式化年龄区间 */
export function formatLife(birth: number, death: number): string {
  if (birth && death) return `${formatYear(birth)} — ${formatYear(death)}`;
  if (birth) return `生于 ${formatYear(birth)}`;
  if (death) return `卒于 ${formatYear(death)}`;
  return "生卒年不详";
}

// ============ 人物关系（CBDB KIN/ASSOC/TEXTS） ============

export interface RelMeta {
  version: string;
  generatedAt: string;
  shardSize: number;
  stats: {
    kinTotal: number;
    assocTotal: number;
    textTotal: number;
    personTotal: number;
    kinCodeCount: number;
    assocCodeCount: number;
  };
  shards: {
    lo: number;
    hi: number;
    kinFile: string | null;
    assocFile: string | null;
    kinCount: number;
    assocCount: number;
  }[];
  kinCodes: Record<number, string>;
  assocCodes: Record<number, string>;
  textRoles: Record<number, string>;
}

// 关系紧凑数组：kin=[ego, 亲属id, code]；assoc=[ego, 关联人id, code, 首年]
export type KinEdge = [number, number, number];
export type AssocEdge = [number, number, number, number];
export type PersonText = [number, string, number, number]; // [personid, 标题, 角色code, 年份]

const REL_BASE = `${CBDB_BASE}/rel`;
const REL_META_URL = `${REL_BASE}/rel-meta.json`;
const REL_NAMES_URL = `${REL_BASE}/names.json`;
const REL_TEXTS_URL = `${REL_BASE}/texts.json`;

let relMetaCache: RelMeta | null = null;
let relNamesCache: Map<number, string> | null = null;
let relTextsCache: PersonText[] | null = null;
// 分片缓存：key = 文件路径
const relShardCache = new Map<string, unknown>();

export async function loadRelMeta(): Promise<RelMeta> {
  if (relMetaCache) return relMetaCache;
  const resp = await fetch(REL_META_URL);
  if (!resp.ok) throw new Error(`CBDB 关系索引加载失败: ${resp.status}`);
  relMetaCache = (await resp.json()) as RelMeta;
  return relMetaCache;
}

/** 定位 personid 所在分片 */
function locateShard(meta: RelMeta, personId: number) {
  const shards = meta.shards;
  let lo = 0;
  let hi = shards.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = shards[mid];
    if (personId < s.lo) hi = mid - 1;
    else if (personId > s.hi) lo = mid + 1;
    else return s;
  }
  return null;
}

async function loadShardFile<T>(file: string): Promise<T> {
  const cached = relShardCache.get(file);
  if (cached) return cached as T;
  const resp = await fetch(`${REL_BASE}/${file}`);
  if (!resp.ok) throw new Error(`关系分片加载失败: ${resp.status}`);
  const data = (await resp.json()) as T;
  relShardCache.set(file, data);
  return data;
}

/** 加载关系涉及人物的 id→姓名 映射 */
export async function loadRelNames(): Promise<Map<number, string>> {
  if (relNamesCache) return relNamesCache;
  const resp = await fetch(REL_NAMES_URL);
  if (!resp.ok) throw new Error(`CBDB 关系人名加载失败: ${resp.status}`);
  const arr = (await resp.json()) as [number, string][];
  relNamesCache = new Map(arr);
  return relNamesCache;
}

/** 加载人物-著作关系（按 personid 排序） */
export async function loadRelTexts(): Promise<PersonText[]> {
  if (relTextsCache) return relTextsCache;
  const resp = await fetch(REL_TEXTS_URL);
  if (!resp.ok) throw new Error(`CBDB 人物著作加载失败: ${resp.status}`);
  relTextsCache = (await resp.json()) as PersonText[];
  return relTextsCache;
}

export interface PersonRelations {
  kin: { id: number; rel: string }[];
  assoc: { id: number; rel: string; year: number }[];
}

/** 获取某人的亲属与社会关系（需先 loadRelMeta） */
export async function getPersonRelations(personId: number): Promise<PersonRelations> {
  const meta = await loadRelMeta();
  const shard = locateShard(meta, personId);
  if (!shard) return { kin: [], assoc: [] };

  const kin: { id: number; rel: string }[] = [];
  const assoc: { id: number; rel: string; year: number }[] = [];

  if (shard.kinFile) {
    const edges = (await loadShardFile<KinEdge[]>(shard.kinFile)).filter((e) => e[0] === personId);
    for (const e of edges) {
      const rel = meta.kinCodes[e[2]];
      if (rel) kin.push({ id: e[1], rel });
    }
  }
  if (shard.assocFile) {
    const edges = (await loadShardFile<AssocEdge[]>(shard.assocFile)).filter((e) => e[0] === personId);
    for (const e of edges) {
      const rel = meta.assocCodes[e[2]];
      if (rel) assoc.push({ id: e[1], rel, year: e[3] });
    }
  }
  return { kin, assoc };
}

/** 获取某人的著作列表（二分定位 personid） */
export async function getPersonTexts(personId: number): Promise<{ title: string; role: string; year: number }[]> {
  const [texts, meta] = await Promise.all([loadRelTexts(), loadRelMeta()]);
  // texts.json 按 personid 排序，二分定位起点
  let lo = 0;
  let hi = texts.length - 1;
  let start = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (texts[mid][0] < personId) lo = mid + 1;
    else { hi = mid - 1; start = mid; }
  }
  if (start === -1 || texts[start][0] !== personId) return [];
  const out: { title: string; role: string; year: number }[] = [];
  for (let i = start; i < texts.length && texts[i][0] === personId; i++) {
    const t = texts[i];
    out.push({ title: t[1], role: meta.textRoles[t[2]] || "", year: t[3] > 0 ? t[3] : 0 });
  }
  return out;
}

export interface RelationPathStep {
  from: number;
  to: number;
  rel: string;
  kind: "kin" | "assoc";
}

/**
 * 双人关系溯源：先找直接关系；若无，则从 A 的关系对象中取前 N 个做二级探索。
 * 返回路径步列表（含中间人），空数组表示未找到。
 */
export async function findRelationPath(
  a: number,
  b: number,
  maxBreadth = 20
): Promise<RelationPathStep[]> {
  const meta = await loadRelMeta();
  const shardA = locateShard(meta, a);
  const shardB = locateShard(meta, b);
  if (!shardA || !shardB) return [];

  const loadEdges = async (shard: RelMeta["shards"][number]) => {
    const kin: KinEdge[] = shard.kinFile
      ? (await loadShardFile<KinEdge[]>(shard.kinFile)).filter((e) => e[0] === a || e[0] === b)
      : [];
    const assoc: AssocEdge[] = shard.assocFile
      ? (await loadShardFile<AssocEdge[]>(shard.assocFile)).filter((e) => e[0] === a || e[0] === b)
      : [];
    return { kin, assoc };
  };

  // 直接关系：A→B 或 B→A
  const shardAB = locateShard(meta, a) || locateShard(meta, b);
  if (shardAB && (shardAB.kinFile || shardAB.assocFile)) {
    // 只加载涉及 a/b 的分片
    for (const person of [a, b]) {
      const shard = locateShard(meta, person);
      if (!shard) continue;
      const edges = await loadEdges(shard);
      const kinHit = edges.kin.find((e) => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
      if (kinHit) {
        const rel = meta.kinCodes[kinHit[2]];
        if (rel) return [{ from: a, to: b, rel, kind: "kin" }];
      }
      const assocHit = edges.assoc.find((e) => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
      if (assocHit) {
        const rel = meta.assocCodes[assocHit[2]];
        if (rel) return [{ from: a, to: b, rel, kind: "assoc" }];
      }
    }
  }

  // 二级探索：A 的关系对象 X（maxBreadth 个），检查 X 与 B 的关系
  const edgesA = await loadEdges(shardA);
  const neighborsA = new Map<number, { rel: string; kind: "kin" | "assoc" }>();
  for (const e of edgesA.kin) {
    const rel = meta.kinCodes[e[2]];
    if (rel) neighborsA.set(e[1], { rel, kind: "kin" });
  }
  for (const e of edgesA.assoc) {
    const rel = meta.assocCodes[e[2]];
    if (rel && !neighborsA.has(e[1])) neighborsA.set(e[1], { rel, kind: "assoc" });
  }
  let count = 0;
  const neighborList = Array.from(neighborsA.entries());
  for (const [x, relInfo] of neighborList) {
    if (count++ >= maxBreadth) break;
    const shardX = locateShard(meta, x);
    if (!shardX) continue;
    const edgesX = await loadEdgesX(shardX, x, b);
    const kinHit = edgesX.kin.find((e) => (e[0] === x && e[1] === b) || (e[0] === b && e[1] === x));
    if (kinHit) {
      const rel2 = meta.kinCodes[kinHit[2]];
      if (rel2) {
        return [
          { from: a, to: x, rel: relInfo.rel, kind: relInfo.kind },
          { from: x, to: b, rel: rel2, kind: "kin" },
        ];
      }
    }
    const assocHit = edgesX.assoc.find((e) => (e[0] === x && e[1] === b) || (e[0] === b && e[1] === x));
    if (assocHit) {
      const rel2 = meta.assocCodes[assocHit[2]];
      if (rel2) {
        return [
          { from: a, to: x, rel: relInfo.rel, kind: relInfo.kind },
          { from: x, to: b, rel: rel2, kind: "assoc" },
        ];
      }
    }
  }
  return [];
}

/** 加载分片中与某 ego/other 相关的边（用于二级探索） */
async function loadEdgesX(
  shard: RelMeta["shards"][number],
  x: number,
  b: number
): Promise<{ kin: KinEdge[]; assoc: AssocEdge[] }> {
  const kin: KinEdge[] = shard.kinFile
    ? (await loadShardFile<KinEdge[]>(shard.kinFile)).filter((e) => e[0] === x || e[1] === x || e[0] === b || e[1] === b)
    : [];
  const assoc: AssocEdge[] = shard.assocFile
    ? (await loadShardFile<AssocEdge[]>(shard.assocFile)).filter((e) => e[0] === x || e[1] === x || e[0] === b || e[1] === b)
    : [];
  return { kin, assoc };
}
