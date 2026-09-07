/**
 * 古籍通 AncientBook 数据与索引构建脚本（单一数据源）
 *
 * 用法：
 *   npm run build:index             # 仅生成 lib/data-generated.ts（元数据迁移）
 *   npm run build:index -- --fulltext [--data-dir <TXT目录>]
 *                                   # 额外生成 public/index/ 倒排索引与分片清单
 *                                   # 指定 --data-dir 时扫描真实 TXT 分片（5GB 生产数据）
 *                                   # 未指定时使用内置演示文本降级
 *
 * 索引产物：
 *   public/index/inverted-index.json  倒排索引 { term: { bookId: [chapterIdx...] } }
 *   public/index/chunk-manifest.json  分片清单 { bookId: { chapters: [{name, start, size}] } }
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { T2S_MAP } from "../lib/t2s.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "prototype/data/app-data.js");
const OUT_TS = join(ROOT, "lib/data-generated.ts");
const OUT_DIR = join(ROOT, "public/index");

const argv = process.argv.slice(2);
const fulltext = argv.includes("--fulltext");
const dataDirIdx = argv.indexOf("--data-dir");
const dataDir = dataDirIdx >= 0 ? argv[dataDirIdx + 1] : null;

// ---------- 1. 元数据迁移（原有逻辑） ----------
const src = readFileSync(SRC, "utf8");
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
writeFileSync(OUT_TS, banner + JSON.stringify(data, null, 2) + ";\n\nexport default data;\n", "utf8");
console.log(`✅ 元数据: ${OUT_TS}（馆藏 ${data.categories.length} · 典籍 ${data.books.length}）`);

// ---------- 2. 全文索引（--fulltext） ----------
if (!fulltext) process.exit(0);

/** 归一化：繁→简 + 去标点 + 空白 */
function normalize(text) {
  return text
    .split("")
    .map((c) => T2S_MAP[c] || c)
    .join("")
    .replace(/[「」『』“”‘’《》〈〉：；，。！？、·\s\d]/g, "");
}

/** 简易中文分词：二元组 + 单字（无字典时的可复算近似方案） */
function tokenize(text) {
  const norm = normalize(text);
  if (!norm) return [];
  const tokens = new Set();
  for (let i = 0; i < norm.length; i++) tokens.add(norm[i]);
  for (let i = 0; i < norm.length - 1; i++) tokens.add(norm.slice(i, i + 2));
  return [...tokens];
}

/** 获取章节正文：优先真实 TXT，降级演示样本 */
function getChapterText(book, idx, realChapters) {
  if (realChapters) return realChapters[idx] || "";
  const sample = {
    论语: [
      "子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」",
      "有子曰：「其為人也孝弟，而好犯上者，鮮矣；不好犯上，而好作亂者，未之有也。君子務本，本立而道生。」",
      "子曰：「巧言令色，鮮矣仁！」",
      "曾子曰：「吾日三省吾身：為人謀而不忠乎？與朋友交而不信乎？傳不習乎？」",
    ],
    心经: [
      "觀自在菩薩，行深般若波羅蜜多時，照見五蘊皆空，度一切苦厄。",
      "舍利子，色不異空，空不異色，色即是空，空即是色，受想行識，亦復如是。",
      "是故空中無色，無受想行識，無眼耳鼻舌身意，無色聲香味觸法。",
      "無眼界，乃至無意識界，無無明，亦無無明盡，乃至無老死，亦無老死盡。",
    ],
  };
  const paras = sample[book.title] || [
    "古之學者必有師。師者，所以傳道、受業、解惑也。",
    "生乎吾前，其聞道也固先乎吾，吾從而師之；生乎吾後，其聞道也亦先乎吾，吾從而師之。",
    "吾師道也，夫庸知其年之先後生於吾乎？是故無貴無賤，無長無少，道之所存，師之所存也。",
  ];
  return paras[idx % paras.length];
}

/** 读取真实 TXT 数据源：目录名=书名，文件=章节 */
function loadRealData() {
  if (!dataDir || !existsSync(dataDir)) return null;
  const books = {};
  for (const d of readdirSync(dataDir)) {
    const full = join(dataDir, d);
    if (!statSync(full).isDirectory()) continue;
    const files = readdirSync(full)
      .filter((f) => f.endsWith(".txt"))
      .sort();
    if (files.length === 0) continue;
    books[d] = {
      chapters: files.map((f) => {
        const content = readFileSync(join(full, f), "utf8");
        return { name: basename(f, ".txt"), content };
      }),
    };
  }
  return Object.keys(books).length ? books : null;
}

const real = loadRealData();
if (real) console.log(`📖 使用真实数据源: ${dataDir}（${Object.keys(real).length} 部典籍）`);
else console.log("📖 未指定/未找到真实数据源，使用内置演示文本构建演示索引");

const invertedIndex = {};
const chunkManifest = {};

for (const book of data.books) {
  const chapters = book.chapters.map((name, idx) => {
    const realCh = real?.[book.title]?.chapters;
    const content = getChapterText(book, idx, realCh?.map((c) => c.content));
    return { name, content };
  });

  let byteOffset = 0;
  chunkManifest[book.title] = {
    id: book.id,
    chapters: chapters.map((ch) => {
      const bytes = Buffer.byteLength(ch.content, "utf8");
      const entry = { name: ch.name, start: byteOffset, size: bytes };
      byteOffset += bytes;
      return entry;
    }),
    totalBytes: byteOffset,
  };

  chapters.forEach((ch, idx) => {
    for (const term of tokenize(ch.content)) {
      if (term.length > 1 && (term.includes("無") || term.includes("不") || term.includes("之") || term.includes("也") || term.includes("者") || term.includes("乎"))) continue; // 跳过极高频虚词
      invertedIndex[term] = invertedIndex[term] || {};
      invertedIndex[term][book.title] = invertedIndex[term][book.title] || [];
      if (!invertedIndex[term][book.title].includes(idx)) invertedIndex[term][book.title].push(idx);
    }
  });
}

// 词频排序裁剪（控制索引体积：保留每词最多 12 部书、每书最多 8 章）
const trimmed = {};
for (const [term, books] of Object.entries(invertedIndex)) {
  trimmed[term] = Object.fromEntries(
    Object.entries(books)
      .slice(0, 12)
      .map(([t, idxs]) => [t, idxs.slice(0, 8)])
  );
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "inverted-index.json"), JSON.stringify(trimmed), "utf8");
writeFileSync(join(OUT_DIR, "chunk-manifest.json"), JSON.stringify(chunkManifest), "utf8");

console.log(
  `✅ 倒排索引: public/index/inverted-index.json（词条 ${Object.keys(trimmed).length} · 覆盖 ${data.books.length} 部）`
);
console.log(`✅ 分片清单: public/index/chunk-manifest.json（${Object.keys(chunkManifest).length} 部）`);
