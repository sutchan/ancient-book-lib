"use client";

import { useState } from "react";
import { confirmDownload, downloadText, buildCategoryTxt } from "@/lib/download";
import { getChapterText } from "@/lib/search";
import { toSimplified } from "@/lib/t2s";
import type { Book } from "@/lib/types";

/** 馆藏批量下载（B2 合规下载：馆藏粒度，繁体保真版） */
export default function CategoryDownload({
  category,
  books,
}: {
  category: string;
  books: Book[];
}) {
  const [busy, setBusy] = useState(false);

  const doDownload = () => {
    if (!confirmDownload()) return;
    setBusy(true);
    try {
      const txt = buildCategoryTxt(
        category,
        books.map((b) => ({
          title: b.title,
          meta: `${b.dynasty} · ${b.author}`,
          body: b.chapters.map((c, i) => `【${c}】\n${getChapterText(b, i)}\n`).join(""),
        }))
      );
      downloadText(`${category}·馆藏合集.txt`, toSimplified(txt));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className="btn btn-secondary" onClick={doDownload} disabled={busy} style={{ fontSize: 12, padding: "4px 10px" }}>
      下载馆藏合集
    </button>
  );
}
