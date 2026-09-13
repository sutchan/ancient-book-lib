// lib/cbdb/rel.ts v1.15.7
const CBDB_BASE = "/index/cbdb";
const REL_BASE = `${CBDB_BASE}/rel`;
const REL_META_URL = `${REL_BASE}/rel-meta.json`;
const REL_NAMES_URL = `${REL_BASE}/names.json`;
const REL_TEXTS_URL = `${REL_BASE}/texts.json`;

let relMetaCache: RelMeta | null = null;
let relNamesCache: Map<number, string> | null = null;
let relTextsCache: PersonText[] | null = null;
// 分片缓存：key = 文件路径
const relShardCache = new Map<string, unknown>();

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
  shards: { lo: number; hi: number; kinFile: string | null; assocFile: string | null; kinCount: number; assocCount: number }[];
  kinCodes: Record<number, string>;
  assocCodes: Record<number, string>;
  textRoles: Record<number, string>;
}

// 关系紧凑数组：kin=[ego, 亲属id, code]；assoc=[ego, 关联人id, code, 首年]
export type KinEdge = [number, number, number];
export type AssocEdge = [number, number, number, number];
export type PersonText = [number, string, number, number]; // [personid, 标题, 角色code, 年份]

export async function loadRelMeta(): Promise<RelMeta> {
  if (relMetaCache) return relMetaCache;
  const resp = await fetch(REL_META_URL);
  if (!resp.ok) throw new Error(`CBDB 关系索引加载失败: ${resp.status}`);
  relMetaCache = (await resp.json()) as RelMeta;
  return relMetaCache;
}

/** 定位 personid 所在分片 */
export function locateShard(meta: RelMeta, personId: number) {
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

export async function loadShardFile<T>(file: string): Promise<T> {
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
