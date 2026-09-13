// lib/cbdb/entries.ts v1.15.7
const CBDB_BASE = "/index/cbdb";
const ENTRY_BASE = `${CBDB_BASE}/entry`;
const ENTRY_META_URL = `${ENTRY_BASE}/entry-meta.json`;
const ENTRY_DYN_URL = `${ENTRY_BASE}/entry-dynasty.json`;

let entryMetaCache: EntryMeta | null = null;
let entryDynCache: EntryDynastyMeta | null = null;
const entryShardCache = new Map<string, EntryRecord[]>();

export interface EntryMeta {
  version: string;
  generatedAt: string;
  shardSize: number;
  source: { name: string; release_file: string; release_date: string };
  stats: { entryTotal: number; personTotal: number; entryCodeCount: number };
  shards: { lo: number; hi: number; file: string; count: number }[];
  entryCodes: Record<number, string>;
}

export interface EntryDynastyMeta {
  version: string;
  generatedAt: string;
  source: { name: string; release_file: string; release_date: string };
  method: string;
  stats: { entryTotal: number; dynastyCount: number };
  byDynasty: { dynasty: string; entryTotal: number; personTotal: number; topEntries: { entry: string; count: number }[] }[];
}

// 科举紧凑数组：[personid, 登科方式code, 年份, 名次]
export type EntryRecord = [number, number, number, string];

export async function loadEntryMeta(): Promise<EntryMeta> {
  if (entryMetaCache) return entryMetaCache;
  const resp = await fetch(ENTRY_META_URL);
  if (!resp.ok) throw new Error(`CBDB 科举索引加载失败: ${resp.status}`);
  entryMetaCache = (await resp.json()) as EntryMeta;
  return entryMetaCache;
}

export async function loadEntryDynastyMeta(): Promise<EntryDynastyMeta> {
  if (entryDynCache) return entryDynCache;
  const resp = await fetch(ENTRY_DYN_URL);
  if (!resp.ok) throw new Error(`科举-朝代索引加载失败: ${resp.status}`);
  entryDynCache = (await resp.json()) as EntryDynastyMeta;
  return entryDynCache;
}

function locateEntryShard(meta: EntryMeta, personId: number) {
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

/** 获取某人的科举/入仕记录（登科方式 + 年份 + 名次） */
export async function getPersonEntries(personId: number): Promise<{ entry: string; year: number; rank: string }[]> {
  const meta = await loadEntryMeta();
  const shard = locateEntryShard(meta, personId);
  if (!shard) return [];
  let rows = entryShardCache.get(shard.file);
  if (!rows) {
    const resp = await fetch(`${ENTRY_BASE}/${shard.file}`);
    if (!resp.ok) throw new Error(`科举分片加载失败: ${resp.status}`);
    rows = (await resp.json()) as EntryRecord[];
    entryShardCache.set(shard.file, rows);
  }
  return rows
    .filter((r) => r[0] === personId)
    .map((r) => ({ entry: meta.entryCodes[r[1]] || "", year: r[2], rank: r[3] }));
}
