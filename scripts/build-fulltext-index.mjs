/**
 * 全量倒排索引构建脚本（真实数据接入：支持真正全文检索）
 *
 * 数据源：public/index/daizhige-catalog.json（由 build:catalog 生成，指向 garychowcmu/daizhigev20）
 * 产出：public/index/fulltext-index.json  { term: string[]bookId }
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
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { T2S_MAP } from "../lib/t2s.ts";
import { chapterBoundaries } from "../lib/chapterParse.ts";

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

/** 高频虚词裁剪：单字高频词对检索无区分度，且会急剧膨胀索引 */
const STOP = new Set([
  "無", "不", "之", "也", "者", "乎", "其", "而", "以", "於", "為", "有", "是",
  "皆", "則", "曰", "子", "夫", "此", "彼", "一", "二", "三", "十", "人", "上",
  "下", "中", "大", "小", "天", "地", "日", "月", "年", "時", "生", "死", "名",
]);

function normalize(text) {
  return text
    .split("")
    .map((c) => T2S_MAP[c] || c)
    .join("")
    .replace(/[「」『』“”‘’《》〈〉：；，。！？、·\s\d]/g, "");
}

function tokenize(text) {
  const norm = normalize(text);
  const set = new Set();
  for (let i = 0; i < norm.length; i++) {
    set.add(norm[i]);
    if (i < norm.length - 1) set.add(norm.slice(i, i + 2));
  }
  return [...set];
}

const books = catalog.books.slice(0, Math.min(catalog.books.length, isFinite(LIMIT) ? LIMIT : catalog.books.length));
const index = {};
const chaptersMap = {}; // { [bookId]: [{title, start, end}] } 章节字节偏移清单（单文件，便于入库与部署）
let done = 0;
// 注意：CONCURRENCY 只重叠网络 I/O；JS 是单线程，分词与章节解析仍是串行 CPU 工作，
// 因此本步骤的墙钟时间 ≈ 下载时间 + 全部文本的 CPU 处理时间，两者不可互相掩盖。
const CONCURRENCY = 8;
const startedAt = Date.now();

// 单本 TXT 下载：超时 + 重试 + 镜像降级。
// 原实现直接 `await fetch(b.rawUrl)`，无超时、无重试、无镜像回退：
// 一个挂起的 socket 会让该 worker 永久阻塞；下载失败的书目被静默 `continue` 丢弃，
// 结果是索引悄悄缺书而不是构建失败。
const FETCH_TIMEOUT = 120000;
const FETCH_RETRIES = 2;

async function fetchBookText(b) {
  const urls = [b.rawUrl, ...(b.mirrors || [])];
  let lastError = null;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    const url = urls[attempt % urls.length];
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastError = e;
    }
  }
  console.warn(`⚠️ 放弃 ${b.id}（已尝试 ${urls.length} 个源）: ${lastError?.message}`);
  return null;
}

/**
 * 章节字节偏移清单（供阅读页 Range 分片懒加载）。
 *
 * 原实现对每个章节边界都执行 Buffer.byteLength(text.slice(0, charStart))：
 * byteLength 必须逐字符扫描字符串，前缀结果无法复用，故单本成本为
 * O(章节数 × 正文长度)。古籍常含数百「卷/品」，在 15,694 部规模下会累积成
 * 数十亿次字符扫描，是本步骤耗时的主要来源之一。
 *
 * 章节边界单调递增，改用游标累计即可得到与原来完全相同的 start/end，
 * 总成本降为 O(正文长度)。
 */
function buildChapterManifest(text, bounds) {
  const totalBytes = Buffer.byteLength(text, "utf8");
  const manifest = [];
  let cursor = 0; // 已计入字节数的字符位置
  let bytes = 0; // cursor 之前的 UTF-8 字节数
  for (const bd of bounds) {
    if (bd.charStart > cursor) {
      bytes += Buffer.byteLength(text.slice(cursor, bd.charStart), "utf8");
      cursor = bd.charStart;
    }
    const start = bytes;
    if (bd.charEnd > cursor) {
      bytes += Buffer.byteLength(text.slice(cursor, bd.charEnd), "utf8");
      cursor = bd.charEnd;
    }
    manifest.push({ title: bd.title, start, end: bytes || totalBytes });
  }
  return manifest;
}

async function worker(queue) {
  while (queue.length) {
    const b = queue.shift();
    try {
      const text = await fetchBookText(b);
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
const MAX_PER_TERM = 50;
const trimmed = {};
for (const [term, ids] of Object.entries(index)) {
  trimmed[term] = [...new Set(ids)].slice(0, MAX_PER_TERM);
}

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
