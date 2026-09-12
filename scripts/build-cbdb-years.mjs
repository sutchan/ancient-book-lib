/**
 * 从 CBDB SQLite 生成人物时间分布统计（BIOG_MAIN.c_index_year 指数年）
 * 产物：public/index/cbdb/person-years.json
 * 用法：node scripts/build-cbdb-years.mjs [sqlite路径]
 */
import Database from "better-sqlite3";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEFAULT_SQLITE = join(ROOT, "tmp", "cbdb", "cbdb_20260905.sqlite3");
const SQLITE = process.argv[2] || DEFAULT_SQLITE;

console.log(`读取 SQLite: ${SQLITE}`);
const db = new Database(SQLITE, { readonly: true });

const total = db.prepare("SELECT COUNT(*) n FROM BIOG_MAIN").get().n;
// 指数年有效范围：0 < year < 2000（排除缺失与异常值）
const rows = db
  .prepare(
    `SELECT p.c_index_year AS y, d.c_dynasty_chn AS dy
     FROM BIOG_MAIN p JOIN DYNASTIES d ON d.c_dy = p.c_dy
     WHERE p.c_index_year > 0 AND p.c_index_year < 2000`
  )
  .all();
console.log(`有效指数年: ${rows.length.toLocaleString()} / 总人物 ${total.toLocaleString()}`);

// 全量 100 年区间
const bucketsMap = new Map();
for (const r of rows) {
  const from = Math.floor((r.y - 1) / 100) * 100;
  bucketsMap.set(from, (bucketsMap.get(from) || 0) + 1);
}
const buckets = [...bucketsMap.entries()]
  .map(([from, count]) => ({ from, count }))
  .sort((a, b) => a.from - b.from);

// 朝代×区间（取记录最多的 8 个朝代）
const dynCount = new Map();
for (const r of rows) dynCount.set(r.dy, (dynCount.get(r.dy) || 0) + 1);
const topDynasties = [...dynCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([dy]) => dy);

const byDynasty = topDynasties.map((dy) => {
  const m = new Map();
  for (const r of rows) {
    if (r.dy !== dy) continue;
    const from = Math.floor((r.y - 1) / 100) * 100;
    m.set(from, (m.get(from) || 0) + 1);
  }
  return {
    dynasty: dy,
    buckets: [...m.entries()].map(([from, count]) => ({ from, count })).sort((a, b) => a.from - b.from),
  };
});

const meta = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  source: { name: "CBDB 中国历代人物传记资料库", release_file: "cbdb_20260905.sqlite3", release_date: "2026-09-05" },
  method: "指数年取 BIOG_MAIN.c_index_year（CBDB 推算的编年基准，非真实生年），有效范围 0<year<2000；按 100 年区间聚合",
  stats: { total, withYear: rows.length, missing: total - rows.length, bucketCount: buckets.length },
  buckets,
  byDynasty,
};
writeFileSync(join(ROOT, "public", "index", "cbdb", "person-years.json"), JSON.stringify(meta));
console.log(`=== 完成 ===`);
console.log(`全量区间 ${buckets.length} 个 / 朝代 ${byDynasty.length} 个`);
console.log(`样例: ${JSON.stringify(buckets.slice(0, 3))}`);
db.close();
