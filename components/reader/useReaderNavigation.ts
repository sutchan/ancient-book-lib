// components/reader/useReaderNavigation.ts v1.15.8 —— 阅读器目录/分页/翻页导航（从 RemoteReader 拆出）
"use client";

import { useCallback, useMemo, useRef } from "react";
import { splitParagraphs } from "@/lib/chapterParse";
import type { CatalogEntry } from "@/lib/catalog";
import type { ChapterRange } from "@/lib/remoteBook";
import type { ReaderMatch } from "@/lib/readerSearch";
import { PAGE_SIZE } from "./constants";

interface NavDeps {
  usingManifest: boolean;
  chapterIdx: number;
  pageIdx: number;
  setChapterIdx: (i: number) => void;
  setPageIdx: (i: number) => void;
  toc: ChapterRange[];
  chapters: { title: string; paragraphs: string[] }[];
  content: string | null;
  book: CatalogEntry | null;
  loadChapter: (b: CatalogEntry, ch: ChapterRange) => Promise<void>;
}

/** 派生目录 / 当前章 / 分页，并提供翻页、跳章与移动端滑动翻页处理器 */
export function useReaderNavigation(deps: NavDeps) {
  const {
    usingManifest, chapterIdx, pageIdx, setChapterIdx, setPageIdx,
    toc, chapters, content, book, loadChapter,
  } = deps;

  // 派生：目录 / 当前章 / 分页
  const navItems = usingManifest ? toc : chapters;
  const currentTitle = usingManifest ? toc[chapterIdx]?.title ?? "" : chapters[chapterIdx]?.title ?? "";
  const paragraphs = usingManifest
    ? content ? splitParagraphs(content) : []
    : chapters[chapterIdx]?.paragraphs ?? [];
  const totalPages = Math.ceil(paragraphs.length / PAGE_SIZE) || 1;
  const pageParagraphs = paragraphs.slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE);

  const goPage = useCallback(
    (delta: number) => {
      setPageIdx(Math.max(0, Math.min(totalPages - 1, pageIdx + delta)));
      window.scrollTo({ top: 0 });
    },
    [totalPages, pageIdx, setPageIdx]
  );

  const goChapter = useCallback(
    (idx: number) => {
      const max = (usingManifest ? toc.length : chapters.length) - 1;
      const clamped = Math.max(0, Math.min(max, idx));
      setChapterIdx(clamped);
      setPageIdx(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (usingManifest && book) {
        const ch = toc[clamped];
        if (ch) void loadChapter(book, ch);
      }
    },
    [usingManifest, toc, chapters.length, book, loadChapter, setChapterIdx, setPageIdx]
  );

  // 移动端左右滑动翻页
  const touchXRef = useRef<number | null>(null);
  const onBodyTouchStart = useCallback((x: number) => { touchXRef.current = x; }, []);
  const onBodyTouchEnd = useCallback(
    (endX: number) => {
      const startX = touchXRef.current;
      touchXRef.current = null;
      if (startX === null) return;
      const dx = endX - startX;
      if (Math.abs(dx) < 50) return;
      goPage(dx < 0 ? 1 : -1); // 左滑下一页，右滑上一页
    },
    [goPage]
  );

  // 命中处所在章节标题
  const matchLabel = useCallback(
    (m: ReaderMatch) => (usingManifest ? currentTitle : chapters[m.chapterIdx]?.title ?? ""),
    [usingManifest, currentTitle, chapters]
  );

  return {
    navItems, currentTitle, paragraphs, totalPages, pageParagraphs,
    goPage, goChapter, onBodyTouchStart, onBodyTouchEnd, matchLabel,
  };
}
