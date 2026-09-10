/**
 * 从 CBDB SQLite 提取人物关系索引（亲属 KIN_DATA + 社会关系 ASSOC_DATA + 人物著作 BIOG_TEXT_DATA）
 * 产物：public/index/cbdb/rel/（rel-meta.json + kin/assoc 分片 + names.json + texts.json）
 * 用法：node scripts/build-cbdb-relations.mjs [sqlite路径]
 */
import Database from "better-sqlite3";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEFAULT_SQLITE = join(ROOT, "tmp", "cbdb", "cbdb_20260905.sqlite3");
const SQLITE = process.argv[2] || DEFAULT_SQLITE;
const OUT_DIR = join(ROOT, "public", "index", "cbdb", "rel");

const SHARD_SIZE = 10000; // 按 personid 值区间分片

const INVALID = new Set(["[missing data]", "[缺乏信息]", "[Unknown]", "[Missing Data]", "未詳", "非可用", ""]);

function validChn(s) {
  return typeof s === "string" && s.trim() && !INVALID.has(s.trim());
}

console.log(`读取 SQLite: ${SQLITE}`);
const db = new Database(SQLITE, { readonly: true });

// ---- 1. 代码表 ----
const kinCodesRaw = db.prepare("SELECT c_kincode, c_kinrel_chn FROM KINSHIP_CODES").all();
const kinCodes = {};
for (const r of kinCodesRaw) {
  if (r.c_kincode > 0 && validChn(r.c_kinrel_chn)) kinCodes[r.c_kincode] = r.c_kinrel_chn.trim();
}

const assocCodesRaw = db.prepare("SELECT c_assoc_code, c_assoc_desc_chn FROM ASSOC_CODES").all();
const assocCodes = {};
for (const r of assocCodesRaw) {
  if (r.c_assoc_code > 0 && validChn(r.c_assoc_desc_chn)) assocCodes[r.c_assoc_code] = r.c_assoc_desc_chn.trim();
}

const textRolesRaw = db.prepare("SELECT c_role_id, c_role_desc_chn FROM TEXT_ROLE_CODES").all();
const textRoles = {};
for (const r of textRolesRaw) {
  if (r.c_role_id > 0 && validChn(r.c_role_desc_chn)) textRoles[r.c_role_id] = r.c_role_desc_chn.trim();
}

// ---- 2. KIN_DATA ----
console.log("提取亲属关系...");
const kinAll = db.prepare(
  `SELECT k.c_personid AS ego, k.c_kin_id AS kin, k.c_kin_code AS code
   FROM KIN_DATA k
   WHERE k.c_personid > 0 AND k.c_kin_id > 0 AND k.c_kin_code > 0`
).all();
console.log(`  KIN 有效条目: ${kinAll.length.toLocaleString()}`);

// ---- 3. ASSOC_DATA ----
console.log("提取社会关系...");
const assocAll = db.prepare(
  `SELECT a.c_personid AS ego, a.c_assoc_id AS other, a.c_assoc_code AS code, a.c_assoc_first_year AS fy
   FROM ASSOC_DATA a
   WHERE a.c_personid > 0 AND a.c_assoc_id > 0 AND a.c_assoc_code > 0`
).all();
console.log(`  ASSOC 有效条目: ${assocAll.length.toLocaleString()}`);

// ---- 4. 关系涉及人物姓名 ----
console.log("提取关系人物姓名...");
const personIds = new Set();
for (const r of kinAll) { personIds.add(r.ego); personIds.add(r.kin); }
for (const r of assocAll) { personIds.add(r.ego); personIds.add(r.other); }
console.log(`  涉及人物: ${personIds.size.toLocaleString()}`);
const names = new Map();
const idList = [...personIds].sort((a, b) => a - b);
const BATCH = 2000;
for (let i = 0; i < idList.length; i += BATCH) {
  const chunk = idList.slice(i, i + BATCH);
  const placeholders = chunk.map(() => "?").join(",");
  const rows = db.prepare(
    `SELECT c_personid, c_name_chn FROM BIOG_MAIN WHERE c_personid IN (${placeholders}) AND c_name_chn IS NOT NULL AND c_name_chn != ''`
  ).all(...chunk);
  for (const r of rows) names.set(r.c_personid, r.c_name_chn);
}
console.log(`  有姓名人物: ${names.size.toLocaleString()}`);

// ---- 5. 人物-著作 ----
console.log("提取人物著作...");
const textsRaw = db.prepare(
  `SELECT b.c_personid AS pid, t.c_title_chn AS title, b.c_role_id AS role, b.c_year AS year
   FROM BIOG_TEXT_DATA b
   JOIN TEXT_CODES t ON t.c_textid = b.c_textid
   WHERE b.c_personid > 0 AND (t.c_title_chn IS NOT NULL AND t.c_title_chn != '')`
).all();
console.log(`  著作关联: ${textsRaw.length.toLocaleString()}`);

// ---- 6. 分片 ----
console.log("生成分片...");
mkdirSync(OUT_DIR, { recursive: true });

// 片区间：覆盖所有关系涉及的 personid
let maxId = 0;
for (const r of kinAll) { if (r.ego > maxId) maxId = r.ego; if (r.kin > maxId) maxId = r.kin; }
for (const r of assocAll) { if (r.ego > maxId) maxId = r.ego; if (r.other > maxId) maxId = r.other; }
const shardCount = Math.floor(maxId / SHARD_SIZE) + 1;

const shards = []; // { lo, hi, kinFile, assocFile, kinCount, assocCount }
for (let s = 0; s < shardCount; s++) {
  const lo = s * SHARD_SIZE;
  const hi = lo + SHARD_SIZE - 1;
  const kinShard = kinAll.filter((r) => r.ego >= lo && r.ego <= hi);
  const assocShard = assocAll.filter((r) => r.ego >= lo && r.ego <= hi);
  if (kinShard.length === 0 && assocShard.length === 0) continue;
  const shard = {
    lo,
    hi,
    kinFile: kinShard.length ? `kin-${lo}-${hi}.json` : null,
    assocFile: assocShard.length ? `assoc-${lo}-${hi}.json` : null,
    kinCount: kinShard.length,
    assocCount: assocShard.length,
  };
  shards.push(shard);
  if (kinShard.length) {
    const compact = kinShard.map((r) => [r.ego, r.kin, r.code]);
    writeFileSync(join(OUT_DIR, shard.kinFile), JSON.stringify(compact));
  }
  if (assocShard.length) {
    const compact = assocShard.map((r) => [r.ego, r.other, r.code, r.fy > 0 ? r.fy : 0]);
    writeFileSync(join(OUT_DIR, shard.assocFile), JSON.stringify(compact));
  }
}
console.log(`  分片数: ${shards.length}`);

// ---- 7. 写文件 ----
const namesOut = [...names.entries()].sort((a, b) => a[0] - b[0]).map(([id, name]) => [id, name]);
writeFileSync(join(OUT_DIR, "names.json"), JSON.stringify(namesOut));
console.log(`  names.json: ${namesOut.length.toLocaleString()} 人`);

const textsOut = textsRaw
  .map((r) => [r.pid, r.title.trim(), r.role || 0, r.year || 0])
  .sort((a, b) => a[0] - b[0]);
writeFileSync(join(OUT_DIR, "texts.json"), JSON.stringify(textsOut));
console.log(`  texts.json: ${textsOut.length.toLocaleString()} 条`);

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
    kinTotal: kinAll.length,
    assocTotal: assocAll.length,
    textTotal: textsOut.length,
    personTotal: namesOut.length,
    kinCodeCount: Object.keys(kinCodes).length,
    assocCodeCount: Object.keys(assocCodes).length,
  },
  shards,
  kinCodes,
  assocCodes,
  textRoles,
};
writeFileSync(join(OUT_DIR, "rel-meta.json"), JSON.stringify(meta));

// 统计产物体积
import { statSync } from "node:fs";
let totalBytes = 0;
for (const f of ["rel-meta.json", "names.json", "texts.json"]) {
  totalBytes += statSync(join(OUT_DIR, f)).size;
}
for (const s of shards) {
  if (s.kinFile) totalBytes += statSync(join(OUT_DIR, s.kinFile)).size;
  if (s.assocFile) totalBytes += statSync(join(OUT_DIR, s.assocFile)).size;
}
console.log(`\n=== 完成 ===`);
console.log(`亲属 ${kinAll.length.toLocaleString()} 条 / 社会 ${assocAll.length.toLocaleString()} 条 / 著作 ${textsOut.length.toLocaleString()} 条`);
console.log(`涉及人物 ${namesOut.length.toLocaleString()} 人 / 分片 ${shards.length} 个`);
console.log(`产物体积: ${(totalBytes / 1024 / 1024).toFixed(1)} MB → ${OUT_DIR}`);
db.close();
