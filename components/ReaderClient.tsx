"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import data from "@/lib/data-generated";
import { getChapterText } from "@/lib/search";
import { toSimplified } from "@/lib/t2s";
import { confirmDownload, downloadText } from "@/lib/download";
import type { Book } from "@/lib/types";

interface ReaderClientProps {
  bookTitle: string;
}

/** 章节内每页段落数（O2 章节分页） */
const PAGE_SIZE = 4;

export default function ReaderClient({ bookTitle }: ReaderClientProps) {
  const router = useRouter();
  const book: Book =
    data.books.find((b) => b.title === bookTitle) || data.books[0];
  const chapters = book.chapters;
  const [chapterIdx, setChapterIdx] = useState(0);
  const [pageIdx, setPageIdx] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showImage, setShowImage] = useState(false);
  const [simplified, setSimplified] = useState(false);
  const [text, setText] = useState(() => getChapterText(book, 0));
  const [pop, setPop] = useState<{ char: string; pinyin: string; meaning: string; usage: string } | null>(null);
  const [popPos, setPopPos] = useState({ top: 0, left: 0 });
  const [sel, setSel] = useState<{ text: string; x: number; y: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // I1 阅读进度恢复（仅初始化一次）
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ab-progress");
      if (raw) {
        const m = JSON.parse(raw);
        const saved = m[book.id];
        if (typeof saved === "number") {
          setChapterIdx(Math.min(saved, chapters.length - 1));
        }
      }
    } catch {
      /* 忽略损坏数据 */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // I1 进度保存 + O1 已读片段缓存（章节切换时）
  const idx = Math.min(chapterIdx, chapters.length - 1);
  useEffect(() => {
    const cacheKey = `ab-read-${book.id}-${idx}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setText(cached);
      else {
        const t = getChapterText(book, idx);
        setText(t);
        localStorage.setItem(cacheKey, t);
      }
      const m = JSON.parse(localStorage.getItem("ab-progress") || "{}");
      m[book.id] = idx;
      localStorage.setItem("ab-progress", JSON.stringify(m));
    } catch {
      setText(getChapterText(book, idx));
    }
    setPageIdx(0);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (!book) return <div className="empty-state">典籍不存在</div>;

  const title = chapters[idx];

  const renderParas = () => {
    let out = text;
    if (simplified) out = toSimplified(out);
    // 生僻字标注（仅繁体原版时保留可点击）
    data.glossary.forEach((g) => {
      if (out.includes(g.char)) {
        out = out.split(g.char).join(`<span class="guji-char" data-char="${g.char}">${g.char}</span>`);
      }
    });
    return out.split("\n").map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p }} />);
  };

  const paras = renderParas();
  const pageCount = Math.max(1, Math.ceil(paras.length / PAGE_SIZE));
  const curPage = Math.min(pageIdx, pageCount - 1);
  const pageParas = paras.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE);

  const onCharClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest(".guji-char") as HTMLElement | null;
    if (!target) return;
    const ch = target.getAttribute("data-char") || "";
    const g = data.glossary.find((x) => x.char === ch);
    if (!g) return;
    const rect = target.getBoundingClientRect();
    setPop({ char: g.char, pinyin: g.pinyin, meaning: g.meaning, usage: g.usage });
    setPopPos({ top: rect.bottom + window.scrollY + 8, left: Math.min(rect.left + window.scrollX, window.innerWidth - 320) });
  };

  // I2 划词溯源：选中文本后弹出「检索此句」
  const onMouseUp = () => {
    const selection = window.getSelection();
    const t = selection ? selection.toString().trim() : "";
    if (t && t.length <= 40) {
      try {
        const rect = selection!.getRangeAt(0).getBoundingClientRect();
        setSel({
          text: t,
          x: Math.min(rect.left + window.scrollX, window.innerWidth - 160),
          y: rect.bottom + window.scrollY + 6,
        });
      } catch {
        setSel(null);
      }
    } else {
      setSel(null);
    }
  };

  const goSearch = () => {
    if (sel) router.push(`/search?q=${encodeURIComponent(sel.text)}`);
    setSel(null);
  };

  const toggleSimplified = () => {
    const next = !simplified;
    setSimplified(next);
    localStorage.setItem("ab-simple", next ? "1" : "0");
  };

  // B2 单章下载（当前模式文本）
  const downloadChapter = () => {
    if (!confirmDownload()) return;
    downloadText(`${book.title}-${title}.txt`, simplified ? toSimplified(text) : text);
  };

  const setChapter = (i: number) => setChapterIdx(Math.max(0, Math.min(chapters.length - 1, i)));

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <Link href={`/book/${book.id}`}>{toSimplified(book.title)}</Link>
        <span className="sep">/</span>
        <span>{toSimplified(title)}</span>
      </div>
      <div className="reader-wrap">
        <div className="reader-title">
          {toSimplified(book.title)} · {toSimplified(title)}
        </div>
        <div className="reader-sub">
          {toSimplified(book.dynasty)} · {toSimplified(book.author)}
        </div>
        <div className="reader-toolbar">
          <div className="ctrl">
            字号
            <button onClick={() => setFontSize((f) => Math.max(14, f - 2))}>A-</button>
            <button onClick={() => setFontSize((f) => Math.min(22, f + 2))}>A+</button>
          </div>
          <div className="ctrl">
            行距
            <button onClick={() => setLineHeight((l) => Math.max(1.5, +(l - 0.2).toFixed(1)))}>疏</button>
            <button onClick={() => setLineHeight((l) => Math.min(2.2, +(l + 0.2).toFixed(1)))}>密</button>
          </div>
          <div className="ctrl">
            章节
            <button onClick={() => setChapter(idx - 1)}>‹</button>
            <button onClick={() => setChapter(idx + 1)}>›</button>
          </div>
          <div className="ctrl">
            页 <span>{curPage + 1}/{pageCount}</span>
            <button onClick={() => setPageIdx((p) => Math.max(0, p - 1))}>‹</button>
            <button onClick={() => setPageIdx((p) => Math.min(pageCount - 1, p + 1))}>›</button>
          </div>
          <div className="ctrl">
            进度 <span>{idx + 1}/{chapters.length}</span>
          </div>
          <div className="ctrl">
            <button className={`btn-toggle ${simplified ? "on" : ""}`} onClick={toggleSimplified}>
              {simplified ? "繁體" : "简体"}
            </button>
          </div>
          <div className="ctrl">
            <button className={`btn-toggle ${showImage ? "on" : ""}`} onClick={() => setShowImage(!showImage)}>
              影像对照
            </button>
          </div>
          <div className="ctrl">
            <button className="btn btn-secondary" onClick={downloadChapter} style={{ fontSize: 12, padding: "3px 10px" }}>
              下载本章
            </button>
          </div>
        </div>

        {showImage ? (
          <div className="image-compare">
            <div className="ic-left">
              <div className="ic-title">原书影像</div>
              <div
                className="ic-img"
                style={{
                  background: "linear-gradient(135deg,#f5f0e6 0%,#efe6d4 60%,#e8dcc4 100%)",
                  border: "1px solid #d8c9a8",
                }}
              >
                <div style={{ fontSize: 12, color: "#8a7350", padding: "28px 16px", textAlign: "center", lineHeight: 1.9 }}>
                  刻本影像示意图
                  <br />
                  （上线版接入 GitHub 原文影像深链）
                </div>
              </div>
              <div className="ic-meta">
                底本：{toSimplified(book.dynasty)} 刻本 · {toSimplified(book.title)}
              </div>
            </div>
            <div className="ic-right">
              <div className="ic-title">整理文本</div>
              <div
                className="reader-body"
                ref={bodyRef}
                onClick={onCharClick}
                onMouseUp={onMouseUp}
                style={{ "--reader-fs": `${fontSize}px`, "--reader-lh": lineHeight } as React.CSSProperties}
              >
                {pageParas}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="reader-body"
            ref={bodyRef}
            onClick={onCharClick}
            onMouseUp={onMouseUp}
            style={{ "--reader-fs": `${fontSize}px`, "--reader-lh": lineHeight } as React.CSSProperties}
          >
            {pageParas}
          </div>
        )}

        {sel && (
          <button
            className="search-sel-btn"
            style={{ position: "absolute", top: sel.y, left: sel.x }}
            onClick={goSearch}
          >
            检索「{sel.text}」
          </button>
        )}

        <div className="reader-nav">
          <button className="btn btn-secondary" onClick={() => setChapter(idx - 1)} disabled={idx === 0}>
            ‹ 上一章
          </button>
          <span className="reader-progress">
            已自动保存阅读进度 · 章节 {idx + 1}/{chapters.length} · 页 {curPage + 1}/{pageCount}
          </span>
          <button className="btn btn-primary" onClick={() => setChapter(idx + 1)} disabled={idx === chapters.length - 1}>
            下一章 ›
          </button>
        </div>
      </div>

      {pop && (
        <div className="glossary-pop" style={{ display: "block", top: popPos.top, left: popPos.left }}>
          <div className="gp-char">{pop.char}</div>
          <div className="gp-pinyin">{toSimplified(pop.pinyin)}</div>
          <div>{toSimplified(pop.meaning)}</div>
          <div className="gp-usage">例句：{toSimplified(pop.usage)}</div>
          <button
            style={{ marginTop: 8, background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: 13 }}
            onClick={() => setPop(null)}
          >
            关闭
          </button>
        </div>
      )}
    </section>
  );
}
