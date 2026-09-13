/**
 * 从已发布的分片产物重建 meta.json 的 surnames 索引（无需 CBDB sqlite）
 *
 * 背景（为什么要单独有这个工具）：
 *   `build-cbdb-index.mjs` 的分片循环对**所有** `count >= THRESHOLD(50)` 的姓氏都写了
 *   独立文件，但 meta.json 曾把 `surnames` 截断为前 200 条（`slice(0, 200)`）。
 *   对落在 200 名之后、人数却 ≥50 的姓氏，前端 `loadSurnamePersons` 在 meta 中查不到
 *   entry，只能回退 `_others.json`；而这些人被写进了各自的孤儿分片、并不在 others 里，
 *   于是「搜索能命中、点进详情报未找到」。
 *   实测：281 个姓氏 / 39,850 位人物不可达（约占 CBDB 全库 6%）。
 *
 *   该字段完全可由磁盘产物推导（分片文件名 = 姓氏，数组长度 = 人数；others 每条首字段
 *   即姓氏），因此无需重跑 5GB 上游 sqlite 即可原地修复已发布的 meta.json。
 *
 * 用法：
 *   node scripts/rebuild-cbdb-surnames-meta.mjs           # 重建并写回 meta.json
 *   node scripts/rebuild-cbdb-surnames-meta.mjs --check   # 只校验，不一致则以 1 退出
 *
 * 自校验（任一失败即中止，不写盘）：
 *   ① 姓氏条目数 === meta.surnameTotal
 *   ② 独立分片人数 + others 条数 === meta.total
 *   ③ 姓氏无重复
 *   ④ 不存在「既是独立分片、又出现在 others」的姓氏
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CBDB_DIR = join(ROOT, "public/index/cbdb");
const SURNAME_DIR = join(CBDB_DIR, "surnames");
const META_PATH = join(CBDB_DIR, "meta.json");
const OTHERS_FILE = "_others.json";
const CHECK_ONLY = process.argv.includes("--check");

const meta = JSON.parse(readFileSync(META_PATH, "utf8"));

// ① 独立分片：文件名去掉 .json 即姓氏，数组长度即人数
const shardFiles = readdirSync(SURNAME_DIR).filter((f) => f.endsWith(".json") && f !== OTHERS_FILE);
const standalone = shardFiles.map((f) => {
  const surname = f.replace(/\.json$/, "");
  const list = JSON.parse(readFileSync(join(SURNAME_DIR, f), "utf8"));
  return {
    surname,
    count: list.length,
    // 与 build-cbdb-index.mjs 保持完全一致的 URL 安全路径写法：
    // 磁盘文件名为真实中文，meta 存 encodeURIComponent 后的路径，由静态服务器解码回中文
    file: `surnames/${encodeURIComponent(surname)}.json`,
    standalone: true,
  };
});

// ② 小姓合集：每条首字段即姓氏
const others = JSON.parse(readFileSync(join(SURNAME_DIR, OTHERS_FILE), "utf8"));
const othersCount = new Map();
for (const row of others) othersCount.set(row[0], (othersCount.get(row[0]) || 0) + 1);
const nonStandalone = [...othersCount.entries()].map(([surname, count]) => ({
  surname,
  count,
  standalone: false,
}));

// 排序与 build-cbdb-index.mjs 一致（人数降序），同人数时按姓氏定序以保证可复现
const surnames = [...standalone, ...nonStandalone].sort(
  (a, b) => b.count - a.count || (a.surname < b.surname ? 1 : a.surname > b.surname ? -1 : 0)
);

// ---------- 自校验 ----------
const problems = [];
if (surnames.length !== meta.surnameTotal) {
  problems.push(`姓氏条目数 ${surnames.length} ≠ meta.surnameTotal ${meta.surnameTotal}`);
}
const peopleInShards = standalone.reduce((a, s) => a + s.count, 0);
if (peopleInShards + others.length !== meta.total) {
  problems.push(
    `分片人数 ${peopleInShards} + others ${others.length} = ${peopleInShards + others.length} ≠ meta.total ${meta.total}`
  );
}
const nameSet = new Set();
for (const s of surnames) {
  if (nameSet.has(s.surname)) problems.push(`姓氏重复：${s.surname}`);
  nameSet.add(s.surname);
}
const overlap = standalone.filter((s) => othersCount.has(s.surname)).map((s) => s.surname);
if (overlap.length) {
  problems.push(`同时存在于独立分片与 others 的姓氏 ${overlap.length} 个：${overlap.slice(0, 10).join(" ")}`);
}

if (problems.length) {
  console.error("❌ 索引自校验失败，未写入：");
  problems.forEach((p) => console.error(`   · ${p}`));
  process.exit(1);
}

console.log("✅ 自校验通过");
console.log(`   姓氏条目      ${surnames.length}（独立分片 ${standalone.length} + 小姓 ${nonStandalone.length}）`);
console.log(`   覆盖人物      ${peopleInShards + others.length}（分片 ${peopleInShards} + others ${others.length}）`);
console.log(`   原 meta 条目  ${meta.surnames.length}`);

const prevNames = new Set(meta.surnames.map((s) => s.surname));
const recovered = surnames.filter((s) => !prevNames.has(s.surname));
const recoveredPeople = recovered.reduce((a, s) => a + s.count, 0);
console.log(`   本次补回      ${recovered.length} 个姓氏 / ${recoveredPeople.toLocaleString()} 位人物`);

if (CHECK_ONLY) {
  if (recovered.length === 0 && meta.surnames.length === surnames.length) {
    console.log("✅ --check：meta.json 已完整，无需重建");
    process.exit(0);
  }
  console.error(`❌ --check：meta.json 缺少 ${recovered.length} 个姓氏`);
  process.exit(1);
}

// 只替换 surnames 字段，其余元数据（total / female / source / generatedAt / dynasty…）保持不变
writeFileSync(META_PATH, JSON.stringify({ ...meta, surnames }, null, 0), "utf8");
console.log(`✅ 已写回 ${META_PATH}`);
