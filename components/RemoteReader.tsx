"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { loadCatalog, findBookById, formatSize, type CatalogEntry } from "@/lib/catalog";
import { toSimplified } from "@/lib/t2s";
import { downloadText, DOWNLOAD_NOTICE, confirmDownload } from "@/lib/download";

const PAGE_SIZE = 8;

/** 章节标题识别：卷X / 第X回 / 第X章 / 篇X / 学而第一 等短行 */
const CHAPTER_PATTERNS = [
  /^卷[之其]?[一二三四五六七八九十百千零\d]+/,
  /^第[一二三四五六七八九十百千零\d]+[回卷章节篇折]/,
  /^[甲乙丙丁戊己庚辛壬癸][之]?[一二三四五六七八九十]?/,
  /^.{1,12}[第卷篇回章节][一二三四五六七八九十百千零\d]?$/,
];

function isChapterTitle(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 20) return false;
  if (t.startsWith("　") || t.startsWith(" ")) return false;
  return CHAPTER_PATTERNS.some((p) => p.test(t));
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

  for (const line of lines) {
    if (isChapterTitle(line)) {
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
  const [chapterIdx, setChapterIdx] = useState(0);
  const [pageIdx, setPageIdx] = useState(0);
  const [simple, setSimple] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.8);

  // 加载书目元数据 + raw TXT
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const catalog = await loadCatalog();
        const b = findBookById(catalog, bookId);
        if (!b) { setError("未找到该书目"); return; }
        if (cancelled) return;
        setBook(b);
        // 已读缓存
        const cached = typeof window !== "undefined" ? localStorage.getItem(`ab-remote-${bookId}`) : null;
        const resp = await fetch(b.rawUrl);
        if (!resp.ok) throw new Error(`原文加载失败: ${resp.status}`);
        const text = await resp.text();
        if (cancelled) return;
        setContent(text);
        if (cached) {
          try {
            const p = JSON.parse(cached);
            setChapterIdx(p.chapterIdx || 0);
            setPageIdx(p.pageIdx || 0);
          } catch { /* ignore */ }
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookId]);

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
    if (!confirmDownload()) return;
    const modeText = simple ? "简体对照版" : "繁体原版";
    const body = simple ? toSimplified(content) : content;
    downloadText(`${book.title}_${modeText}.txt`, body, book.title);
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

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}>正在从殆知阁加载原文...</div>;
  if (error) return (
    <div style={{ padding: 40 }}>
      <h3>加载失败</h3>
      <p style={{ color: "#c00" }}>{error}</p>
      <p>可直接访问上游原文：{book && <a href={book?.rawUrl} target="_blank" rel="noopener">{book.rawUrl}</a>}</p>
      <Link href="/catalog" className="btn btn-secondary">返回书目</Link>
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
