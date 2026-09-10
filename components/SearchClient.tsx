// components/SearchClient.tsx v1.4.3
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadCatalog, type DaizhigeCatalog } from "@/lib/catalog";
import {
  loadFulltextIndex,
  searchFulltext,
  searchByTitle,
  type SearchResult,
} from "@/lib/search";
import { toSimplified } from "@/lib/t2s";
import PeopleSearchResults from "@/components/PeopleSearchResults";

export default function SearchClient() {
  const sp = useSearchParams();
  const [kw, setKw] = useState(sp.get("q") || "论语");
  const [mode, setMode] = useState<"title" | "full">(sp.get("mode") === "title" ? "title" : "full");
  const [category, setCategory] = useState(sp.get("category") || "");
  const [limit, setLimit] = useState(12);
  const [catalog, setCatalog] = useState<DaizhigeCatalog | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [indexReady, setIndexReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog()
      .then(setCatalog)
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!catalog) return;
    const q = kw.trim();
    if (!q) {
      setResults([]);
      setTotal(0);
      return;
    }
    let cancelled = false;
    (async () => {
      if (mode === "title") {
        const r = searchByTitle(q, catalog, { category: category || undefined }, limit);
        if (!cancelled) {
          setResults(r);
          setTotal(r.length);
          setIndexReady(null);
        }
      } else {
        const idx = await loadFulltextIndex();
        if (cancelled) return;
        setIndexReady(!!idx);
        const r = idx
          ? searchFulltext(q, idx, catalog, limit)
          : searchByTitle(q, catalog, { category: category || undefined }, limit);
        if (!cancelled) {
          setResults(r);
          setTotal(r.length);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kw, mode, category, limit, catalog]);

  const cats = useMemo(
    () => (catalog ? Object.entries(catalog.stats).map(([name, count]) => ({ name, count })) : []),
    [catalog]
  );

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
        <button className="btn btn-primary search-btn">搜索</button>
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
        <select aria-label="馆藏筛选" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">全部馆藏</option>
          {cats.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}（{c.count}）
            </option>
          ))}
        </select>
        <select
          aria-label="每页条数"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value, 10))}
        >
          <option value={10}>每页10条</option>
          <option value={20}>每页20条</option>
          <option value={50}>每页50条</option>
        </select>
      </div>

      {mode === "full" && indexReady === false && (
        <div className="search-stat" style={{ color: "var(--color-text-secondary)" }}>
          全文索引尚未生成，已回退为标题检索（运行 <code>npm run build:fulltext</code> 开启真正全文检索）
        </div>
      )}
      {error && (
        <div className="search-stat" style={{ color: "#c00" }}>
          索引加载失败：{error}
        </div>
      )}

      {/* CBDB 人物匹配（懒加载） */}
      {kw.trim() && <PeopleSearchResults query={kw} />}

      <div className="search-stat">
        关键词「{kw}」· {mode === "title" ? "标题模式" : "全文模式"} · 命中 {total} 部
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">未找到相关内容</div>
          <div>请尝试更换关键词或减少筛选条件</div>
        </div>
      ) : (
        results.map((r) => (
          <div className="search-result-item" key={r.id}>
            <div className="result-title">
              <Link href={`/read/remote?id=${r.id}`}>{toSimplified(r.book)}</Link>
            </div>
            <div className="path-info">
              <span>{toSimplified(r.path)}</span>
              <span className="score-badge">{r.score}</span>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
