// components/reader/useReaderSearch.tsx v1.15.8
"use client";

/** 页内搜索：查询状态、命中计算与正文高亮渲染，从 RemoteReader.tsx 拆出 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildReaderMatches, splitHighlight } from "@/lib/readerSearch";
import { PAGE_SIZE } from "./constants";

export function useReaderSearch(opts: {
  initialQuery: string;
  searchChapters: { title: string; paragraphs: string[] }[];
  simple: boolean;
}) {
  const { initialQuery, searchChapters, simple } = opts;
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  // 由检索结果带入关键词：自动打开页内搜索
  useEffect(() => {
    if (initialQuery) {
      setShowSearch(true);
      setSearchQuery(initialQuery);
      setSubmittedQuery(initialQuery);
    }
  }, [initialQuery]);

  const matches = useMemo(
    () => (submittedQuery ? buildReaderMatches(searchChapters, submittedQuery, PAGE_SIZE, simple) : []),
    [searchChapters, submittedQuery, simple]
  );

  const submit = useCallback(() => setSubmittedQuery(searchQuery.trim()), [searchQuery]);
  const close = useCallback(() => {
    setShowSearch(false);
    setSubmittedQuery("");
  }, []);

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

  return { showSearch, setShowSearch, searchQuery, setSearchQuery, submittedQuery, matches, submit, close, renderText };
}
