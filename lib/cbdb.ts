/**
 * CBDB（中国历代人物传记资料库）索引加载工具
 * 数据来源：cbdb-project/cbdb_sqlite 2026-09-05 版（661,350 人）
 * 产物：public/index/cbdb/（meta.json + surnames/*.json + search.json）
 */

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

const META_URL = "/index/cbdb/meta.json";
const SEARCH_URL = "/index/cbdb/search.json";
const OTHERS_URL = "/index/cbdb/surnames/_others.json";

let metaCache: CbdbMeta | null = null;
let searchCache: [string, number][] | null = null;

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

/** 按姓氏加载人物分片 */
export async function loadSurnamePersons(
  meta: CbdbMeta,
  surname: string
): Promise<CbdbPerson[]> {
  const entry = meta.surnames.find((s) => s.surname === surname);
  if (!entry) return [];
  if (!entry.standalone) {
    const all = (await (await fetch(OTHERS_URL)).json()) as [string, ...CbdbPerson][];
    return all.filter((p) => p[0] === surname).map((p) => p.slice(1) as CbdbPerson);
  }
  const file = entry.file as string;
  const resp = await fetch(file);
  if (!resp.ok) throw new Error(`姓氏分片加载失败: ${resp.status}`);
  return (await resp.json()) as CbdbPerson[];
}

/** 人名搜索（前缀匹配，返回前 limit 条） */
export async function searchPersons(
  query: string,
  limit = 20
): Promise<{ id: number; name: string }[]> {
  const q = query.trim();
  if (!q) return [];
  const index = await loadSearchIndex();
  const results: { id: number; name: string }[] = [];
  for (const [name, id] of index) {
    if (name.startsWith(q)) {
      results.push({ id, name });
      if (results.length >= limit) break;
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
