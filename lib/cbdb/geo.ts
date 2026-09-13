// lib/cbdb/geo.ts v1.15.7
const CBDB_BASE = "/index/cbdb";
const GEO_META_URL = `${CBDB_BASE}/geo/geo-meta.json`;
const OFF_DYN_URL = `${CBDB_BASE}/offices/offices-dynasty.json`;

let geoMetaCache: GeoMeta | null = null;
let offDynMetaCache: OfficeDynastyMeta | null = null;

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

/** 籍贯分布（CBDB 地理数据） */
export async function loadGeoMeta(): Promise<GeoMeta> {
  if (geoMetaCache) return geoMetaCache;
  const resp = await fetch(GEO_META_URL);
  if (!resp.ok) throw new Error(`籍贯分布索引加载失败: ${resp.status}`);
  geoMetaCache = (await resp.json()) as GeoMeta;
  return geoMetaCache;
}

/** 官职-朝代联动统计 */
export async function loadOfficeDynastyMeta(): Promise<OfficeDynastyMeta> {
  if (offDynMetaCache) return offDynMetaCache;
  const resp = await fetch(OFF_DYN_URL);
  if (!resp.ok) throw new Error(`官职-朝代索引加载失败: ${resp.status}`);
  offDynMetaCache = (await resp.json()) as OfficeDynastyMeta;
  return offDynMetaCache;
}
