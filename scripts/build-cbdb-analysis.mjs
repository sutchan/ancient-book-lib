/**
 * 从 CBDB SQLite 生成两类分析统计产物：
 *  1) 人物籍贯省级分布（BIOG_ADDR_DATA c_addr_type=1 上溯 ADDR_BELONGS_DATA 到省级）
 *  2) 官职-朝代联动（POSTED_TO_OFFICE_DATA × BIOG_MAIN 朝代）
 * 产物：public/index/cbdb/geo/geo-meta.json + public/index/cbdb/offices/offices-dynasty.json
 * 用法：node scripts/build-cbdb-analysis.mjs [sqlite路径]
 */
import Database from "better-sqlite3";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEFAULT_SQLITE = join(ROOT, "tmp", "cbdb", "cbdb_20260905.sqlite3");
const SQLITE = process.argv[2] || DEFAULT_SQLITE;

console.log(`读取 SQLite: ${SQLITE}`);
const db = new Database(SQLITE, { readonly: true });

// ---------- 1. 人物籍贯省级分布 ----------
console.log("提取籍贯地址...");
// 地址表
const addrRows = db.prepare("SELECT c_addr_id, c_name_chn, c_admin_type FROM ADDR_CODES").all();
const addrMap = new Map();
for (const r of addrRows) {
  addrMap.set(r.c_addr_id, { name: r.c_name_chn, type: r.c_admin_type });
}
// 从属关系（取最新时间段的一条）
const belongsRows = db.prepare(
  "SELECT c_addr_id, c_belongs_to FROM ADDR_BELONGS_DATA GROUP BY c_addr_id, c_belongs_to HAVING MAX(c_lastyear)"
).all();
const belongs = new Map();
for (const r of belongsRows) {
  if (!belongs.has(r.c_addr_id)) belongs.set(r.c_addr_id, r.c_belongs_to);
}

const CHAODAI = new Set(["Chaodai"]);
const INVALID = new Set(["[缺乏信息]", "[Unknown]", "[Missing Data]", "[未詳]", "未詳", ""]);

/** 上溯到省级行政区（链上最后一个非朝代节点，如 縣→府→省/道/路） */
function provinceOf(addrId) {
  let cur = addrId;
  let last = null;
  const seen = new Set();
  for (let i = 0; i < 15; i++) {
    if (!cur || cur <= 0 || seen.has(cur)) break;
    seen.add(cur);
    const a = addrMap.get(cur);
    if (!a) break;
    const type = (a.type || "").trim();
    const name = (a.name || "").trim();
    if (CHAODAI.has(type)) break; // 到朝代节点为止，上一级即省级
    if (name && !INVALID.has(name)) last = name;
    const b = belongs.get(cur);
    if (!b) break;
    cur = b;
  }
  return last;
}

// 籍贯记录：personid + 朝代 + 省份
const geoRows = db.prepare(
  `SELECT b.c_personid AS pid, b.c_addr_id AS addr, p.c_dy AS dy
   FROM BIOG_ADDR_DATA b
   JOIN BIOG_MAIN p ON p.c_personid = b.c_personid
   WHERE b.c_addr_type = 1 AND b.c_addr_id > 0`
).all();
console.log(`  籍贯记录: ${geoRows.length.toLocaleString()}`);

// 朝代映射
const dynRows = db.prepare("SELECT c_dy, c_dynasty_chn FROM DYNASTIES").all();
const dynMap = new Map(dynRows.map((r) => [r.c_dy, r.c_dynasty_chn]));

// 聚合：朝代 → 省份 → 人数
const byDynastyProvince = new Map(); // dynasty -> Map(province -> count)
const provinceTotal = new Map(); // province -> count
let geoPerson = 0;
const seenPerson = new Set();
for (const r of geoRows) {
  const province = provinceOf(r.addr);
  if (!province) continue;
  const dynasty = dynMap.get(r.dy) || "未詳";
  if (!byDynastyProvince.has(dynasty)) byDynastyProvince.set(dynasty, new Map());
  const pm = byDynastyProvince.get(dynasty);
  pm.set(province, (pm.get(province) || 0) + 1);
  provinceTotal.set(province, (provinceTotal.get(province) || 0) + 1);
  if (!seenPerson.has(r.pid)) {
    seenPerson.add(r.pid);
    geoPerson++;
  }
}
console.log(`  有籍贯且可归省人物: ${geoPerson.toLocaleString()} / 省级行政区 ${provinceTotal.size}`);

const topProvinces = [...provinceTotal.entries()]
  .map(([province, count]) => ({ province, count }))
  .sort((a, b) => b.count - a.count);

// 朝代 Top 12（按人数）
const byDynastyOut = [...byDynastyProvince.entries()]
  .map(([dynasty, pm]) => ({
    dynasty,
    count: [...pm.values()].reduce((s, n) => s + n, 0),
    topProvinces: [...pm.entries()]
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
  }))
  .filter((d) => d.dynasty !== "未詳")
  .sort((a, b) => b.count - a.count)
  .slice(0, 12);

const geoMeta = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  source: { name: "CBDB 中国历代人物传记资料库", release_file: "cbdb_20260905.sqlite3", release_date: "2026-09-05" },
  method: "籍贯取 BIOG_ADDR_DATA c_addr_type=1（籍貫基本地址），经 ADDR_BELONGS_DATA 上溯至省级行政区（省/道/路/軍），朝代取自 BIOG_MAIN.c_dy 映射 DYNASTIES",
  stats: { personTotal: geoPerson, provinceCount: provinceTotal.size },
  topProvinces: topProvinces.slice(0, 20),
  byDynasty: byDynastyOut,
};
mkdirSync(join(ROOT, "public", "index", "cbdb", "geo"), { recursive: true });
writeFileSync(join(ROOT, "public", "index", "cbdb", "geo", "geo-meta.json"), JSON.stringify(geoMeta));
console.log(`  geo-meta.json: ${JSON.stringify(geoMeta.stats)}`);

// ---------- 2. 官职-朝代联动 ----------
console.log("\n提取官职-朝代联动...");
const offDynRows = db.prepare(
  `SELECT o.c_office_chn AS office, d.c_dynasty_chn AS dynasty
   FROM POSTED_TO_OFFICE_DATA po
   JOIN OFFICE_CODES o ON o.c_office_id = po.c_office_id
   JOIN BIOG_MAIN p ON p.c_personid = po.c_personid
   JOIN DYNASTIES d ON d.c_dy = p.c_dy
   WHERE po.c_personid > 0 AND po.c_office_id > 0
     AND o.c_office_chn IS NOT NULL AND o.c_office_chn != '' AND o.c_office_chn != '未詳'
     AND d.c_dynasty_chn IS NOT NULL AND d.c_dynasty_chn != '未詳'`
).all();
console.log(`  任职-朝代记录: ${offDynRows.length.toLocaleString()}`);

const dynOffice = new Map(); // dynasty -> Map(office -> count)
const dynPerson = new Map(); // dynasty -> Set(personid)
const offPersonRows = db.prepare(
  `SELECT po.c_personid AS pid, d.c_dynasty_chn AS dynasty
   FROM POSTED_TO_OFFICE_DATA po
   JOIN BIOG_MAIN p ON p.c_personid = po.c_personid
   JOIN DYNASTIES d ON d.c_dy = p.c_dy
   WHERE po.c_personid > 0 AND po.c_office_id > 0
     AND d.c_dynasty_chn IS NOT NULL AND d.c_dynasty_chn != '未詳'
   GROUP BY po.c_personid, d.c_dynasty_chn`
).all();
for (const r of offPersonRows) {
  if (!dynPerson.has(r.dynasty)) dynPerson.set(r.dynasty, new Set());
  dynPerson.get(r.dynasty).add(r.pid);
}
for (const r of offDynRows) {
  if (!dynOffice.has(r.dynasty)) dynOffice.set(r.dynasty, new Map());
  const om = dynOffice.get(r.dynasty);
  om.set(r.office, (om.get(r.office) || 0) + 1);
}

const offDynOut = [...dynOffice.entries()]
  .map(([dynasty, om]) => ({
    dynasty,
    officeTotal: [...om.values()].reduce((s, n) => s + n, 0),
    personTotal: dynPerson.get(dynasty)?.size || 0,
    topOffices: [...om.entries()]
      .map(([office, count]) => ({ office, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
  }))
  .sort((a, b) => b.officeTotal - a.officeTotal)
  .slice(0, 12);

const offDynMeta = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  source: { name: "CBDB 中国历代人物传记资料库", release_file: "cbdb_20260905.sqlite3", release_date: "2026-09-05" },
  method: "任职 POSTED_TO_OFFICE_DATA × BIOG_MAIN.c_dy（朝代）聚合，官职为 OFFICE_CODES 原始名称",
  stats: { officeTotal: offDynRows.length, dynastyCount: offDynOut.length },
  byDynasty: offDynOut,
};
writeFileSync(
  join(ROOT, "public", "index", "cbdb", "offices", "offices-dynasty.json"),
  JSON.stringify(offDynMeta)
);
console.log(`  offices-dynasty.json: ${offDynOut.length} 个朝代`);
console.log(`  样例: ${JSON.stringify(offDynOut[0]?.topOffices.slice(0, 5))}`);

console.log("\n=== 完成 ===");
db.close();
