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
