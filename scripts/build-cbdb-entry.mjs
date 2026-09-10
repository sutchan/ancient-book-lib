/**
 * 从 CBDB SQLite 提取人物科举登科索引（ENTRY_DATA + ENTRY_CODES + BIOG_MAIN 朝代）
 * 产物：public/index/cbdb/entry/（entry-meta.json + 分片 + entry-dynasty.json 朝代×登科类型统计）
 * 用法：node scripts/build-cbdb-entry.mjs [sqlite路径]
 */
import Database from "better-sqlite3";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEFAULT_SQLITE = join(ROOT, "tmp", "cbdb", "cbdb_20260905.sqlite3");
const SQLITE = process.argv[2] || DEFAULT_SQLITE;
const OUT_DIR = join(ROOT, "public", "index", "cbdb", "entry");
const SHARD_SIZE = 10000;

console.log(`读取 SQLite: ${SQLITE}`);
const db = new Database(SQLITE, { readonly: true });

// 登科方式代码表
const entryRaw = db.prepare("SELECT c_entry_code, c_entry_desc_chn FROM ENTRY_CODES").all();
const entryCodes = {};
for (const r of entryRaw) {
  if (r.c_entry_code > 0 && r.c_entry_desc_chn && !r.c_entry_desc_chn.includes("Missing") && r.c_entry_desc_chn !== "未知") {
    entryCodes[r.c_entry_code] = r.c_entry_desc_chn.trim();
  }
}

// 朝代映射
const dynRaw = db.prepare("SELECT c_dy, c_dynasty_chn FROM DYNASTIES").all();
const dynMap = new Map(dynRaw.map((r) => [r.c_dy, r.c_dynasty_chn]));

// 科举数据（含朝代）
console.log("提取科举登科数据...");
const rows = db
  .prepare(
    `SELECT e.c_personid AS pid, e.c_entry_code AS code, e.c_year AS year, e.c_exam_rank AS rank, p.c_dy AS dy
     FROM ENTRY_DATA e
     JOIN BIOG_MAIN p ON p.c_personid = e.c_personid
     WHERE e.c_personid > 0 AND e.c_entry_code > 0`
  )
  .all();
console.log(`  科举记录: ${rows.length.toLocaleString()} / 人物: ${new Set(rows.map((r) => r.pid)).size.toLocaleString()}`);

// 紧凑条目 [personid, code, year, rank] 按 personid 排序
const compact = rows
  .map((r) => [r.pid, r.code, r.year > 0 ? r.year : 0, r.rank && r.rank !== "0" ? r.rank : ""])
  .sort((a, b) => a[0] - b[0]);

// 分片
mkdirSync(OUT_DIR, { recursive: true });
let maxId = 0;
for (const r of rows) if (r.pid > maxId) maxId = r.pid;
const shards = [];
for (let lo = 0; lo <= maxId; lo += SHARD_SIZE) {
  const hi = lo + SHARD_SIZE - 1;
  const slice = compact.filter((r) => r[0] >= lo && r[0] <= hi);
  if (!slice.length) continue;
  const file = `entry-${lo}-${hi}.json`;
  writeFileSync(join(OUT_DIR, file), JSON.stringify(slice));
  shards.push({ lo, hi, file, count: slice.length });
}
console.log(`  分片: ${shards.length}`);

// 科举-朝代统计（朝代 × 登科类型计数）
console.log("聚合科举-朝代统计...");
const dynEntry = new Map(); // dynasty -> Map(entryCode -> count)
const dynPerson = new Map(); // dynasty -> Set(personid)
for (const r of rows) {
  const dynasty = dynMap.get(r.dy) || "未詳";
  if (!dynEntry.has(dynasty)) dynEntry.set(dynasty, new Map());
  const em = dynEntry.get(dynasty);
  em.set(r.code, (em.get(r.code) || 0) + 1);
  if (!dynPerson.has(dynasty)) dynPerson.set(dynasty, new Set());
  dynPerson.get(dynasty).add(r.pid);
}
const byDynasty = [...dynEntry.entries()]
  .map(([dynasty, em]) => ({
    dynasty,
    entryTotal: [...em.values()].reduce((s, n) => s + n, 0),
    personTotal: dynPerson.get(dynasty)?.size || 0,
    topEntries: [...em.entries()]
      .map(([code, count]) => ({ entry: entryCodes[code] || `code${code}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
  }))
  .filter((d) => d.dynasty !== "未詳")
  .sort((a, b) => b.entryTotal - a.entryTotal)
  .slice(0, 12);

const entryDynastyMeta = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  source: { name: "CBDB 中国历代人物传记资料库", release_file: "cbdb_20260905.sqlite3", release_date: "2026-09-05" },
  method: "科举 ENTRY_DATA × BIOG_MAIN 朝代聚合，登科方式为 ENTRY_CODES 原始名称",
  stats: { entryTotal: rows.length, dynastyCount: byDynasty.length },
  byDynasty,
};
writeFileSync(join(OUT_DIR, "entry-dynasty.json"), JSON.stringify(entryDynastyMeta));

const meta = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  shardSize: SHARD_SIZE,
  source: { name: "CBDB 中国历代人物传记资料库", release_file: "cbdb_20260905.sqlite3", release_date: "2026-09-05" },
  stats: { entryTotal: compact.length, personTotal: new Set(rows.map((r) => r.pid)).size, entryCodeCount: Object.keys(entryCodes).length },
  shards,
  entryCodes,
};
writeFileSync(join(OUT_DIR, "entry-meta.json"), JSON.stringify(meta));

let totalBytes = 0;
for (const f of [meta, entryDynastyMeta].map(() => "").concat(shards.map((s) => s.file))) {
  totalBytes += statSync(join(OUT_DIR, f)).size;
}
totalBytes += statSync(join(OUT_DIR, "entry-meta.json")).size + statSync(join(OUT_DIR, "entry-dynasty.json")).size;
console.log(`\n=== 完成 ===`);
console.log(`科举 ${compact.length.toLocaleString()} 条 / 人物 ${meta.stats.personTotal.toLocaleString()} 人 / ${byDynasty.length} 朝代统计 / 体积 ${(totalBytes / 1024 / 1024).toFixed(1)} MB → ${OUT_DIR}`);
console.log(`朝代样例: ${JSON.stringify(byDynasty[0]?.topEntries.slice(0, 5))}`);
db.close();
