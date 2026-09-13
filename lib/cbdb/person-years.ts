// lib/cbdb/person-years.ts v1.15.7
const CBDB_BASE = "/index/cbdb";
const PERSON_YEARS_URL = `${CBDB_BASE}/person-years.json`;

let personYearsCache: PersonYearsMeta | null = null;

export interface PersonYearsMeta {
  version: string;
  generatedAt: string;
  source: { name: string; release_file: string; release_date: string };
  method: string;
  stats: { total: number; withYear: number; missing: number; bucketCount: number };
  buckets: { from: number; count: number }[];
  byDynasty: { dynasty: string; buckets: { from: number; count: number }[] }[];
}

/** 人物时间分布（CBDB BIOG_MAIN.c_index_year） */
export async function loadPersonYears(): Promise<PersonYearsMeta> {
  if (personYearsCache) return personYearsCache;
  const resp = await fetch(PERSON_YEARS_URL);
  if (!resp.ok) throw new Error(`人物时间分布索引加载失败: ${resp.status}`);
  personYearsCache = (await resp.json()) as PersonYearsMeta;
  return personYearsCache;
}
