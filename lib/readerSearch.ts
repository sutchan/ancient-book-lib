// lib/readerSearch.ts v1.15.5
/**
 * 阅读器页内搜索（纯函数，便于单测）
 * - 命中判定支持繁简互通：直接匹配，或（繁体正文遇到简体查询时）在简体空间再匹配一次
 * - 返回「章 / 页 / 段」定位与上下文片段，供阅读器高亮与跳转
 */
import { toSimplified } from "./t2s";

export interface ReaderMatch {
  chapterIdx: number;
  pageIdx: number;
  paraIdx: number;
  snippet: string;
}

export interface SearchableChapter {
  title: string;
  paragraphs: string[];
}

/**
 * 命中判定：直接匹配优先，否则在简体空间再比一次。
 * 必须是**双向**的：繁体正文 + 简体查询要能命中，简体正文 + 繁体查询也要能命中。
 * 原实现在 simple=true（简体对照模式）时提前 return false，导致后者完全漏检。
 */
function isHit(display: string, q: string): boolean {
  return display.includes(q) || toSimplified(display).includes(toSimplified(q));
}

/** 截取命中处上下文（前后约 12 字，超出加省略号） */
function snippetOf(display: string, q: string, simple: boolean): string {
  let idx = display.indexOf(q);
  let len = q.length;
  if (idx < 0 && !simple) {
    const ds = toSimplified(display);
    const i = ds.indexOf(toSimplified(q));
    if (i >= 0) {
      idx = i;
      len = toSimplified(q).length;
    }
  }
  if (idx < 0) return display.slice(0, 40);
  const start = Math.max(0, idx - 12);
  const end = Math.min(display.length, idx + len + 12);
  return (start > 0 ? "…" : "") + display.slice(start, end) + (end < display.length ? "…" : "");
}

/** 在各章段落中查找命中，返回定位数组（页码由 pageSize 计算） */
export function buildReaderMatches(
  chapters: SearchableChapter[],
  query: string,
  pageSize: number,
  simple: boolean
): ReaderMatch[] {
  const q = query.trim();
  if (!q || pageSize <= 0) return [];
  const out: ReaderMatch[] = [];
  chapters.forEach((ch, chapterIdx) => {
    ch.paragraphs.forEach((para, paraIdx) => {
      const display = simple ? toSimplified(para) : para;
      if (!isHit(display, q)) return;
      out.push({
        chapterIdx,
        pageIdx: Math.floor(paraIdx / pageSize),
        paraIdx,
        snippet: snippetOf(display, q, simple),
      });
    });
  });
  return out;
}

/**
 * 将文本按查询词切分为「命中 / 非命中」片段，供渲染 <mark> 高亮（繁简互通）。
 *
 * 必须与上面的 isHit 用同一套归一化，否则会出现「命中列表有结果、点跳转后正文零高亮」：
 * 原实现只在原文上做 indexOf，繁体正文 + 简体查询时命中判定（有繁简回退）通过、
 * 高亮切分却返回空，用户以为功能坏了。
 *
 * toSimplified 是逐字符 1:1 映射（lib/t2s.ts），长度与下标均不变，
 * 因此可以「在归一化文本上定位、在原文本上切片」，索引天然对齐。
 */
export function splitHighlight(text: string, query: string): { text: string; hit: boolean }[] {
  const q = query.trim();
  if (!q) return [{ text, hit: false }];
  const hay = toSimplified(text);
  const needle = toSimplified(q);
  const parts: { text: string; hit: boolean }[] = [];
  let i = 0;
  while (i < hay.length) {
    const idx = hay.indexOf(needle, i);
    if (idx < 0) {
      parts.push({ text: text.slice(i), hit: false });
      break;
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), hit: false });
    parts.push({ text: text.slice(idx, idx + needle.length), hit: true });
    i = idx + needle.length;
  }
  return parts;
}
