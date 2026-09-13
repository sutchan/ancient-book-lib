// lib/cbdb/offices.ts v1.15.7
const CBDB_BASE = "/index/cbdb";
const OFFICES_BASE = `${CBDB_BASE}/offices`;
const OFFICES_META_URL = `${OFFICES_BASE}/offices-meta.json`;

let officesMetaCache: OfficesMeta | null = null;
const officesShardCache = new Map<string, OfficeRecord[]>();

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
  shards: { lo: number; hi: number; file: string; count: number }[];
  apptCodes: Record<number, string>;
}

// 任职紧凑数组：[personid, 官职名, 首年, 末年, 任命类型code]
export type OfficeRecord = [number, string, number, number, number];

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
