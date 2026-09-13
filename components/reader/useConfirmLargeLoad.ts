// components/reader/useConfirmLargeLoad.ts 1.15.8 —— 大文件警告确认后加载（从 useReaderData 拆出）
"use client";

import { useCallback } from "react";
import type { CatalogEntry } from "@/lib/catalog";

/** 大文件警告确认后加载（force=true 跳过大小检查） */
export function useConfirmLargeLoad(
  book: CatalogEntry | null,
  loadContent: (b: CatalogEntry, force?: boolean) => Promise<void>
) {
  return useCallback(() => {
    if (!book) return;
    void loadContent(book, true);
  }, [book, loadContent]);
}
