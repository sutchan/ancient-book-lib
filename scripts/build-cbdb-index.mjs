/**
 * 构建 CBDB（中国历代人物传记资料库）精简人物索引
 *
 * 上游数据：cbdb-project/cbdb_sqlite（HuggingFace 发布），2026-09-05 版
 * 产物：public/index/cbdb/
 *   - meta.json         统计信息（总人数/朝代分布/姓氏列表/数据源）
 *   - surnames/*.json   按姓氏分片的人物数据（紧凑数组）
 *   - search.json       全量姓名索引（按姓名排序，用于前端搜索）
 *
 * 用法：
 *   node scripts/build-cbdb-index.mjs [sqlite路径]
 * 默认读取 tmp/cbdb/cbdb_20260905.sqlite3
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const sqlitePath =
  process.argv[2] || join(ROOT, "tmp", "cbdb", "cbdb_20260905.sqlite3");
const OUT_DIR = join(ROOT, "public", "index", "cbdb");
const SURNAME_DIR = join(OUT_DIR, "surnames");

// 数据源信息（真实，来自 CBDB 官方发布）
const SOURCE = {
  name: "CBDB 中国历代人物传记资料库",
  url: "https://cbdb.hsites.harvard.edu/",
  sqlite_repo: "https://github.com/cbdb-project/cbdb_sqlite",
  release_file: "cbdb_20260905.sqlite3",
  release_date: "2026-09-05",
  sha256: "437a253a8e49cb24d2d5209234781d03fcbcc04476aafc3cf9d68453cea7e980",
  license: "CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）",
};

if (!existsSync(sqlitePath)) {
  console.error(`SQLite 文件不存在: ${sqlitePath}`);
  console.error("请先下载 CBDB 数据库到 tmp/cbdb/，或通过参数指定路径");
  process.exit(1);
}

console.log("读取 CBDB SQLite:", sqlitePath);
const db = new Database(sqlitePath, { readonly: true });

// 1. 校验数据完整性（快速）
const integrity = db.pragma("integrity_check")[0].integrity_check;
if (integrity !== "ok") {
  console.error("SQLite 完整性校验失败:", integrity);
  process.exit(1);
}

// 2. 提取人物数据（join 朝代 + 籍贯）
console.log("提取人物数据...");
const rows = db
  .prepare(
    `SELECT
       p.c_personid AS id,
       p.c_name_chn AS name,
       p.c_name AS pinyin,
       p.c_birthyear AS birth,
       p.c_deathyear AS death,
       p.c_index_year AS indexYear,
       p.c_female AS female,
       COALESCE(d.c_dynasty_chn, '') AS dynasty,
       COALESCE(a.c_name_chn, '') AS place
     FROM BIOG_MAIN p
     LEFT JOIN DYNASTIES d ON p.c_dy = d.c_dy
     LEFT JOIN ADDR_CODES a ON p.c_index_addr_id = a.c_addr_id
     WHERE p.c_personid > 0
       AND p.c_name_chn IS NOT NULL
       AND p.c_name_chn != ''
     ORDER BY p.c_personid`
  )
  .all();

db.close();

console.log(`提取 ${rows.length.toLocaleString()} 位人物`);

// 3. 清洗：过滤占位籍贯/姓名
const PLACE_BLACKLIST = ["[信息缺乏]", "[未詳]", "[Unknown]", "[Missing Data]"];
const persons = rows
  .map((r) => {
    const name = (r.name || "").trim();
    if (!name) return null;
    const place = PLACE_BLACKLIST.includes((r.place || "").trim())
      ? ""
      : (r.place || "").trim();
    const dynasty = r.dynasty || "";
    return [
      r.id,
      name,
      r.pinyin || "",
      r.birth || 0,
      r.death || 0,
      r.indexYear || 0,
      r.female ? 1 : 0,
      dynasty,
      place,
    ];
  })
  .filter(Boolean);

console.log(`清洗后 ${persons.length.toLocaleString()} 人`);

// 4. 按姓氏分片
const bySurname = new Map();
for (const p of persons) {
  const surname = p[1].charAt(0);
  if (!bySurname.has(surname)) bySurname.set(surname, []);
  bySurname.get(surname).push(p);
}

// 姓氏列表：人数降序
const surnameList = [...bySurname.entries()]
  .map(([surname, list]) => ({ surname, count: list.length }))
  .sort((a, b) => b.count - a.count);

// 5. 输出
mkdirSync(SURNAME_DIR, { recursive: true });

// 大姓氏单独成片（≥50 人），小姓氏合并到 others.json
const THRESHOLD = 50;
const surnameMeta = [];
const others = [];

for (const { surname, count } of surnameList) {
  const list = bySurname.get(surname);
  if (count >= THRESHOLD) {
    const file = `surnames/${encodeURIComponent(surname)}.json`;
    writeFileSync(join(OUT_DIR, file), JSON.stringify(list), "utf8");
    surnameMeta.push({ surname, count, file, standalone: true });
  } else {
    others.push(...list.map((p) => [surname, ...p]));
    surnameMeta.push({ surname, count, standalone: false });
  }
}

// others.json：小姓氏合并（每条首字段为姓氏）
if (others.length > 0) {
  writeFileSync(join(OUT_DIR, "surnames/_others.json"), JSON.stringify(others), "utf8");
}

// 6. 姓名搜索索引（按姓名排序，前端可二分/前缀匹配）
console.log("生成姓名搜索索引...");
const searchIndex = persons.map((p) => [p[1], p[0]]).sort((a, b) => a[0].localeCompare(b[0], "zh"));
writeFileSync(join(OUT_DIR, "search.json"), JSON.stringify(searchIndex), "utf8");

// 7. meta.json
const dynastyCount = {};
for (const p of persons) {
  const d = p[7] || "未詳";
  dynastyCount[d] = (dynastyCount[d] || 0) + 1;
}
const dynastyList = Object.entries(dynastyCount)
  .map(([dynasty, count]) => ({ dynasty, count }))
  .sort((a, b) => b.count - a.count);

const femaleCount = persons.filter((p) => p[6] === 1).length;

const meta = {
  total: persons.length,
  female: femaleCount,
  source: SOURCE,
  generatedAt: new Date().toISOString().slice(0, 10),
  dynasty: dynastyList,
  surnames: surnameMeta.slice(0, 200), // 前 200 个姓氏
  surnameTotal: surnameList.length,
  searchIndexSize: searchIndex.length,
  note: "人物数据字段: [id, 姓名, 拼音, 生年, 卒年, 指数年, 性别(1女), 朝代, 籍贯]",
};

writeFileSync(join(OUT_DIR, "meta.json"), JSON.stringify(meta), "utf8");

// 8. 统计输出
let totalBytes = 0;
for (const f of [
  "meta.json",
  "search.json",
  "surnames/_others.json",
  ...surnameMeta.filter((s) => s.standalone).map((s) => s.file),
]) {
  const p = join(OUT_DIR, f);
  if (existsSync(p)) totalBytes += readFileSync(p).length;
}

console.log("=== 完成 ===");
console.log(`总人物: ${meta.total.toLocaleString()}`);
console.log(`女性: ${meta.female.toLocaleString()}`);
console.log(`姓氏数量: ${meta.surnameTotal}（前 200 列于 meta.json）`);
console.log(`独立分片: ${surnameMeta.filter((s) => s.standalone).length} 个 + others`);
console.log(`搜索索引: ${searchIndex.length.toLocaleString()} 条`);
console.log(`总大小: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`输出目录: ${OUT_DIR}`);
