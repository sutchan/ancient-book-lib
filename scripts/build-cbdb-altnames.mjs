/**
 * 从 CBDB SQLite 提取人物别名字号索引（ALTNAME_DATA + ALTNAME_CODES）
 * 产物：public/index/cbdb/altnames/（altnames-meta.json + altnames.json + altnames-search.json）
 * 用法：node scripts/build-cbdb-altnames.mjs [sqlite路径]
 */
import Database from "better-sqlite3";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEFAULT_SQLITE = join(ROOT, "tmp", "cbdb", "cbdb_20260905.sqlite3");
const SQLITE = process.argv[2] || DEFAULT_SQLITE;
const OUT_DIR = join(ROOT, "public", "index", "cbdb", "altnames");

console.log(`读取 SQLite: ${SQLITE}`);
const db = new Database(SQLITE, { readonly: true });

// 类型代码表（过滤缺失/未詳）
const codeRows = db.prepare("SELECT c_name_type_code, c_name_type_desc_chn FROM ALTNAME_CODES").all();
const nameTypes = {};
for (const r of codeRows) {
  if (r.c_name_type_code > 0 && r.c_name_type_desc_chn && !r.c_name_type_desc_chn.includes("Missing")) {
    nameTypes[r.c_name_type_code] = r.c_name_type_desc_chn.trim();
  }
}

// 别名数据（过滤 空名/未詳/缺失）
console.log("提取别名字号...");
const rows = db
  .prepare(
    `SELECT c_personid AS pid, c_alt_name_chn AS name, c_alt_name_type_code AS code
     FROM ALTNAME_DATA WHERE c_personid > 0 AND c_alt_name_type_code > 0`
  )
  .all();
const valid = rows.filter((r) => {
  const n = (r.name || "").trim();
  return n && n !== "未詳" && n !== "[Missing Data]";
});
console.log(`  有效别名: ${valid.length.toLocaleString()} / 涉及人物: ${new Set(valid.map((r) => r.pid)).size.toLocaleString()}`);

// 按 personid 排序
const byPerson = valid.sort((a, b) => a.pid - b.pid || a.code - b.code);
// 紧凑数组 [personid, 别名, 类型code]
const compact = byPerson.map((r) => [r.pid, r.name.trim(), r.code]);

// 别名检索索引：[别名, personid] 按中文字典序
const search = valid
  .map((r) => [r.name.trim(), r.pid])
  .sort((a, b) => a[0].localeCompare(b[0], "zh"));

// 别名人物姓名映射：[personid, 姓名] 按 id 排序（供别名命中后反查姓名）
const personRows = db
  .prepare(
    `SELECT p.c_personid AS pid, p.c_name_chn AS name
     FROM BIOG_MAIN p
     WHERE p.c_personid IN (SELECT DISTINCT c_personid FROM ALTNAME_DATA WHERE c_alt_name_type_code > 0)`
  )
  .all();
const personMap = personRows
  .map((r) => [r.pid, r.name])
  .sort((a, b) => a[0] - b[0]);
console.log(`  别名人物姓名映射: ${personMap.length.toLocaleString()} 条`);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "altnames.json"), JSON.stringify(compact));
writeFileSync(join(OUT_DIR, "altnames-search.json"), JSON.stringify(search));
writeFileSync(join(OUT_DIR, "altnames-person.json"), JSON.stringify(personMap));

const meta = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  source: { name: "CBDB 中国历代人物传记资料库", release_file: "cbdb_20260905.sqlite3", release_date: "2026-09-05" },
  stats: {
    altnameTotal: compact.length,
    personTotal: new Set(valid.map((r) => r.pid)).size,
  },
  nameTypes,
};
writeFileSync(join(OUT_DIR, "altnames-meta.json"), JSON.stringify(meta));

let totalBytes = 0;
for (const f of ["altnames-meta.json", "altnames.json", "altnames-search.json", "altnames-person.json"]) {
  totalBytes += statSync(join(OUT_DIR, f)).size;
}
console.log(`\n=== 完成 ===`);
console.log(`别名 ${compact.length.toLocaleString()} 条 / 人物 ${meta.stats.personTotal.toLocaleString()} 人 / 体积 ${(totalBytes / 1024 / 1024).toFixed(1)} MB → ${OUT_DIR}`);
db.close();
