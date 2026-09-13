// lib/readerSearch.ts v1.15.0
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

/** 命中判定：直接匹配优先；繁体正文遇到简体查询时在简体空间再匹配一次 */
function isHit(display: string, q: string, simple: boolean): boolean {
  if (display.includes(q)) return true;
  if (simple) return false;
  return toSimplified(display).includes(toSimplified(q));
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
      if (!isHit(display, q, simple)) return;
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

/** 将文本按查询词切分为「命中 / 非命中」片段，供渲染 <mark> 高亮 */
export function splitHighlight(text: string, query: string): { text: string; hit: boolean }[] {
  const q = query.trim();
  if (!q) return [{ text, hit: false }];
  const parts: { text: string; hit: boolean }[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = text.indexOf(q, i);
    if (idx < 0) {
      parts.push({ text: text.slice(i), hit: false });
      break;
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), hit: false });
    parts.push({ text: text.slice(idx, idx + q.length), hit: true });
    i = idx + q.length;
  }
  return parts;
}
