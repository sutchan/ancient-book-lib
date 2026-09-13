// components/reader/useReaderBookmarks.ts v1.15.8
"use client";

/** 书签（书籍收藏 + 阅读位置书签），从 RemoteReader.tsx 拆出 */
import { useCallback, useEffect, useState } from "react";
import { useBookmarks } from "@/lib/useBookmarks";
import {
  addBookmark,
  removeBookmark,
  getReadPos,
  addReadPos,
  removeReadPos,
  type ReadPosBookmark,
} from "@/lib/bookmarks";

export function useReaderBookmarks(opts: {
  bookId: string;
  bookTitle: string;
  bookCategory: string;
  currentTitle: string;
  chapterIdx: number;
  pageIdx: number;
  goChapter: (idx: number) => void;
  setPageIdx: (idx: number) => void;
}) {
  const { bookId, bookTitle, bookCategory, currentTitle, chapterIdx, pageIdx, goChapter, setPageIdx } = opts;
  const bm = useBookmarks();
  const bookmarked = !!bookId && bm.some((x) => x.id === bookId);
  const [readPosList, setReadPosList] = useState<ReadPosBookmark[]>([]);
  const [showPos, setShowPos] = useState(false);

  // 加载本书已保存的阅读位置书签
  useEffect(() => {
    if (bookId && typeof window !== "undefined") setReadPosList(getReadPos(bookId));
  }, [bookId]);

  // 收藏切换
  const toggleBookmark = useCallback(() => {
    if (!bookId) return;
    if (bookmarked) removeBookmark(bookId);
    else addBookmark({ id: bookId, title: bookTitle, category: bookCategory });
  }, [bookId, bookTitle, bookCategory, bookmarked]);

  // 保存当前阅读位置
  const saveReadPos = useCallback(() => {
    if (!bookId) return;
    const label = currentTitle
      ? `${currentTitle} · 第 ${pageIdx + 1} 页`
      : `第 ${chapterIdx + 1} 章 · 第 ${pageIdx + 1} 页`;
    setReadPosList(addReadPos(bookId, { chapterIdx, pageIdx, label }));
  }, [bookId, currentTitle, chapterIdx, pageIdx]);

  // 跳转到已保存位置
  const gotoReadPos = useCallback(
    (p: ReadPosBookmark) => {
      goChapter(p.chapterIdx);
      setPageIdx(p.pageIdx);
      setShowPos(false);
    },
    [goChapter, setPageIdx]
  );

  // 删除已保存位置
  const deleteReadPos = useCallback(
    (createdAt: number) => {
      if (!bookId) return;
      setReadPosList(removeReadPos(bookId, createdAt));
    },
    [bookId]
  );

  return { bookmarked, readPosList, showPos, setShowPos, toggleBookmark, saveReadPos, gotoReadPos, deleteReadPos };
}
