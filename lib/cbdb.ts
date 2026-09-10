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

export interface TraceOptions {
  maxDepth?: number; // 最大探索深度（1=直接，2=二级，3=三级），默认 2
  maxBreadth?: number; // 第一层探索宽度，后续层按 2 的幂递减，默认 12
}

export interface TraceResult {
  steps: RelationPathStep[];
  explored: number; // 实际展开的人物数
}

// 邻居缓存：personId → Map(邻居id → {rel, kind})，避免 BFS 中重复加载分片
const neighborsCache = new Map<number, Map<number, { rel: string; kind: "kin" | "assoc" }>>();

/** 获取某人的全部关系对象（亲属+社会，带缓存） */
async function getNeighborsCached(
  personId: number,
  meta: RelMeta
): Promise<Map<number, { rel: string; kind: "kin" | "assoc" }>> {
  const cached = neighborsCache.get(personId);
  if (cached) return cached;
  const shard = locateShard(meta, personId);
  const neighbors = new Map<number, { rel: string; kind: "kin" | "assoc" }>();
  if (shard) {
    if (shard.kinFile) {
      const edges = await loadShardFile<KinEdge[]>(shard.kinFile);
      for (const e of edges) {
        if (e[0] !== personId) continue;
        const rel = meta.kinCodes[e[2]];
        if (rel) neighbors.set(e[1], { rel, kind: "kin" });
      }
    }
    if (shard.assocFile) {
      const edges = await loadShardFile<AssocEdge[]>(shard.assocFile);
      for (const e of edges) {
        if (e[0] !== personId) continue;
        const rel = meta.assocCodes[e[2]];
        if (rel && !neighbors.has(e[1])) neighbors.set(e[1], { rel, kind: "assoc" });
      }
    }
  }
  neighborsCache.set(personId, neighbors);
  return neighbors;
}

/**
 * 双人关系溯源（分层 BFS）：
 * 逐层展开 A 的关系网络，支持直接（1 级）/ 二级 / 三级中间关系。
 * 每层广度递减（breadth(level) = max(4, maxBreadth / 2^(level-1))），
 * 通过 visited 去重与邻居缓存控制分片加载次数。
 */
export async function findRelationPath(
  a: number,
  b: number,
  opts: TraceOptions = {}
): Promise<TraceResult> {
  const maxDepth = Math.min(3, Math.max(1, opts.maxDepth ?? 2));
  const maxBreadth = Math.max(4, opts.maxBreadth ?? 12);
  const meta = await loadRelMeta();
  if (a === b) return { steps: [], explored: 0 };

  const visited = new Set<number>([a]);
  let queue: { id: number; path: RelationPathStep[] }[] = [{ id: a, path: [] }];
  let explored = 0;

  for (let depth = 1; depth <= maxDepth; depth++) {
    const breadth = Math.max(4, Math.floor(maxBreadth / Math.pow(2, depth - 1)));
    const next: { id: number; path: RelationPathStep[] }[] = [];
    for (const node of queue) {
      const neighbors = await getNeighborsCached(node.id, meta);
      explored++;
      let count = 0;
      for (const [nid, info] of Array.from(neighbors.entries())) {
        if (count++ >= breadth) break;
        const step: RelationPathStep = { from: node.id, to: nid, rel: info.rel, kind: info.kind };
        if (nid === b) return { steps: [...node.path, step], explored };
        if (!visited.has(nid)) {
          visited.add(nid);
          next.push({ id: nid, path: [...node.path, step] });
        }
      }
    }
    queue = next;
    if (!queue.length) break;
  }
  return { steps: [], explored };
}

// ============ 人物任职（CBDB POSTED_TO_OFFICE_DATA） ============

export interface OfficesMeta {
  version: string;
  generatedAt: string;
  shardSize: number;
  stats: {
    officeTotal: number;
    personTotal: number;
    officeNameCount: number;
    apptCodeCount: number;
  };
  shards: {
    lo: number;
    hi: number;
    file: string;
    count: number;
  }[];
  apptCodes: Record<number, string>;
}

// 任职紧凑数组：[personid, 官职名, 首年, 末年, 任命类型code]
export type OfficeRecord = [number, string, number, number, number];

const OFFICES_BASE = `${CBDB_BASE}/offices`;
const OFFICES_META_URL = `${OFFICES_BASE}/offices-meta.json`;

let officesMetaCache: OfficesMeta | null = null;
const officesShardCache = new Map<string, OfficeRecord[]>();

export async function loadOfficesMeta(): Promise<OfficesMeta> {
  if (officesMetaCache) return officesMetaCache;
  const resp = await fetch(OFFICES_META_URL);
  if (!resp.ok) throw new Error(`CBDB 任职索引加载失败: ${resp.status}`);
  officesMetaCache = (await resp.json()) as OfficesMeta;
  return officesMetaCache;
}

function locateOfficeShard(meta: OfficesMeta, personId: number) {
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

/** 获取某人的任职记录（官职 + 首末年 + 任命类型） */
export async function getPersonOffices(
  personId: number
): Promise<{ office: string; firstYear: number; lastYear: number; appt: string }[]> {
  const meta = await loadOfficesMeta();
  const shard = locateOfficeShard(meta, personId);
  if (!shard) return [];
  let rows = officesShardCache.get(shard.file);
  if (!rows) {
    const resp = await fetch(`${OFFICES_BASE}/${shard.file}`);
    if (!resp.ok) throw new Error(`任职分片加载失败: ${resp.status}`);
    rows = (await resp.json()) as OfficeRecord[];
    officesShardCache.set(shard.file, rows);
  }
  return rows
    .filter((r) => r[0] === personId)
    .map((r) => ({
      office: r[1],
      firstYear: r[2],
      lastYear: r[3],
      appt: meta.apptCodes[r[4]] || "",
    }));
}

// ============ 分析统计产物（籍贯分布 + 官职-朝代联动） ============

export interface GeoMeta {
  version: string;
  generatedAt: string;
  source: { name: string; release_file: string; release_date: string };
  method: string;
  stats: { personTotal: number; provinceCount: number };
  topProvinces: { province: string; count: number }[];
  byDynasty: { dynasty: string; count: number; topProvinces: { province: string; count: number }[] }[];
}

export interface OfficeDynastyMeta {
  version: string;
  generatedAt: string;
  source: { name: string; release_file: string; release_date: string };
  method: string;
  stats: { officeTotal: number; dynastyCount: number };
  byDynasty: { dynasty: string; officeTotal: number; personTotal: number; topOffices: { office: string; count: number }[] }[];
}

const GEO_META_URL = `${CBDB_BASE}/geo/geo-meta.json`;
const OFF_DYN_URL = `${CBDB_BASE}/offices/offices-dynasty.json`;

let geoMetaCache: GeoMeta | null = null;
let offDynMetaCache: OfficeDynastyMeta | null = null;

export async function loadGeoMeta(): Promise<GeoMeta> {
  if (geoMetaCache) return geoMetaCache;
  const resp = await fetch(GEO_META_URL);
  if (!resp.ok) throw new Error(`籍贯分布索引加载失败: ${resp.status}`);
  geoMetaCache = (await resp.json()) as GeoMeta;
  return geoMetaCache;
}

export async function loadOfficeDynastyMeta(): Promise<OfficeDynastyMeta> {
  if (offDynMetaCache) return offDynMetaCache;
  const resp = await fetch(OFF_DYN_URL);
  if (!resp.ok) throw new Error(`官职-朝代索引加载失败: ${resp.status}`);
  offDynMetaCache = (await resp.json()) as OfficeDynastyMeta;
  return offDynMetaCache;
}
