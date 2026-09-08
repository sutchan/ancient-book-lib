"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { searchAll, distinctDynasties, categoryNames } from "@/lib/search";
import { toSimplified } from "@/lib/t2s";
import data from "@/lib/data-generated";

export default function SearchClient() {
  const sp = useSearchParams();
  const [kw, setKw] = useState(sp.get("q") || "不亦说乎");
  const [mode, setMode] = useState<"title" | "full">(
    sp.get("mode") === "title" ? "title" : "full"
  );
  const [category, setCategory] = useState(sp.get("category") || "");
  const [dynasty, setDynasty] = useState(sp.get("dynasty") || "");
  const [limit, setLimit] = useState(12);
  const [results, setResults] = useState(() =>
    searchAll(kw, "full", 12, { category: "", dynasty: "" })
  );

  const run = useCallback(
    (q: string, m: "title" | "full", cat: string, dyn: string, lim: number) => {
      setResults(
        searchAll(q, m, lim, {
          category: cat || undefined,
          dynasty: dyn || undefined,
        })
      );
    },
    []
  );

  useEffect(() => {
    run(kw, mode, category, dynasty, limit);
  }, [kw, mode, category, dynasty, limit, run]);

  const shown = results;
  // searchAll 已按 limit 截断；仅有结果恰好达到上限时才提示「可能还有更多」
  const hasMore = results.length === limit;
  const dynasties = useMemo(() => distinctDynasties(), []);
  const cats = useMemo(() => categoryNames(), []);

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>检索</span>
      </div>
      <div className="search-box" style={{ maxWidth: 700, marginBottom: 24 }}>
        <input
          className="input-text"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="输入关键词，如：论语、仁义、孔子"
          aria-label="检索关键词"
        />
        <button className="btn btn-primary search-btn" onClick={() => run(kw, mode, category, dynasty, limit)}>
          搜索
        </button>
      </div>
      <div className="filter-panel">
        <div className="search-mode-group" role="radiogroup" aria-label="检索模式">
          <button
            className={`btn-toggle ${mode === "title" ? "on" : ""}`}
            onClick={() => setMode("title")}
            aria-pressed={mode === "title"}
          >
            {toSimplified("标题检索")}
          </button>
          <button
            className={`btn-toggle ${mode === "full" ? "on" : ""}`}
            onClick={() => setMode("full")}
            aria-pressed={mode === "full"}
          >
            {toSimplified("全文检索")}
          </button>
        </div>
        <select
          aria-label="馆藏筛选"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">全部馆藏</option>
          {cats.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="朝代筛选"
          value={dynasty}
          onChange={(e) => setDynasty(e.target.value)}
        >
          <option value="">全部朝代</option>
          {dynasties.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select aria-label="每页条数" value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10))}>
          <option value={10}>每页10条</option>
          <option value={20}>每页20条</option>
          <option value={50}>每页50条</option>
        </select>
      </div>
      <div className="search-stat">
        关键词「{kw}」· {mode === "title" ? "标题模式" : "全文模式"}
        {category && ` · ${category}`}
        {dynasty && ` · ${dynasty}`} 共命中 {data.books.length + data.characters.length} 部可检对象
        （演示返回 {shown.length} 条）
      </div>
      {shown.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">未找到相关内容</div>
          <div>请尝试更换关键词或减少筛选条件</div>
        </div>
      ) : (
        shown.map((r, i) => (
          <div className="search-result-item" key={i}>
            <div className="result-title">
              <Link
                href={
                  r.kind === "book"
                    ? `/book/${data.books.find((b) => b.title === r.book)?.id ?? ""}`
                    : "/character"
                }
              >
                {toSimplified(r.book)} · {toSimplified(r.chapter)}
              </Link>
            </div>
            <div className="path-info">
              <span>{toSimplified(r.path)}</span>
              <span className="score-badge">{r.score}</span>
            </div>
            <div className="snippet">
              {r.snippet.split(kw).map((part, idx) =>
                idx === 0 ? (
                  <span key={idx}>{toSimplified(part)}</span>
                ) : (
                  <span key={idx}>
                    <mark>{toSimplified(kw)}</mark>
                    {toSimplified(part)}
                  </span>
                )
              )}
            </div>
          </div>
        ))
      )}
      {hasMore && <div className="search-more">已显示前 {shown.length} 条，演示数据仅覆盖核心典籍</div>}
    </section>
  );
}
