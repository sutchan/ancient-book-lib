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
let done = 0;
const CONCURRENCY = 8;

async function worker(queue) {
  while (queue.length) {
    const b = queue.shift();
    try {
      const res = await fetch(b.rawUrl);
      if (!res.ok) {
        console.warn(`⚠️ 跳过 ${b.id} (HTTP ${res.status})`);
        continue;
      }
      const text = await res.text();
      for (const term of tokenize(text)) {
        if (term.length === 1 && STOP.has(term)) continue;
        (index[term] ||= []).push(b.id);
      }
    } catch (e) {
      console.warn(`⚠️ 失败 ${b.id}: ${e.message}`);
    } finally {
      done++;
      if (done % 200 === 0) console.log(`进度 ${done}/${books.length}`);
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
