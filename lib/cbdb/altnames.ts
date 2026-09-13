// lib/cbdb/altnames.ts v1.15.7
import { toSimplified } from "../t2s";

export interface AltnameMeta {
  version: string;
  generatedAt: string;
  source: { name: string; release_file: string; release_date: string };
  stats: { altnameTotal: number; personTotal: number };
  nameTypes: Record<number, string>;
}

const CBDB_BASE = "/index/cbdb";
const ALTNAMES_BASE = `${CBDB_BASE}/altnames`;
const ALTNAMES_META_URL = `${ALTNAMES_BASE}/altnames-meta.json`;
const ALTNAMES_URL = `${ALTNAMES_BASE}/altnames.json`;
const ALTNAMES_SEARCH_URL = `${ALTNAMES_BASE}/altnames-search.json`;
const ALTNAMES_PERSON_URL = `${ALTNAMES_BASE}/altnames-person.json`;

let altnameMetaCache: AltnameMeta | null = null;
let altnamesCache: [number, string, number][] | null = null; // [personid, 别名, 类型code]
let altnameSearchCache: [string, number][] | null = null; // [别名, personid]
let altnamePersonCache: Map<number, string> | null = null; // personid -> 姓名

export async function loadAltnameMeta(): Promise<AltnameMeta> {
  if (altnameMetaCache) return altnameMetaCache;
  const resp = await fetch(ALTNAMES_META_URL);
  if (!resp.ok) throw new Error(`CBDB 别名索引加载失败: ${resp.status}`);
  altnameMetaCache = (await resp.json()) as AltnameMeta;
  return altnameMetaCache;
}

/** 加载某人全部别名字号（字/號/諡號/行第等），按类型分组返回 */
export async function getPersonAltnames(personId: number): Promise<{ name: string; type: string }[]> {
  const meta = await loadAltnameMeta();
  let rows = altnamesCache;
  if (!rows) {
    const resp = await fetch(ALTNAMES_URL);
    if (!resp.ok) throw new Error(`别名索引加载失败: ${resp.status}`);
    rows = (await resp.json()) as [number, string, number][];
    altnamesCache = rows;
  }
  let lo = 0;
  let hi = rows.length - 1;
  let start = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid][0] < personId) lo = mid + 1;
    else { hi = mid - 1; start = mid; }
  }
  if (start === -1 || rows[start][0] !== personId) return [];
  const out: { name: string; type: string }[] = [];
  for (let i = start; i < rows.length && rows[i][0] === personId; i++) {
    const [pid, name, code] = rows[i];
    if (pid !== personId) break;
    out.push({ name, type: meta.nameTypes[code] || "" });
  }
  return out;
}

/** 加载别名检索索引（[别名, personid] 按别名排序） */
export async function loadAltnameSearch(): Promise<[string, number][]> {
  if (altnameSearchCache) return altnameSearchCache;
  const resp = await fetch(ALTNAMES_SEARCH_URL);
  if (!resp.ok) throw new Error(`别名检索索引加载失败: ${resp.status}`);
  altnameSearchCache = (await resp.json()) as [string, number][];
  return altnameSearchCache;
}

/** 加载别名人物姓名映射（personid -> 姓名） */
export async function loadAltnamePersons(): Promise<Map<number, string>> {
  if (altnamePersonCache) return altnamePersonCache;
  const resp = await fetch(ALTNAMES_PERSON_URL);
  if (!resp.ok) throw new Error(`别名人物映射加载失败: ${resp.status}`);
  const rows = (await resp.json()) as [number, string][];
  altnamePersonCache = new Map(rows);
  return altnamePersonCache;
}
