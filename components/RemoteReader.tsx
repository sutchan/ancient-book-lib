// components/RemoteReader.tsx v1.15.5
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { loadCatalog, findBookById, formatSize, type CatalogEntry } from "@/lib/catalog";
import { toSimplified } from "@/lib/t2s";
import { downloadText, confirmDownload } from "@/lib/download";
import { fetchTextWithTimeout, FetchTimeoutError } from "@/lib/fetchWithTimeout";
import { getCachedBook, setCachedBook } from "@/lib/idb";
import { parseChapters, splitParagraphs } from "@/lib/chapterParse";
import {
  loadChapterManifest,
  buildToc,
  fetchChapterText,
  type ChapterRange,
} from "@/lib/remoteBook";
import ReaderToc from "./ReaderToc";
import ScrollProgress from "./ScrollProgress";
import ReaderToolbar from "./ReaderToolbar";
import ReaderSearchBar from "./ReaderSearchBar";
import ReaderSelectionMenu from "./ReaderSelectionMenu";
import { useBookmarks } from "@/lib/useBookmarks";
import {
  addBookmark,
  removeBookmark,
  getReadPos,
  addReadPos,
  removeReadPos,
  type ReadPosBookmark,
} from "@/lib/bookmarks";
import { buildReaderMatches, splitHighlight, type ReaderMatch } from "@/lib/readerSearch";
import { formatCitation, copyText } from "@/lib/citation";

const PAGE_SIZE = 8;
const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB 以上视为大文件
const FETCH_TIMEOUT = 60000; // 60秒超时（大文件需要更长时间）

/** 仅允许 http/https 协议，阻断 javascript:/data: 等危险协议（防御 XSS） */
function safeHttpUrl(url: string | undefined): string | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return url;
}

export default function RemoteReader({ bookId, initialQuery = "" }: { bookId: string; initialQuery?: string }) {
  const [book, setBook] = useState<CatalogEntry | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFromCache, setLoadingFromCache] = useState(false);
  const [showLargeWarning, setShowLargeWarning] = useState(false);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [pageIdx, setPageIdx] = useState(0);
  const [simple, setSimple] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [usingManifest, setUsingManifest] = useState(false); // 是否走 Range 分片模式
  const [toc, setToc] = useState<ChapterRange[]>([]); // 分片模式目录（字节偏移）
  // 章节文本缓存：键必须带 bookId。不同书的章节字节偏移会碰撞（首章 start 常为 0），
  // 仅以 ch.start 为键时切换书目会命中上一本书的正文。
  const CHAPTER_CACHE_MAX = 30; // 上限，避免长书读完全程后把整本正文留在内存
  const chapterCacheRef = useRef<Map<string, string>>(new Map());

  // 书签（书籍收藏 + 阅读位置书签）
  const bm = useBookmarks();
  const bookmarked = !!book && bm.some((x) => x.id === book.id);
  const [readPosList, setReadPosList] = useState<ReadPosBookmark[]>([]);
  const [showPos, setShowPos] = useState(false);

  // 页内搜索 + 引用复制
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const touchXRef = useRef<number | null>(null);

  // 由检索结果带入关键词：自动打开页内搜索
  useEffect(() => {
    if (initialQuery) {
      setShowSearch(true);
      setSearchQuery(initialQuery);
      setSubmittedQuery(initialQuery);
    }
  }, [initialQuery]);

  // 小屏（<420px）初始字号自适应
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 420) setFontSize(15);
  }, []);

  // 加载本书已保存的阅读位置书签
  useEffect(() => {
    if (book && typeof window !== "undefined") setReadPosList(getReadPos(book.id));
  }, [book]);

  // 记录阅读历史（提取为独立函数，缓存命中和 fetch 成功后都调用）
  const recordRecent = useCallback((b: CatalogEntry) => {
    if (typeof window === "undefined") return;
    try {
      const recent = JSON.parse(localStorage.getItem("ab-recent") || "[]");
      const filtered = recent.filter((r: any) => r.id !== b.id);
      filtered.unshift({ id: b.id, title: b.title, category: b.category, time: Date.now() });
      localStorage.setItem("ab-recent", JSON.stringify(filtered.slice(0, 10)));
    } catch { /* ignore */ }
  }, []);

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
      const cache = chapterCacheRef.current;
      cache.set(cacheKey, text);
      // 超出上限时按插入顺序淘汰最早的一条（Map 保持插入顺序）
      if (cache.size > CHAPTER_CACHE_MAX) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      recordRecent(b);
      setContent(text);
      setLoading(false);
    } catch (e: any) {
      setError(String(e?.message || e));
      setLoading(false);
    }
  }, [recordRecent]);

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
      } catch (e: any) {
        lastError = e;
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
      } catch (e: any) {
        if (!cancelled) {
          if (e instanceof FetchTimeoutError) {
            setError("加载超时，请检查网络后重试，或直接下载原文");
          } else {
            setError(String(e?.message || e));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookId, loadContent]);

  // 回退模式：从整本文本解析章节
  const chapters = useMemo(
    () => (content && !usingManifest && book ? parseChapters(content, book.title) : []),
    [content, usingManifest, book]
  );

  const navItems = usingManifest ? toc : chapters;
  const currentTitle = usingManifest ? toc[chapterIdx]?.title ?? "" : chapters[chapterIdx]?.title ?? "";
  const paragraphs = usingManifest
    ? content ? splitParagraphs(content) : []
    : chapters[chapterIdx]?.paragraphs ?? [];
  const totalPages = Math.ceil(paragraphs.length / PAGE_SIZE) || 1;
  const pageParagraphs = paragraphs.slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE);

  // 页内搜索：分片模式仅当前章节，整本模式为全书
  const searchChapters = useMemo(
    () =>
      usingManifest
        ? [{ title: currentTitle, paragraphs }]
        : chapters.map((c) => ({ title: c.title, paragraphs: c.paragraphs })),
    [usingManifest, currentTitle, paragraphs, chapters]
  );
  const matches = useMemo(
    () => (submittedQuery ? buildReaderMatches(searchChapters, submittedQuery, PAGE_SIZE, simple) : []),
    [searchChapters, submittedQuery, simple]
  );

  const goPage = useCallback(
    (delta: number) => {
      setPageIdx((p) => Math.max(0, Math.min(totalPages - 1, p + delta)));
      window.scrollTo({ top: 0 });
    },
    [totalPages]
  );

  // 进度缓存
  useEffect(() => {
    if (book && typeof window !== "undefined") {
      localStorage.setItem(`ab-remote-${bookId}`, JSON.stringify({ chapterIdx, pageIdx }));
    }
  }, [bookId, book, chapterIdx, pageIdx]);

  // 繁简偏好
  useEffect(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("ab-simple");
      if (v) setSimple(v === "1");
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("ab-simple", simple ? "1" : "0");
  }, [simple]);

  const goChapter = useCallback((idx: number) => {
    const max = (usingManifest ? toc.length : chapters.length) - 1;
    const clamped = Math.max(0, Math.min(max, idx));
    setChapterIdx(clamped);
    setPageIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (usingManifest && book) {
      const ch = toc[clamped];
      if (ch) loadChapter(book, ch);
    }
  }, [usingManifest, toc, chapters.length, book, loadChapter]);

  // 页内搜索：跳转到命中处（分片模式命中只在当前章节，跳页即可）
  const jumpToMatch = useCallback(
    (m: ReaderMatch) => {
      if (!usingManifest) goChapter(m.chapterIdx);
      setPageIdx(m.pageIdx);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [usingManifest, goChapter]
  );

  // 命中处所在章节标题
  const matchLabel = useCallback(
    (m: ReaderMatch) => (usingManifest ? currentTitle : chapters[m.chapterIdx]?.title ?? ""),
    [usingManifest, currentTitle, chapters]
  );

  // 正文高亮渲染（有已提交关键词时）
  const renderText = useCallback(
    (text: string) => {
      if (!submittedQuery) return text;
      return splitHighlight(text, submittedQuery).map((seg, i) =>
        seg.hit ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>
      );
    },
    [submittedQuery]
  );

  const handleDownload = useCallback(() => {
    if (!book) return;
    // 分片模式：整本需逐章拉取，引导至上游原文另存为（避免浏览器内拼接超大文本）
    if (usingManifest) {
      const u = safeHttpUrl(book.rawUrl);
      if (u) window.open(u, "_blank", "noopener");
      return;
    }
    if (!content) return;
    if (book.size > LARGE_FILE_THRESHOLD) {
      const u = safeHttpUrl(book.rawUrl);
      if (u) window.open(u, "_blank", "noopener");
      return;
    }
    if (!confirmDownload()) return;
    const modeText = simple ? "简体对照版" : "繁体原版";
    const body = simple ? toSimplified(content) : content;
    downloadText(`${book.title}_${modeText}.txt`, body);
  }, [book, content, simple, usingManifest]);

  // 划词检索
  const [selBtn, setSelBtn] = useState<{ text: string; x: number; y: number } | null>(null);
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { setSelBtn(null); return; }
      const text = sel.toString().trim();
      if (!text || text.length > 30) { setSelBtn(null); return; }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelBtn({ text, x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 40 });
    };
    document.addEventListener("mouseup", handler);
    return () => document.removeEventListener("mouseup", handler);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  // 划词：复制学术引用（《书名·章节》：原文）
  const copyCitation = useCallback(
    async (text: string) => {
      if (!book) return;
      const ok = await copyText(formatCitation({ bookTitle: book.title, chapterTitle: currentTitle, text }));
      setSelBtn(null);
      showToast(ok ? "已复制引用" : "复制失败，请手动选择复制");
    },
    [book, currentTitle, showToast]
  );

  // 大文件警告确认后加载（force=true 跳过大小检查）
  const confirmLargeLoad = useCallback(() => {
    if (!book) return;
    setShowLargeWarning(false);
    setLoading(true);
    loadContent(book, true);
  }, [book, loadContent]);

  // 书签：收藏切换
  const toggleBmReader = useCallback(() => {
    if (!book) return;
    if (bookmarked) removeBookmark(book.id);
    else addBookmark({ id: book.id, title: book.title, category: book.category });
  }, [book, bookmarked]);

  // 书签：保存当前阅读位置
  const saveReadPos = useCallback(() => {
    if (!book) return;
    const label = currentTitle
      ? `${currentTitle} · 第 ${pageIdx + 1} 页`
      : `第 ${chapterIdx + 1} 章 · 第 ${pageIdx + 1} 页`;
    setReadPosList(addReadPos(book.id, { chapterIdx, pageIdx, label }));
  }, [book, currentTitle, chapterIdx, pageIdx]);

  // 书签：跳转到已保存位置
  const gotoReadPos = useCallback((p: ReadPosBookmark) => {
    goChapter(p.chapterIdx);
    setPageIdx(p.pageIdx);
    setShowPos(false);
  }, [goChapter]);

  // 书签：删除已保存位置
  const deleteReadPos = useCallback((createdAt: number) => {
    if (!book) return;
    setReadPosList(removeReadPos(book.id, createdAt));
  }, [book]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 16, marginBottom: 16 }}>
          {loadingFromCache ? "从本地书箧取书…" : "正在向殆知阁取卷…"}
        </div>
      {!loadingFromCache && loadingProgress > 0 && (
        <div style={{ maxWidth: 400, margin: "0 auto" }}>
          <div style={{ background: "var(--color-border,#eee)", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ background: "var(--color-primary,#8C3130)", height: "100%", width: `${loadingProgress}%`, transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 8 }}>{loadingProgress}%</div>
        </div>
      )}
    </div>
  );

  // 大文件警告
  if (showLargeWarning && book) return (
    <div style={{ padding: 40, maxWidth: 560, margin: "0 auto" }}>
      <div className="card" style={{ padding: 24, border: "2px solid #faad14" }}>
        <h3 style={{ marginBottom: 12, color: "#d48806" }}>⚠️ 大文件提示</h3>
        <p style={{ marginBottom: 8 }}>
          <strong>{book.title}</strong> 原文约 <strong>{formatSize(book.size)}</strong>，加载可能需要较长时间。
        </p>
        <p style={{ marginBottom: 16, fontSize: 14, color: "var(--color-text-secondary)" }}>
          建议在 Wi-Fi 环境下阅读。加载后会自动缓存到本地，下次访问无需重新下载。
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={confirmLargeLoad}>仍然在线阅读</button>
          {safeHttpUrl(book.rawUrl) ? (
            <a className="btn btn-secondary" href={safeHttpUrl(book.rawUrl)!} target="_blank" rel="noopener">打开原文（可另存为）</a>
          ) : (
            <span className="btn btn-secondary" style={{ opacity: 0.6 }}>原文链接不可用</span>
          )}
          <Link href="/catalog" className="btn btn-secondary">返回书目</Link>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 40 }}>
      <h3>加载失败</h3>
      <p style={{ color: "#c00" }}>{error}</p>
      {book && (
        <p style={{ marginTop: 8 }}>
          {safeHttpUrl(book.rawUrl) ? (
            <>可直接访问上游原文：<a href={safeHttpUrl(book.rawUrl)!} target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>{book.rawUrl}</a></>
          ) : (
            <span>上游原文链接不可用，请返回书目重试。</span>
          )}
        </p>
      )}
      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button className="btn btn-primary" onClick={() => { setError(null); setLoading(true); if (book) loadContent(book, true); }}>重试</button>
        <Link href="/catalog" className="btn btn-secondary">返回书目</Link>
      </div>
    </div>
  );
  if (!book || (!content && !usingManifest)) return null;

  return (
    <div className="reader-wrap">
      <ScrollProgress />
      <div className="reader-title">{book.title}</div>
      <div className="reader-sub">
        {book.category} › {book.subcategories.join(" › ")} · {formatSize(book.size)} · {navItems.length} 章
        {usingManifest && <span style={{ color: "var(--color-primary)" }}> · 分片懒加载</span>}
        · {safeHttpUrl(book.rawUrl) ? (
          <a href={safeHttpUrl(book.rawUrl)!} target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>上游原文</a>
        ) : (
          <span>上游原文链接不可用</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <button className="btn btn-secondary" id="reader-bookmark-toggle" onClick={toggleBmReader} aria-pressed={bookmarked} style={{ fontSize: 13, padding: "6px 12px" }}>
          {bookmarked ? "★ 已收藏" : "☆ 收藏"}
        </button>
        <button className="btn btn-secondary" id="reader-save-pos" onClick={saveReadPos} style={{ fontSize: 13, padding: "6px 12px" }}>
          保存当前位置
        </button>
        <button className="btn btn-secondary" id="reader-pos-toggle" onClick={() => setShowPos(!showPos)} style={{ fontSize: 13, padding: "6px 12px" }}>
          阅读书签{readPosList.length > 0 ? ` (${readPosList.length})` : ""}
        </button>
        <button className="btn btn-secondary" id="reader-search-toggle" onClick={() => setShowSearch((v) => !v)} aria-pressed={showSearch} style={{ fontSize: 13, padding: "6px 12px" }}>
          页内搜索
        </button>
      </div>

      {showSearch && (
        <ReaderSearchBar
          query={searchQuery}
          onQuery={setSearchQuery}
          onSubmit={() => setSubmittedQuery(searchQuery.trim())}
          onClose={() => { setShowSearch(false); setSubmittedQuery(""); }}
          matches={matches}
          onJump={jumpToMatch}
          labelOf={matchLabel}
          submitted={!!submittedQuery}
        />
      )}

      {showPos && (
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>阅读位置书签</strong>
            <button className="btn btn-secondary" style={{ fontSize: 12, padding: "2px 8px" }} onClick={() => setShowPos(false)}>收起</button>
          </div>
          {readPosList.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>暂无保存的阅读位置，点击「保存当前位置」记录本章页码。</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {readPosList.map((p) => (
                <li key={p.createdAt} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                  <button className="btn btn-primary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => gotoReadPos(p)}>跳转</button>
                  <span style={{ flex: 1 }}>{p.label}</span>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: "2px 8px" }} onClick={() => deleteReadPos(p.createdAt)}>删除</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ReaderToolbar
        fontSize={fontSize}
        lineHeight={lineHeight}
        simple={simple}
        onFontDec={() => setFontSize(Math.max(14, fontSize - 1))}
        onFontInc={() => setFontSize(Math.min(22, fontSize + 1))}
        onLineDec={() => setLineHeight(Math.max(1.5, +(lineHeight - 0.1).toFixed(1)))}
        onLineInc={() => setLineHeight(Math.min(2.4, +(lineHeight + 0.1).toFixed(1)))}
        onToggleSimple={(v) => setSimple(v)}
        onDownload={handleDownload}
      />

      {/* 阅读进度条（可拖拽跳章，移动端友好） */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>
          <span>阅读进度</span>
          <span>{navItems.length > 0 ? Math.round(((chapterIdx + 1) / navItems.length) * 100) : 0}%</span>
        </div>
        <div style={{ background: "var(--color-border,#eee)", borderRadius: 4, height: 6, overflow: "hidden" }}>
          <div style={{ background: "var(--color-primary,#8C3130)", height: "100%", width: `${navItems.length > 0 ? ((chapterIdx + 1) / navItems.length) * 100 : 0}%`, transition: "width 0.3s" }} />
        </div>
        {navItems.length > 1 && (
          <input
            type="range"
            id="reader-progress-slider"
            className="reader-progress-slider"
            min={0}
            max={navItems.length - 1}
            value={chapterIdx}
            onChange={(e) => goChapter(parseInt(e.target.value, 10))}
            aria-label="拖拽跳转章节"
          />
        )}
      </div>

      <ReaderToc items={navItems} current={chapterIdx} onSelect={goChapter} disabled={loading} />

      {/* 正文（移动端支持左右滑动翻页） */}
      <div
        className="reader-body"
        style={{ fontSize, lineHeight, userSelect: "text" }}
        onMouseUp={() => { /* selection handler above */ }}
        onTouchStart={(e) => { touchXRef.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const startX = touchXRef.current;
          touchXRef.current = null;
          if (startX === null) return;
          const dx = e.changedTouches[0].clientX - startX;
          if (Math.abs(dx) < 50) return;
          goPage(dx < 0 ? 1 : -1); // 左滑下一页，右滑上一页
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: 20, fontSize: 18 }}>{currentTitle}</h3>
        {pageParagraphs.map((p, i) => (
          <p key={i}>{renderText(simple ? toSimplified(p) : p)}</p>
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 32 }}>
          <button className="btn btn-secondary" disabled={pageIdx === 0} onClick={() => goPage(-1)} style={{ fontSize: 13 }}>上一页</button>
          <span style={{ fontSize: 14 }}>第 {pageIdx + 1} / {totalPages} 页</span>
          <button className="btn btn-secondary" disabled={pageIdx >= totalPages - 1} onClick={() => goPage(1)} style={{ fontSize: 13 }}>下一页</button>
        </div>
      )}

      {selBtn && (
        <ReaderSelectionMenu
          sel={selBtn}
          onSearch={(t) => { window.open(`/search?q=${encodeURIComponent(t)}&mode=full`, "_blank"); setSelBtn(null); }}
          onCite={copyCitation}
        />
      )}

      {toast && (
        <div
          id="reader-toast"
          style={{ position: "fixed", left: "50%", bottom: 40, transform: "translateX(-50%)", background: "var(--color-primary,#8C3130)", color: "#fff", padding: "8px 16px", borderRadius: 6, fontSize: 13, zIndex: 100 }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
