"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import data from "@/lib/data-generated";
import { getChapterText } from "@/lib/search";
import { toSimplified } from "@/lib/t2s";
import type { Book } from "@/lib/types";

interface ReaderClientProps {
  bookTitle: string;
}

export default function ReaderClient({ bookTitle }: ReaderClientProps) {
  const book: Book =
    data.books.find((b) => b.title === decodeURIComponent(bookTitle)) || data.books[0];
  const [chapterIdx, setChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showImage, setShowImage] = useState(false);
  const [simplified, setSimplified] = useState(false);
  const [pop, setPop] = useState<{ char: string; pinyin: string; meaning: string; usage: string } | null>(null);
  const [popPos, setPopPos] = useState({ top: 0, left: 0 });
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const si = localStorage.getItem("ab-simple") === "1";
    setSimplified(si);
  }, []);

  if (!book) return <div className="empty-state">典籍不存在</div>;

  const chapters = book.chapters;
  const idx = Math.min(chapterIdx, chapters.length - 1);
  const title = chapters[idx];
  const text = getChapterText(book, idx);

  const renderText = () => {
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

  const toggleSimplified = () => {
    const next = !simplified;
    setSimplified(next);
    localStorage.setItem("ab-simple", next ? "1" : "0");
  };

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <Link href="/book-list">{toSimplified(book.category)}</Link>
        <span className="sep">/</span>
        <span>{toSimplified(book.title)}</span>
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
            <button onClick={() => setChapterIdx((i) => Math.max(0, i - 1))}>‹</button>
            <button onClick={() => setChapterIdx((i) => Math.min(chapters.length - 1, i + 1))}>›</button>
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
                style={{ "--reader-fs": `${fontSize}px`, "--reader-lh": lineHeight } as React.CSSProperties}
              >
                {renderText()}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="reader-body"
            ref={bodyRef}
            onClick={onCharClick}
            style={{ "--reader-fs": `${fontSize}px`, "--reader-lh": lineHeight } as React.CSSProperties}
          >
            {renderText()}
          </div>
        )}

        <div className="reader-nav">
          <button
            className="btn btn-secondary"
            onClick={() => setChapterIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
          >
            ‹ 上一章
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setChapterIdx((i) => Math.min(chapters.length - 1, i + 1))}
            disabled={idx === chapters.length - 1}
          >
            下一章 ›
          </button>
        </div>
        <div className="reader-progress">阅读进度已自动保存，下次打开将继续</div>
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
