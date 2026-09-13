/**
 * 构建 CBDB（中国历代人物传记资料库）精简人物索引 —— 编排层
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
 *
 * 纯逻辑（清洗/分片/索引/meta）见 scripts/lib/cbdbIndexParts.mjs。
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import {
  SURNAME_THRESHOLD,
  extractPersons,
  shardBySurname,
  buildSearchIndex,
  buildMeta,
} from "./lib/cbdbIndexParts.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const sqlitePath =
  process.argv[2] || join(ROOT, "tmp", "cbdb", "cbdb_20260905.sqlite3");
const OUT_DIR = join(ROOT, "public", "index", "cbdb");
const SURNAME_DIR = join(OUT_DIR, "surnames");

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

// 3. 清洗 + 4. 按姓氏分片
const persons = extractPersons(rows);
console.log(`清洗后 ${persons.length.toLocaleString()} 人`);
const { bySurname, surnameList } = shardBySurname(persons);

// 5. 输出：大姓氏单独成片（≥阈值），小姓氏合并到 others.json
mkdirSync(SURNAME_DIR, { recursive: true });
const surnameMeta = [];
const others = [];

for (const { surname, count } of surnameList) {
  const list = bySurname.get(surname);
  if (count >= SURNAME_THRESHOLD) {
    // 磁盘文件名用真实中文（与 fetch 时服务器对 %XX 解码后的结果一致，避免 404）；
    // meta.file 仍存 URL 安全路径（encodeURIComponent），前端 fetch 由服务器解码回真实名
    writeFileSync(join(OUT_DIR, `surnames/${surname}.json`), JSON.stringify(list), "utf8");
    surnameMeta.push({ surname, count, file: `surnames/${encodeURIComponent(surname)}.json`, standalone: true });
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
const searchIndex = buildSearchIndex(persons);
writeFileSync(join(OUT_DIR, "search.json"), JSON.stringify(searchIndex), "utf8");

// 7. meta.json
const meta = buildMeta({ persons, surnameMeta, surnameList, searchIndexSize: searchIndex.length });

// 防回归断言：meta.surnames 必须与姓氏总数一致。
// 二者不一致即意味着有姓氏「分片已写盘但 meta 查不到」→ 前端回退 _others.json 也找不到
// （那些人不在 others 里）→ 人物不可达。宁可让构建失败，也不要产出静默丢人的索引。
if (meta.surnames.length !== meta.surnameTotal) {
  console.error(
    `❌ meta.surnames(${meta.surnames.length}) 与 surnameTotal(${meta.surnameTotal}) 不一致，索引不完整`
  );
  process.exit(1);
}

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
console.log(`姓氏数量: ${meta.surnameTotal}（全部列于 meta.json）`);
console.log(`独立分片: ${surnameMeta.filter((s) => s.standalone).length} 个 + others`);
console.log(`搜索索引: ${searchIndex.length.toLocaleString()} 条`);
console.log(`总大小: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`输出目录: ${OUT_DIR}`);
