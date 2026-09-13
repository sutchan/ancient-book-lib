// lib/cbdb/sources.ts v1.15.7
const CBDB_BASE = "/index/cbdb";
const SOURCES_BASE = `${CBDB_BASE}/sources`;
const SOURCES_META_URL = `${SOURCES_BASE}/sources-meta.json`;

let sourcesMetaCache: SourcesMeta | null = null;
const sourcesShardCache = new Map<string, [number, number][]>();

export interface SourcesMeta {
  version: string;
  generatedAt: string;
  shardSize: number;
  source: { name: string; release_file: string; release_date: string };
  stats: { sourceTotal: number; personTotal: number; titleCount: number };
  shards: { lo: number; hi: number; file: string; count: number }[];
  titles: string[];
}

export async function loadSourcesMeta(): Promise<SourcesMeta> {
  if (sourcesMetaCache) return sourcesMetaCache;
  const resp = await fetch(SOURCES_META_URL);
  if (!resp.ok) throw new Error(`CBDB 史料来源索引加载失败: ${resp.status}`);
  sourcesMetaCache = (await resp.json()) as SourcesMeta;
  return sourcesMetaCache;
}

function locateSourcesShard(meta: SourcesMeta, personId: number) {
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

/** 获取某人的主要史料来源（书名） */
export async function getPersonSources(personId: number): Promise<string[]> {
  const meta = await loadSourcesMeta();
  const shard = locateSourcesShard(meta, personId);
  if (!shard) return [];
  let rows = sourcesShardCache.get(shard.file);
  if (!rows) {
    const resp = await fetch(`${SOURCES_BASE}/${shard.file}`);
    if (!resp.ok) throw new Error(`史料来源分片加载失败: ${resp.status}`);
    rows = (await resp.json()) as [number, number][];
    sourcesShardCache.set(shard.file, rows);
  }
  return rows.filter((r) => r[0] === personId).map((r) => meta.titles[r[1]] || "");
}
