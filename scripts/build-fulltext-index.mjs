/**
 * 全量倒排索引构建脚本（真实数据接入：支持真正全文检索）—— 编排层
 *
 * 数据源：public/index/daizhige-catalog.json（由 build:catalog 生成，指向 garychowcmu/daizhigev20）
 * 产出：public/index/fulltext-index.json  { term: string[]bookId }
 *       public/index/chapters.json       { [bookId]: [{title,start,end}] }
 *
 * 流程：逐一下载上游 TXT → 繁→简归一化 → 二元组+单字分词 → 倒排索引（term → 命中文献 ID 列表）
 * 检索时（lib/search.ts searchFulltext）对查询做同样分词，取各 term 命中文献交集并按命中词数排序。
 *
 * 用法：
 *   npm run build:fulltext                 # 全量（15,694 部，约 4.9GB，耗时较长，建议后台运行）
 *   npm run build:fulltext -- --limit 50   # 仅前 50 部，用于验证脚本正确性
 *
 * 说明：倒排索引仅存「文献 ID 列表」而非原文，体积可控；命中结果链接到阅读页，正文按需加载。
 * 因单字高频虚词会膨胀索引且无区分度，已裁剪（STOP 表 + 每词文献数上限）。
 *
 * 纯逻辑（归一化/分词/章节清单/下载/裁剪）见 scripts/lib/fulltextParts.mjs。
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chapterBoundaries } from "../lib/chapterParse.ts";
import {
  STOP,
  tokenize,
  buildChapterManifest,
  fetchBookText,
  trimIndex,
} from "./lib/fulltextParts.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CATALOG_PATH = resolve(ROOT, "public/index/daizhige-catalog.json");
const OUT = resolve(ROOT, "public/index/fulltext-index.json");

const argv = process.argv.slice(2);
const limitIdx = argv.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? parseInt(argv[limitIdx + 1], 10) : Infinity;

if (!existsSync(CATALOG_PATH)) {
  console.error("❌ 缺少 public/index/daizhige-catalog.json，请先运行 `npm run build:catalog`");
  process.exit(1);
}
const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));

const books = catalog.books.slice(0, Math.min(catalog.books.length, isFinite(LIMIT) ? LIMIT : catalog.books.length));
const index = {};
const chaptersMap = {}; // { [bookId]: [{title, start, end}] } 章节字节偏移清单（单文件，便于入库与部署）
let done = 0;

// 注意：CONCURRENCY 只重叠网络 I/O；JS 是单线程，分词与章节解析仍是串行 CPU 工作，
// 因此本步骤的墙钟时间 ≈ 下载时间 + 全部文本的 CPU 处理时间，两者不可互相掩盖。
// 【C8】默认 12（原 8）：上游是 CDN/raw，适度提高并发可压缩纯 I/O 段；
// 上限 32 以避免触发上游限流（限流会让重试次数上升，反而更慢）。
const CONCURRENCY = (() => {
  const v = parseInt(process.env.FULLTEXT_CONCURRENCY || "", 10);
  return Number.isFinite(v) && v > 0 ? Math.min(v, 32) : 12;
})();
const startedAt = Date.now();

// 【C8】可选：优先走 CDN 镜像（jsDelivr / statically）。默认仍以 raw 主源优先
// （行为最可预期），需要 CDN 优先时在 CI 设 FULLTEXT_MIRROR_FIRST=1。
const FETCH_OPTS = {
  timeout: 120000,
  retries: 2,
  mirrorFirst: process.env.FULLTEXT_MIRROR_FIRST === "1",
};

async function worker(queue) {
  while (queue.length) {
    const b = queue.shift();
    try {
      const text = await fetchBookText(b, FETCH_OPTS);
      if (text === null) continue;
      for (const term of tokenize(text)) {
        if (term.length === 1 && STOP.has(term)) continue;
        (index[term] ||= []).push(b.id);
      }
      // 章节字节偏移清单（供阅读页 Range 分片懒加载，复用本次下载）
      try {
        const bounds = chapterBoundaries(text);
        if (bounds.length > 0) chaptersMap[b.id] = buildChapterManifest(text, bounds);
      } catch (e) {
        console.warn(`⚠️ 章节清单生成失败 ${b.id}: ${e.message}`);
      }
    } catch (e) {
      console.warn(`⚠️ 失败 ${b.id}: ${e.message}`);
    } finally {
      done++;
      if (done % 200 === 0) {
        const pct = ((done / books.length) * 100).toFixed(1);
        const heapMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        console.log(
          `进度 ${done}/${books.length} (${pct}%) · 已用 ${Math.round((Date.now() - startedAt) / 1000)}s · heap ${heapMB}MB`
        );
      }
    }
  }
}

console.log(`[1/2] 下载并索引 ${books.length} 部 TXT（并发 ${CONCURRENCY}）...`);
const queue = [...books];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

// 去重 + 每词文献数上限（控制体积，保留区分度最高的前 N 部）
const trimmed = trimIndex(index);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(trimmed), "utf8");
console.log(`[2/2] ✅ 全量倒排索引: ${OUT}`);
console.log(`  词条数: ${Object.keys(trimmed).length}`);
console.log(`  覆盖文献: ${books.length} 部`);
console.log(`  索引体积: ${(Buffer.byteLength(JSON.stringify(trimmed)) / 1024 / 1024).toFixed(1)} MB`);

// 章节字节偏移清单（单文件：{ [bookId]: [{title,start,end}] }，便于入库与部署）
if (Object.keys(chaptersMap).length) {
  const out = resolve(ROOT, "public/index/chapters.json");
  writeFileSync(out, JSON.stringify(chaptersMap), "utf8");
  const count = Object.keys(chaptersMap).length;
  console.log(`  章节清单: ${count} 部 → public/index/chapters.json`);
  console.log(`  章节清单体积: ${(Buffer.byteLength(JSON.stringify(chaptersMap)) / 1024 / 1024).toFixed(1)} MB`);
}
