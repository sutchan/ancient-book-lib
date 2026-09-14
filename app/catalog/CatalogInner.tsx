// app/catalog/CatalogInner.tsx v1.15.8
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  loadCatalog,
  searchCatalog,
  getSubcategories,
  formatSize,
  type DaizhigeCatalog,
} from "@/lib/catalog";
import { exportBooklistCsv } from "@/lib/download";
import { useBookmarks } from "@/lib/useBookmarks";
import { addBookmark, removeBookmark } from "@/lib/bookmarks";
import CatalogBookRow from "./CatalogBookRow";
import EmptyState from "@/components/EmptyState";
import {
  BOOK_COUNT_LABEL,
  DATA_SOURCE,
  SEARCH_PLACEHOLDER,
  EMPTY_RESULT_TITLE,
  EMPTY_RESULT_HINT,
} from "@/lib/constants";

const PAGE_SIZE = 50;

const CATEGORY_ICONS: Record<string, string> = {
  佛藏: "🏛", 儒藏: "📜", 医藏: "⚕", 史藏: "📚", 子藏: "💭",
  易藏: "🔮", 艺藏: "🎨", 诗藏: "🖋", 道藏: "☯", 集藏: "📖",
};

export default function CatalogInner() {
  const params = useSearchParams();
  const [catalog, setCatalog] = useState<DaizhigeCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputKw, setInputKw] = useState(params.get("q") || "");
  const [kw, setKw] = useState(params.get("q") || ""); // 防抖后的搜索词
  const [category, setCategory] = useState(params.get("category") || "");
  const [subcat, setSubcat] = useState("");
  const [page, setPage] = useState(1);

  const bm = useBookmarks();
  const bmSet = new Set(bm.map((x) => x.id));
  const toggleBm = (b: { id: string; title: string; category: string }) => {
    if (bmSet.has(b.id)) removeBookmark(b.id);
    else addBookmark({ id: b.id, title: b.title, category: b.category });
  };

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e) => setError(String(e)));
  }, []);

  // 搜索防抖：250ms
  useEffect(() => {
    const t = setTimeout(() => setKw(inputKw), 250);
    return () => clearTimeout(t);
  }, [inputKw]);

  useEffect(() => { setPage(1); }, [kw, category, subcat]);

  const subcategories = useMemo(
    () => (catalog && category ? getSubcategories(catalog, category) : []),
    [catalog, category]
  );

  const filtered = useMemo(() => {
    if (!catalog) return [];
    let r = searchCatalog(catalog, kw, { category: category || undefined, limit: 99999 });
    if (subcat) r = r.filter((b) => b.subcategories[0] === subcat);
    return r;
  }, [catalog, kw, category, subcat]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 导出当前筛选结果的书单（仅元数据 + 原文直链，零复制，符合架构）
  const handleExportBooklist = useCallback(() => {
    if (!catalog) return;
    const rows = filtered.map((b) => ({
      title: b.title,
      category: b.category,
      subcategories: b.subcategories,
      size: b.size,
      rawUrl: b.rawUrl,
      mirrors: b.mirrors,
    }));
    const name = category ? `古籍通_${category}_书单` : "古籍通_全馆藏_书单";
    exportBooklistCsv(rows, `${name}.csv`);
  }, [catalog, filtered, category]);

  if (error) return <div style={{ padding: 40, color: "#c00" }}>索引加载失败：{error}</div>;
  if (!catalog) return <div style={{ padding: 40 }}>正在加载 {BOOK_COUNT_LABEL} 部古籍书目索引...</div>;

  return (
    <section id="catalog-main">
      <div className="breadcrumb">
        <Link href="/">首页</Link><span className="sep">/</span><span>全馆藏</span>
      </div>

      <h2 style={{ marginBottom: 4 }}>全馆藏（{DATA_SOURCE}）</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, fontSize: 14 }}>
        共 <strong>{catalog.total.toLocaleString()}</strong> 部古籍
      </p>

      <div className="filter-panel">
        <input
          className="input-text"
          value={inputKw}
          onChange={(e) => setInputKw(e.target.value)}
          placeholder={SEARCH_PLACEHOLDER}
          style={{ maxWidth: 360 }}
        />
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          匹配 {filtered.length.toLocaleString()} 部
        </span>
        <button
          className="btn btn-secondary"
          style={{ fontSize: 13, padding: "6px 12px", marginLeft: "auto" }}
          onClick={handleExportBooklist}
          title="导出当前筛选书单（含书名/馆藏/子类/大小/原文直链）"
        >
          导出书单（含原文直链）
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button
          className={`tag ${!category ? "tag-active" : ""}`}
          onClick={() => { setCategory(""); setSubcat(""); }}
          style={{ cursor: "pointer" }}
        >
          全部 ({catalog.total})
        </button>
        {Object.entries(catalog.stats).map(([cat, count]) => (
          <button
            key={cat}
            className={`tag ${category === cat ? "tag-active" : ""}`}
            onClick={() => { setCategory(cat); setSubcat(""); }}
            style={{ cursor: "pointer" }}
          >
            {CATEGORY_ICONS[cat] || "📚"} {cat} ({count})
          </button>
        ))}
      </div>

      {subcategories.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          <button
            className={`tag ${!subcat ? "tag-active" : ""}`}
            onClick={() => setSubcat("")}
            style={{ cursor: "pointer", fontSize: 12 }}
          >全部子类</button>
          {subcategories.map((s) => (
            <button
              key={s}
              className={`tag ${subcat === s ? "tag-active" : ""}`}
              onClick={() => setSubcat(s)}
              style={{ cursor: "pointer", fontSize: 12 }}
            >{s}</button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {pageItems.map((b) => (
          <CatalogBookRow
            key={b.id}
            book={b}
            icon={CATEGORY_ICONS[b.category] || "📚"}
            bookmarked={bmSet.has(b.id)}
            onToggleBookmark={toggleBm}
          />
        ))}
      </div>

      {pageItems.length === 0 && (
        <EmptyState icon="🔍" title={EMPTY_RESULT_TITLE} description={EMPTY_RESULT_HINT} />
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24 }}>
          <button
            className="btn btn-secondary" disabled={page <= 1}
            onClick={() => setPage(page - 1)} style={{ fontSize: 13 }}
          >上一页</button>
          <span style={{ fontSize: 14 }}>第 {page} / {totalPages} 页</span>
          <button
            className="btn btn-secondary" disabled={page >= totalPages}
            onClick={() => setPage(page + 1)} style={{ fontSize: 13 }}
          >下一页</button>
        </div>
      )}
    </section>
  );
}
