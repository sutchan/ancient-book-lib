// components/reader/useReaderData.ts v1.15.8
"use client";

/**
 * 阅读器数据层：书目元数据加载、Range 分片清单优先 / 整本下载回退、
 * 章节内存缓存、阅读进度持久化（localStorage `ab-remote-<bookId>`）。
 * 从 RemoteReader.tsx 拆出，行为与原单文件实现一致。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadCatalog, findBookById, type CatalogEntry } from "@/lib/catalog";
import { fetchTextWithTimeout, FetchTimeoutError } from "@/lib/fetchWithTimeout";
import { getCachedBook, setCachedBook } from "@/lib/idb";
import { parseChapters } from "@/lib/chapterParse";
import { recordRecent } from "@/lib/recentBooks";
import { createChapterCache } from "@/lib/chapterCache";
import {
  loadChapterManifest,
  buildToc,
  fetchChapterText,
  type ChapterRange,
} from "@/lib/remoteBook";
import { CHAPTER_CACHE_MAX, FETCH_TIMEOUT, LARGE_FILE_THRESHOLD } from "./constants";
import { useConfirmLargeLoad } from "./useConfirmLargeLoad";

export function useReaderData(bookId: string) {
  const [book, setBook] = useState<CatalogEntry | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFromCache, setLoadingFromCache] = useState(false);
  const [showLargeWarning, setShowLargeWarning] = useState(false);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [pageIdx, setPageIdx] = useState(0);
  const [usingManifest, setUsingManifest] = useState(false); // 是否走 Range 分片模式
  const [toc, setToc] = useState<ChapterRange[]>([]); // 分片模式目录（字节偏移）
  // 章节文本缓存：键必须带 bookId。不同书的章节字节偏移会碰撞（首章 start 常为 0），
  // 仅以 ch.start 为键时切换书目会命中上一本书的正文。
  const chapterCacheRef = useRef(createChapterCache(CHAPTER_CACHE_MAX));

  // 分片模式：按章节字节区间拉取（带内存缓存，避免重复下载）
  const loadChapter = useCallback(async (b: CatalogEntry, ch: ChapterRange) => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    try {
      const cacheKey = `${b.id}:${ch.start}`;
      const cached = chapterCacheRef.current.get(cacheKey);
      if (cached !== undefined) {
        setContent(cached);
        setLoading(false);
        return;
      }
      const text = await fetchChapterText(b, ch, {
        timeout: FETCH_TIMEOUT,
        onProgress: (loaded, total) => setLoadingProgress(total > 0 ? Math.round((loaded / total) * 100) : 0),
      });
      chapterCacheRef.current.set(cacheKey, text);
      recordRecent(b);
      setContent(text);
      setLoading(false);
    } catch (e: unknown) {
      setError(String((e as Error)?.message || e));
      setLoading(false);
    }
  }, []);

  // 加载原文：优先 Range 分片（超大书），否则回退整本下载 + IDB 缓存 + 大文件警告
  const loadContent = useCallback(async (b: CatalogEntry, force = false, restoredChapter = 0) => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    setShowLargeWarning(false);
    setLoadingFromCache(false);

    // 1. 尝试分片清单（构建期生成；支持则仅按需拉取章节）
    const manifest = await loadChapterManifest(b.id);
    if (manifest && manifest.length) {
      const t = buildToc(manifest);
      setUsingManifest(true);
      setToc(t);
      const idx = Math.max(0, Math.min(t.length - 1, restoredChapter));
      setChapterIdx(idx);
      setPageIdx(0);
      await loadChapter(b, t[idx]);
      recordRecent(b);
      return;
    }

    // 2. 回退：整本下载（小书 / 尚未生成清单的书）
    setUsingManifest(false);
    setToc([]);
    const cached = await getCachedBook(b.id);
    if (cached) {
      setLoadingFromCache(true);
      setContent(cached);
      setLoading(false);
      recordRecent(b);
      return;
    }
    setLoadingFromCache(false);

    // 大文件警告（>5MB），force 时跳过
    if (!force && b.size > LARGE_FILE_THRESHOLD) {
      setShowLargeWarning(true);
      setLoading(false);
      return; // 等待用户确认
    }

    // 3. 尝试主源 + CDN 镜像降级
    const urls = [b.rawUrl, ...(b.mirrors || [])];
    let lastError: Error | null = null;
    for (let i = 0; i < urls.length; i++) {
      try {
        setLoadingProgress(0);
        const text = await fetchTextWithTimeout(urls[i], {
          timeout: FETCH_TIMEOUT,
          onProgress: (loaded, total) => {
            if (total > 0) setLoadingProgress(Math.round((loaded / total) * 100));
          },
        });
        setCachedBook(b.id, b.title, text);
        recordRecent(b);
        setContent(text);
        setLoading(false);
        return;
      } catch (e: unknown) {
        lastError = e as Error;
      }
    }
    throw lastError || new Error("所有数据源均加载失败");
  }, [recordRecent, loadChapter]);

  // 加载书目元数据 + 原文
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setShowLargeWarning(false);
        setLoadingFromCache(false);
        setLoadingProgress(0);
        const catalog = await loadCatalog();
        const b = findBookById(catalog, bookId);
        if (!b) { setError("未找到该书目"); setLoading(false); return; }
        if (cancelled) return;
        setBook(b);

        // 恢复阅读进度
        const progressStr = typeof window !== "undefined" ? localStorage.getItem(`ab-remote-${bookId}`) : null;
        let restoredChapter = 0;
        if (progressStr) {
          try {
            const p = JSON.parse(progressStr);
            restoredChapter = p.chapterIdx || 0;
            setPageIdx(p.pageIdx || 0);
          } catch { /* ignore */ }
        }
        setChapterIdx(restoredChapter);

        await loadContent(b, false, restoredChapter);
      } catch (e: unknown) {
        if (!cancelled) {
          if (e instanceof FetchTimeoutError) {
            setError("加载超时，请检查网络后重试，或直接下载原文");
          } else {
            setError(String((e as Error)?.message || e));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookId, loadContent]);

  // 进度缓存
  useEffect(() => {
    if (book && typeof window !== "undefined") {
      localStorage.setItem(`ab-remote-${bookId}`, JSON.stringify({ chapterIdx, pageIdx }));
    }
  }, [bookId, book, chapterIdx, pageIdx]);

  // 回退模式：从整本文本解析章节
  const chapters = useMemo(
    () => (content && !usingManifest && book ? parseChapters(content, book.title) : []),
    [content, usingManifest, book]
  );

  return {
    book, content, error, loading, loadingProgress, loadingFromCache, showLargeWarning,
    chapterIdx, setChapterIdx, pageIdx, setPageIdx, usingManifest, toc, chapters,
    loadChapter, loadContent, confirmLargeLoad: useConfirmLargeLoad(book, loadContent),
    setError, setLoading,
  };
}
