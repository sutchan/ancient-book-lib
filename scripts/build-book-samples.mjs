// scripts/build-book-samples.mjs v1.4.0
// 从殆知阁全量书目索引中随机抽取 N 部，输出轻量样本文件，
// 供首页「随机书籍」模块在不加载 11MB 全量目录的前提下快速取数。
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "public/index/daizhige-catalog.json";
const OUT = "public/index/book-samples.json";
const SAMPLE = 400;

const raw = JSON.parse(readFileSync(SRC, "utf8"));
const books = raw.books || [];

// Fisher–Yates 洗牌后取前 SAMPLE，保证跨馆藏均匀分布
const idx = [...books.keys()];
for (let i = idx.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [idx[i], idx[j]] = [idx[j], idx[i]];
}

const picked = idx.slice(0, SAMPLE).map((i) => ({
  id: books[i].id,
  title: books[i].title,
  category: books[i].category,
}));

writeFileSync(OUT, JSON.stringify({ total: picked.length, books: picked }));
console.log(`generated ${picked.length} book samples -> ${OUT}`);
