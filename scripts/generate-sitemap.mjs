/**
 * 构建后生成 sitemap.xml
 * 扫描 out/ 目录下所有 index.html，生成站点地图
 * 用法：node scripts/generate-sitemap.mjs
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "out");
// 生产站点：https://guji.ewuse.com/（根路径）；GitHub Pages 子路径部署时由环境传入
const SITE_URL = process.env.SITE_URL || "https://guji.ewuse.com";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (entry === "index.html") {
      files.push(full);
    }
  }
  return files;
}

const htmlFiles = walk(OUT_DIR);
const urls = htmlFiles
  .map((f) => {
    let rel = relative(OUT_DIR, f).replace(/\\/g, "/").replace(/\/index\.html$/, "/");
    if (rel === "") rel = "";
    // 去掉 basePath 前缀（out 目录结构已包含 basePath？需要确认）
    const url = rel ? `${SITE_URL}${BASE_PATH}/${rel}` : `${SITE_URL}${BASE_PATH}/`;
    return url;
  })
  .filter((url) => !url.includes("/_next/") && !url.includes("/404"));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join("\n")}
</urlset>
`;

writeFileSync(join(OUT_DIR, "sitemap.xml"), sitemap, "utf8");
console.log(`sitemap.xml 已生成，共 ${urls.length} 个 URL`);
