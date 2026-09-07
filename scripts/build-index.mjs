/**
 * 数据提取脚本：将 prototype/data/app-data.js 转换为 lib/data-generated.ts
 * 单一数据源：修改原型数据后运行 `npm run build:index` 同步到 Next.js 工程
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = join(__dirname, "../prototype/data/app-data.js");
const outPath = join(__dirname, "../lib/data-generated.ts");

const src = readFileSync(srcPath, "utf8");
// 在沙箱中执行 app-data.js 获取 APP_DATA 对象（其内部为 window.APP_DATA = {...}）
const sandbox = { window: {} };
new Function("window", src)(sandbox.window);
const data = sandbox.window.APP_DATA;

if (!data || !data.books) {
  console.error("数据提取失败：未能从 app-data.js 解析出 APP_DATA");
  process.exit(1);
}

const banner = `/**
 * 由 scripts/build-index.mjs 从 prototype/data/app-data.js 自动生成。
 * 请勿手动编辑；修改数据源后运行 \`npm run build:index\` 重新生成。
 */
import type { AppData } from "./types";

const data: AppData = `;

const body = JSON.stringify(data, null, 2)
  .replace(/"version": "([^"]+)"/, '"version": "$1"');

writeFileSync(outPath, banner + body + ";\n\nexport default data;\n", "utf8");
console.log(`✅ 已生成 ${outPath}`);
console.log(`  馆藏 ${data.categories.length} · 典籍 ${data.books.length} · 人物 ${data.characters.length} · 关系 ${data.relations.length}`);
