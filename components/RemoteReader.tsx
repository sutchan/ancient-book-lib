"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { loadCatalog, findBookById, formatSize, type CatalogEntry } from "@/lib/catalog";
import { toSimplified } from "@/lib/t2s";
import { downloadText, DOWNLOAD_NOTICE, confirmDownload } from "@/lib/download";
import { fetchTextWithTimeout, FetchTimeoutError } from "@/lib/fetchWithTimeout";
import { getCachedBook, setCachedBook } from "@/lib/idb";

const PAGE_SIZE = 8;
const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB 以上视为大文件
const FETCH_TIMEOUT = 60000; // 60秒超时（大文件需要更长时间）

/** 章节标题识别：卷X / 第X回 / 第X章 / 篇X / 学而第一 等短行 */
const CHAPTER_PATTERNS = [
  /^卷[之其]?[一二三四五六七八九十百千零\d]+/,
  /^第[一二三四五六七八九十百千零\d]+[回卷章节篇折]/,
  // 天干编号：要求天干后必须有数字或"集/部/篇/卷/之"，避免单独"甲"字误匹配
  /^[甲乙丙丁戊己庚辛壬癸][之]?[一二三四五六七八九十百千零\d]+/,
  /^[甲乙丙丁戊己庚辛壬癸][集部篇卷]/,
];

// 正文中可能出现但不是章节标题的引用词（移除过于宽泛的"如""见"）
const NON_CHAPTER_KEYWORDS = ["参阅", "参考", "参见", "详见", "另见", "又见", "语见", "出自"];

function isChapterTitle(line: string, prevLine?: string, nextLine?: string): boolean {
  const t = line.trim();
  // 长度限制：2-20 字
  if (!t || t.length < 2 || t.length > 20) return false;
  // 不以缩进开头（正文通常缩进）
  if (line.startsWith("　") || line.startsWith(" ")) return false;
  // 排除含正文引用关键词的行
  if (NON_CHAPTER_KEYWORDS.some((k) => t.includes(k))) return false;
  // 排除含标点的行（章节标题通常无标点）
  if (/[，。！？；：、""''（）【】]/.test(t)) return false;

  const matched = CHAPTER_PATTERNS.some((p) => p.test(t));
  if (!matched) return false;

  // 上下文校验：章节标题前后应为空行或文件边界
  const prevEmpty = !prevLine || !prevLine.trim();
  const nextEmpty = !nextLine || !nextLine.trim();
  // 至少一侧为空行（容忍某些格式不规范的古籍）
  if (!prevEmpty && !nextEmpty) return false;

  return true;
}

/** 解析 TXT 为章节数组 */
function parseChapters(text: string, bookTitle: string): { title: string; paragraphs: string[] }[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const chapters: { title: string; paragraphs: string[] }[] = [];
  let current: { title: string; paragraphs: string[] } | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (current && buf.length > 0) {
      current.paragraphs.push(...buf.filter((p) => p.trim()));
      buf = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : undefined;
    const nextLine = i < lines.length - 1 ? lines[i + 1] : undefined;
    if (isChapterTitle(line, prevLine, nextLine)) {
      flush();
      if (current) chapters.push(current);
      current = { title: line.trim(), paragraphs: [] };
    } else {
      const trimmed = line.trim();
      if (trimmed) buf.push(trimmed);
    }
  }
  flush();
  if (current) chapters.push(current);

  // 无法识别章节时，整书作为一章
  if (chapters.length === 0) {
    return [{ title: bookTitle, paragraphs: lines.map((l) => l.trim()).filter(Boolean) }];
  }
  // 过滤掉只有标题无正文的空章节
  return chapters.filter((c) => c.paragraphs.length > 0);
}

export default function RemoteReader({ bookId }: { bookId: string }) {
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

  // 加载原文（带缓存 + 大文件保护 + 超时 + 进度 + CDN 镜像降级）
  // force=true 时跳过大小警告检查（用户已确认加载大文件）
  const loadContent = useCallback(async (b: CatalogEntry, force = false) => {
    // 1. 先查 IndexedDB 缓存
    const cached = await getCachedBook(b.id);
    if (cached) {
      setLoadingFromCache(true);
      setContent(cached);
      setLoading(false);
      recordRecent(b);
      return;
    }
    setLoadingFromCache(false);

    // 2. 大文件警告（>5MB），force 时跳过
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
        // 4. 写入缓存（异步，不阻塞渲染）
        setCachedBook(b.id, b.title, text);
        recordRecent(b);
        setContent(text);
        setLoading(false);
        return;
      } catch (e: any) {
        lastError = e;
        // 继续尝试下一个镜像
      }
    }

    // 所有源都失败
    throw lastError || new Error("所有数据源均加载失败");
  }, [recordRecent]);

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
        if (progressStr) {
          try {
            const p = JSON.parse(progressStr);
            setChapterIdx(p.chapterIdx || 0);
            setPageIdx(p.pageIdx || 0);
          } catch { /* ignore */ }
        }

        await loadContent(b);
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

  const chapters = useMemo(
    () => (content && book ? parseChapters(content, book.title) : []),
    [content, book]
  );

  const current = chapters[chapterIdx];
  const totalPages = current ? Math.ceil(current.paragraphs.length / PAGE_SIZE) : 1;
  const pageParagraphs = current
    ? current.paragraphs.slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE)
    : [];

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
    setChapterIdx(Math.max(0, Math.min(chapters.length - 1, idx)));
    setPageIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [chapters.length]);

  const handleDownload = useCallback(() => {
    if (!book || !content) return;
    // 大文件（>5MB）直接打开上游原文（跨域 download 属性无效，用户可右键另存为）
    if (book.size > LARGE_FILE_THRESHOLD) {
      window.open(book.rawUrl, "_blank", "noopener");
      return;
    }
    if (!confirmDownload()) return;
    const modeText = simple ? "简体对照版" : "繁体原版";
    const body = simple ? toSimplified(content) : content;
    downloadText(`${book.title}_${modeText}.txt`, body);
  }, [book, content, simple]);

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

  // 大文件警告确认后加载（force=true 跳过大小检查）
  const confirmLargeLoad = useCallback(() => {
    if (!book) return;
    setShowLargeWarning(false);
    setLoading(true);
    loadContent(book, true);
  }, [book, loadContent]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>
        {loadingFromCache ? "从本地缓存加载..." : "正在从殆知阁加载原文..."}
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
          <a className="btn btn-secondary" href={book.rawUrl} target="_blank" rel="noopener">打开原文（可另存为）</a>
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
          可直接访问上游原文：<a href={book.rawUrl} target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>{book.rawUrl}</a>
        </p>
      )}
      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button className="btn btn-primary" onClick={() => { setError(null); setLoading(true); if (book) loadContent(book, true); }}>重试</button>
        <Link href="/catalog" className="btn btn-secondary">返回书目</Link>
      </div>
    </div>
  );
  if (!book || !current) return null;

  return (
    <div className="reader-wrap">
      <div className="reader-title">{book.title}</div>
      <div className="reader-sub">
        {book.category} › {book.subcategories.join(" › ")} · {formatSize(book.size)} · {chapters.length} 章
        · <a href={book.rawUrl} target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>上游原文</a>
      </div>

      {/* 工具栏 */}
      <div className="reader-toolbar">
        <div className="ctrl">
          <span>字号</span>
          <button onClick={() => setFontSize(Math.max(14, fontSize - 1))}>A-</button>
          <button onClick={() => setFontSize(Math.min(22, fontSize + 1))}>A+</button>
        </div>
        <div className="ctrl">
          <span>行距</span>
          <button onClick={() => setLineHeight(Math.max(1.5, +(lineHeight - 0.1).toFixed(1)))}>－</button>
          <button onClick={() => setLineHeight(Math.min(2.4, +(lineHeight + 0.1).toFixed(1)))}>＋</button>
        </div>
        <label className="ctrl" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={simple} onChange={(e) => setSimple(e.target.checked)} style={{ marginRight: 4 }} />
          简体对照
        </label>
        <button className="btn btn-secondary" style={{ fontSize: 13, padding: "5px 12px" }} onClick={handleDownload}>
          下载本书
        </button>
      </div>

      {/* 阅读进度条 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>
          <span>阅读进度</span>
          <span>{chapters.length > 0 ? Math.round(((chapterIdx + 1) / chapters.length) * 100) : 0}%</span>
        </div>
        <div style={{ background: "var(--color-border,#eee)", borderRadius: 4, height: 6, overflow: "hidden" }}>
          <div style={{ background: "var(--color-primary,#8C3130)", height: "100%", width: `${chapters.length > 0 ? ((chapterIdx + 1) / chapters.length) * 100 : 0}%`, transition: "width 0.3s" }} />
        </div>
      </div>

      {/* 章节导航 */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <button className="btn btn-secondary" disabled={chapterIdx === 0} onClick={() => goChapter(chapterIdx - 1)} style={{ fontSize: 13 }}>
          ← 上一章
        </button>
        <select
          value={chapterIdx}
          onChange={(e) => goChapter(+e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--color-border)", fontSize: 13 }}
        >
          {chapters.map((c, i) => (
            <option key={i} value={i}>第 {i + 1} 章 · {c.title}</option>
          ))}
        </select>
        <button className="btn btn-secondary" disabled={chapterIdx >= chapters.length - 1} onClick={() => goChapter(chapterIdx + 1)} style={{ fontSize: 13 }}>
          下一章 →
        </button>
      </div>

      {/* 正文 */}
      <div
        className="reader-body"
        style={{ fontSize, lineHeight, userSelect: "text" }}
        onMouseUp={() => { /* selection handler above */ }}
      >
        <h3 style={{ textAlign: "center", marginBottom: 20, fontSize: 18 }}>{current.title}</h3>
        {pageParagraphs.map((p, i) => (
          <p key={i}>{simple ? toSimplified(p) : p}</p>
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 32 }}>
          <button className="btn btn-secondary" disabled={pageIdx === 0} onClick={() => { setPageIdx(pageIdx - 1); window.scrollTo({ top: 0 }); }} style={{ fontSize: 13 }}>上一页</button>
          <span style={{ fontSize: 13 }}>第 {pageIdx + 1} / {totalPages} 页</span>
          <button className="btn btn-secondary" disabled={pageIdx >= totalPages - 1} onClick={() => { setPageIdx(pageIdx + 1); window.scrollTo({ top: 0 }); }} style={{ fontSize: 13 }}>下一页</button>
        </div>
      )}

      <div className="reader-progress">
        已自动保存阅读进度 · 章节 {chapterIdx + 1}/{chapters.length} · 页 {pageIdx + 1}/{totalPages}
      </div>

      {/* 划词检索浮动按钮 */}
      {selBtn && (
        <a
          href={`/search?q=${encodeURIComponent(selBtn.text)}&mode=full`}
          className="search-sel-btn"
          style={{ left: selBtn.x, top: selBtn.y, position: "fixed", transform: "translateX(-50%)" }}
          onClick={() => setSelBtn(null)}
        >
          检索「{selBtn.text}」
        </a>
      )}
    </div>
  );
}
