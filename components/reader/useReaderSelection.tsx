// components/reader/useReaderSelection.tsx v1.15.8
"use client";

/** 划词检索：选区浮层定位、学术引用复制与 toast 提示，从 RemoteReader.tsx 拆出 */
import { useCallback, useEffect, useState } from "react";
import { formatCitation, copyText } from "@/lib/citation";

export function useReaderSelection(book: { title: string } | null, currentTitle: string) {
  const [selBtn, setSelBtn] = useState<{ text: string; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  // 划词：跳转全文检索
  const searchSelection = useCallback((text: string) => {
    window.open(`/search?q=${encodeURIComponent(text)}&mode=full`, "_blank");
    setSelBtn(null);
  }, []);

  return { selBtn, toast, showToast, copyCitation, searchSelection };
}
