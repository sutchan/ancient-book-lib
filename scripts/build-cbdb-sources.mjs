/**
 * 从 CBDB SQLite 提取人物史料来源索引（BIOG_SOURCE_DATA c_main_source=1 + TEXT_CODES 书名）
 * 产物：public/index/cbdb/sources/（sources-meta.json + 按 personid 值区间分片）
 * 用法：node scripts/build-cbdb-sources.mjs [sqlite路径]
 */
import Database from "better-sqlite3";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEFAULT_SQLITE = join(ROOT, "tmp", "cbdb", "cbdb_20260905.sqlite3");
const SQLITE = process.argv[2] || DEFAULT_SQLITE;
const OUT_DIR = join(ROOT, "public", "index", "cbdb", "sources");
const SHARD_SIZE = 10000;

const INVALID = new Set(["[缺失信息]", "[Missing Data]", "[缺乏信息]", "未知", ""]);

console.log(`读取 SQLite: ${SQLITE}`);
const db = new Database(SQLITE, { readonly: true });

// 史料来源（仅主要来源，c_main_source=1）
console.log("提取主要史料来源...");
const rows = db
  .prepare(
    `SELECT s.c_personid AS pid, t.c_title_chn AS title, s.c_pages AS pages
     FROM BIOG_SOURCE_DATA s
     JOIN TEXT_CODES t ON t.c_textid = s.c_textid
     WHERE s.c_personid > 0 AND s.c_main_source = 1`
  )
  .all();
const valid = rows.filter((r) => {
  const t = (r.title || "").trim();
  return t && !INVALID.has(t);
});
console.log(`  主要来源: ${valid.length.toLocaleString()} / 人物: ${new Set(valid.map((r) => r.pid)).size.toLocaleString()}`);

// 每人限前 12 条（保持数据量可控）
const perPerson = new Map(); // pid -> [{title}]
for (const r of valid) {
  if (!perPerson.has(r.pid)) perPerson.set(r.pid, []);
  const list = perPerson.get(r.pid);
  if (list.length < 12) list.push({ title: r.title.trim() });
}

// 书名字典化（去重书名仅 516 种，可大幅压缩体积）
const titleIds = new Map(); // 书名 -> id
const titleList = [];
for (const [pid, list] of perPerson) {
  for (const s of list) {
    if (!titleIds.has(s.title)) {
      const id = titleList.length;
      titleIds.set(s.title, id);
      titleList.push(s.title);
    }
  }
}
console.log(`  去重书名字典: ${titleList.length}`);

// 紧凑 [personid, titleId] 按 personid 排序
const compact = [...perPerson.entries()]
  .flatMap(([pid, list]) => list.map((s) => [pid, titleIds.get(s.title)]))
  .sort((a, b) => a[0] - b[0]);
console.log(`  去重后: ${compact.length.toLocaleString()} 条`);

// 分片
mkdirSync(OUT_DIR, { recursive: true });
let maxId = 0;
for (const r of compact) if (r[0] > maxId) maxId = r[0];
const shards = [];
for (let lo = 0; lo <= maxId; lo += SHARD_SIZE) {
  const hi = lo + SHARD_SIZE - 1;
  const slice = compact.filter((r) => r[0] >= lo && r[0] <= hi);
  if (!slice.length) continue;
  const file = `sources-${lo}-${hi}.json`;
  writeFileSync(join(OUT_DIR, file), JSON.stringify(slice));
  shards.push({ lo, hi, file, count: slice.length });
}
console.log(`  分片: ${shards.length}`);

const meta = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  shardSize: SHARD_SIZE,
  source: { name: "CBDB 中国历代人物传记资料库", release_file: "cbdb_20260905.sqlite3", release_date: "2026-09-05" },
  stats: { sourceTotal: compact.length, personTotal: perPerson.size, titleCount: titleList.length },
  shards,
  titles: titleList,
};
writeFileSync(join(OUT_DIR, "sources-meta.json"), JSON.stringify(meta));

let totalBytes = statSync(join(OUT_DIR, "sources-meta.json")).size;
for (const s of shards) totalBytes += statSync(join(OUT_DIR, s.file)).size;
console.log(`\n=== 完成 ===`);
console.log(`来源 ${compact.length.toLocaleString()} 条 / 人物 ${meta.stats.personTotal.toLocaleString()} 人 / 体积 ${(totalBytes / 1024 / 1024).toFixed(1)} MB → ${OUT_DIR}`);
db.close();
