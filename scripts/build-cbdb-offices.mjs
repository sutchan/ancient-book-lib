/**
 * 从 CBDB SQLite 提取人物任职索引（POSTED_TO_OFFICE_DATA + OFFICE_CODES + APPOINTMENT_CODES）
 * 产物：public/index/cbdb/offices/（offices-meta.json + 按 personid 值区间分片）
 * 用法：node scripts/build-cbdb-offices.mjs [sqlite路径]
 */
import Database from "better-sqlite3";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEFAULT_SQLITE = join(ROOT, "tmp", "cbdb", "cbdb_20260905.sqlite3");
const SQLITE = process.argv[2] || DEFAULT_SQLITE;
const OUT_DIR = join(ROOT, "public", "index", "cbdb", "offices");

const SHARD_SIZE = 10000;

const INVALID = new Set(["[missing data]", "[缺乏信息]", "[Unknown]", "[Missing Data]", "未詳", ""]);
function validChn(s) {
  return typeof s === "string" && s.trim() && !INVALID.has(s.trim());
}

console.log(`读取 SQLite: ${SQLITE}`);
const db = new Database(SQLITE, { readonly: true });

// 任命类型代码表
const apptRaw = db.prepare("SELECT c_appt_code, c_appt_desc_chn FROM APPOINTMENT_CODES").all();
const apptCodes = {};
for (const r of apptRaw) {
  if (r.c_appt_code > 0 && validChn(r.c_appt_desc_chn)) apptCodes[r.c_appt_code] = r.c_appt_desc_chn.trim();
}

// 任职数据（过滤 personid<=0、office_id<=0、官职名为空）
console.log("提取任职数据...");
const offices = db.prepare(
  `SELECT po.c_personid AS pid, o.c_office_chn AS office, po.c_firstyear AS fy, po.c_lastyear AS ly, po.c_appt_code AS appt
   FROM POSTED_TO_OFFICE_DATA po
   JOIN OFFICE_CODES o ON o.c_office_id = po.c_office_id
   WHERE po.c_personid > 0 AND po.c_office_id > 0
     AND o.c_office_chn IS NOT NULL AND o.c_office_chn != ''`
).all();
console.log(`  任职条目: ${offices.length.toLocaleString()}`);

// 去重官职名
const officeNames = new Set();
for (const r of offices) officeNames.add(r.office);
console.log(`  去重官职名: ${officeNames.size.toLocaleString()}`);

// 涉及人物
const persons = new Set();
for (const r of offices) persons.add(r.pid);
console.log(`  涉及人物: ${persons.size.toLocaleString()}`);

// 分片（与关系索引同区间对齐）
mkdirSync(OUT_DIR, { recursive: true });
let maxId = 0;
for (const r of offices) if (r.pid > maxId) maxId = r.pid;
const shardCount = Math.floor(maxId / SHARD_SIZE) + 1;

const shards = [];
for (let s = 0; s < shardCount; s++) {
  const lo = s * SHARD_SIZE;
  const hi = lo + SHARD_SIZE - 1;
  const shardRows = offices.filter((r) => r.pid >= lo && r.pid <= hi);
  if (!shardRows.length) continue;
  const file = `offices-${lo}-${hi}.json`;
  const compact = shardRows.map((r) => [r.pid, r.office, r.fy > 0 ? r.fy : 0, r.ly > 0 ? r.ly : 0, r.appt > 0 ? r.appt : 0]);
  writeFileSync(join(OUT_DIR, file), JSON.stringify(compact));
  shards.push({ lo, hi, file, count: compact.length });
}
console.log(`  分片数: ${shards.length}`);

const meta = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  shardSize: SHARD_SIZE,
  source: {
    name: "CBDB 中国历代人物传记资料库",
    release_file: "cbdb_20260905.sqlite3",
    release_date: "2026-09-05",
  },
  stats: {
    officeTotal: offices.length,
    personTotal: persons.size,
    officeNameCount: officeNames.size,
    apptCodeCount: Object.keys(apptCodes).length,
  },
  shards,
  apptCodes,
};
writeFileSync(join(OUT_DIR, "offices-meta.json"), JSON.stringify(meta));

let totalBytes = statSync(join(OUT_DIR, "offices-meta.json")).size;
for (const s of shards) totalBytes += statSync(join(OUT_DIR, s.file)).size;
console.log(`\n=== 完成 ===`);
console.log(`任职 ${offices.length.toLocaleString()} 条 / 人物 ${persons.size.toLocaleString()} 人 / 官职名 ${officeNames.size.toLocaleString()} 种`);
console.log(`分片 ${shards.length} 个 / 体积 ${(totalBytes / 1024 / 1024).toFixed(1)} MB → ${OUT_DIR}`);
db.close();
