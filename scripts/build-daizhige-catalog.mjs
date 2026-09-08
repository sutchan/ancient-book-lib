/**
 * 生成殆知阁 v20 全量书目索引（不复制任何 TXT，仅存路径元数据）
 * 数据源：https://github.com/garychowcmu/daizhigev20（master 分支）
 * 输出：public/index/daizhige-catalog.json
 *
 * 用法：node scripts/build-daizhige-catalog.mjs
 * 依赖：仅 Node 内置 fetch（Node ≥ 18），无需 GitHub Token（Trees API 单次调用）
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public/index/daizhige-catalog.json");

const REPO = "garychowcmu/daizhigev20";
const BRANCH = "master";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
const TREE_API = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;

console.log(`[1/3] 拉取 ${REPO} 全量文件树...`);
const resp = await fetch(TREE_API, {
  headers: { "User-Agent": "ancient-book-lib", Accept: "application/vnd.github+json" },
});
if (!resp.ok) {
  console.error(`GitHub API 失败: ${resp.status} ${resp.statusText}`);
  process.exit(1);
}
const data = await resp.json();
if (data.truncated) {
  console.warn("⚠️  文件树被截断（truncated=true），索引不完整！");
}

console.log(`[2/3] 解析 ${data.tree.length} 个节点，过滤 TXT...`);
const books = [];
let id = 0;
for (const node of data.tree) {
  if (node.type !== "blob" || !node.path.endsWith(".txt")) continue;
  const parts = node.path.split("/");
  const category = parts[0]; // 一级：馆藏（佛藏/儒藏/...）
  const title = parts[parts.length - 1].replace(/\.txt$/, "");
  const subcategories = parts.slice(1, parts.length - 1); // 中间层级
  books.push({
    id: `dzg-${String(++id).padStart(5, "0")}`,
    title,
    category,
    subcategories,
    path: node.path,
    size: node.size,
    rawUrl: RAW_BASE + encodeURI(node.path),
  });
}

// 按馆藏统计
const stats = {};
for (const b of books) {
  stats[b.category] = (stats[b.category] || 0) + 1;
}
const totalSize = books.reduce((s, b) => s + b.size, 0);

const catalog = {
  source: `https://github.com/${REPO}`,
  branch: BRANCH,
  generatedAt: new Date().toISOString(),
  total: books.length,
  totalSizeBytes: totalSize,
  stats,
  books,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(catalog), "utf8");

console.log(`[3/3] 索引已写入: ${OUT}`);
console.log(`  书目总数: ${books.length}`);
console.log(`  总数据量: ${(totalSize / 1024 / 1024).toFixed(1)} MB（上游原始 TXT，本仓库不复制）`);
console.log(`  索引文件: ${(Buffer.byteLength(JSON.stringify(catalog)) / 1024).toFixed(1)} KB`);
console.log(`  馆藏分布:`);
for (const [cat, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${cat}: ${count} 本`);
}
