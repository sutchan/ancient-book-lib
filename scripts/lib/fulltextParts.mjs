/**
 * 全文倒排索引构建的纯逻辑与网络工具（自 scripts/build-fulltext-index.mjs 拆出）
 *
 * 只包含「归一化 / 分词 / 章节字节清单 / 下载 / 裁剪」等可独立复用的函数，
 * 由 scripts/build-fulltext-index.mjs 负责并发编排与写盘。
 */
import { T2S_MAP } from "../../lib/t2s.ts";

/** 高频虚词裁剪：单字高频词对检索无区分度，且会急剧膨胀索引 */
export const STOP = new Set([
  "無", "不", "之", "也", "者", "乎", "其", "而", "以", "於", "為", "有", "是",
  "皆", "則", "曰", "子", "夫", "此", "彼", "一", "二", "三", "十", "人", "上",
  "下", "中", "大", "小", "天", "地", "日", "月", "年", "時", "生", "死", "名",
]);

// 标点/空白/数字裁剪正则提升到模块级：normalize 每部书都会调用，
// 写在函数体内会随每次调用重新构造正则对象。
export const NOISE_RE = /[「」『』“”‘’《》〈〉：；，。！？、·\s\d]/g;

/** 每个词条保留的文献数上限（控制体积，保留区分度最高的前 N 部） */
export const MAX_PER_TERM = 50;

/**
 * 繁→简归一化 + 去噪。
 * 原实现 `.split("").map().join()` 会为每部书额外分配「单字符数组 + 映射结果数组」
 * 两个 n 长度的临时数组（n 为正文长度；全量 5.14GB 文本下等同于数十亿次装箱与
 * 随之而来的 GC 压力）。改为单次遍历 + 单个结果数组，结果逐字符等价。
 * 注：`text[i]` 对非 BMP 字符返回半个代理对，但写回时两半原样拼接，与 split("") 行为一致。
 */
export function normalize(text) {
  const out = new Array(text.length);
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    out[n++] = T2S_MAP[c] || c;
  }
  out.length = n;
  return out.join("").replace(NOISE_RE, "");
}

/** 单字 + 二元组分词（去重）。 */
export function tokenize(text) {
  const norm = normalize(text);
  const set = new Set();
  for (let i = 0; i < norm.length; i++) {
    set.add(norm[i]);
    if (i < norm.length - 1) set.add(norm.slice(i, i + 2));
  }
  return [...set];
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
export function buildChapterManifest(text, bounds) {
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

/**
 * 单本 TXT 下载：超时 + 重试 + 镜像降级。
 * 原实现直接 `await fetch(b.rawUrl)`，无超时、无重试、无镜像回退：
 * 一个挂起的 socket 会让该 worker 永久阻塞；下载失败的书目被静默 `continue` 丢弃，
 * 结果是索引悄悄缺书而不是构建失败。
 */
export async function fetchBookText(
  b,
  { timeout = 120000, retries = 2, mirrorFirst = false } = {}
) {
  const mirrors = b.mirrors || [];
  const urls = mirrorFirst ? [...mirrors, b.rawUrl] : [b.rawUrl, ...mirrors];
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const url = urls[attempt % urls.length];
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastError = e;
    }
  }
  console.warn(`⚠️ 放弃 ${b.id}（已尝试 ${urls.length} 个源）: ${lastError?.message}`);
  return null;
}

/** 去重 + 每词文献数上限。 */
export function trimIndex(index, maxPerTerm = MAX_PER_TERM) {
  const trimmed = {};
  for (const [term, ids] of Object.entries(index)) {
    trimmed[term] = [...new Set(ids)].slice(0, maxPerTerm);
  }
  return trimmed;
}
