"use client";

import { useState } from "react";
import { confirmDownload, downloadText, buildBookTxt } from "@/lib/download";
import { getChapterText } from "@/lib/search";
import { toSimplified } from "@/lib/t2s";
import type { Book } from "@/lib/types";

/**
 * 书籍详情页下载操作（B2 合规下载：单本粒度）
 * 繁体原版 = 100% 保真原文；简体对照 = 按当前繁简映射库转换
 */
export default function BookActions({ book }: { book: Book }) {
  const [busy, setBusy] = useState(false);

  const doDownload = (simplified: boolean) => {
    if (!confirmDownload()) return;
    setBusy(true);
    try {
      const chapters = book.chapters.map((c, i) => ({
        title: c,
        text: getChapterText(book, i),
      }));
      const txt = buildBookTxt(
        book.title,
        `${book.dynasty} · ${book.author}`,
        chapters.map((c) => ({
          title: c.title,
          text: simplified ? toSimplified(c.text) : c.text,
        }))
      );
      downloadText(`${book.title}${simplified ? "·简体对照" : "·繁体原版"}.txt`, txt);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="book-actions">
      <button className="btn btn-primary" onClick={() => doDownload(false)} disabled={busy}>
        下载整本（繁体原版）
      </button>
      <button className="btn btn-secondary" onClick={() => doDownload(true)} disabled={busy}>
        下载整本（简体对照）
      </button>
      <span className="download-notice">
        下载内容取自精选典籍演示样张（节选示例），完整古籍请通过「全馆藏」检索上游原文。
        下载即视为同意：本资源仅供学术研究与个人学习，禁止商用与二次售卖。
      </span>
    </div>
  );
}
