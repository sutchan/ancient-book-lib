"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  loadCatalog,
  searchCatalog,
  getSubcategories,
  formatSize,
  type DaizhigeCatalog,
} from "@/lib/catalog";

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

  if (error) return <div style={{ padding: 40, color: "#c00" }}>索引加载失败：{error}</div>;
  if (!catalog) return <div style={{ padding: 40 }}>正在加载 15,694 部古籍书目索引...</div>;

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link><span className="sep">/</span><span>全馆藏书目</span>
      </div>

      <h2 style={{ marginBottom: 4 }}>全馆藏书目（殆知阁 v20）</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, fontSize: 14 }}>
        共 <strong>{catalog.total.toLocaleString()}</strong> 部古籍
      </p>

      <div className="filter-panel">
        <input
          className="input-text"
          value={inputKw}
          onChange={(e) => setInputKw(e.target.value)}
          placeholder="搜索书名（如：论语、金刚经、史记）"
          style={{ maxWidth: 360 }}
        />
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          匹配 {filtered.length.toLocaleString()} 部
        </span>
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
          <div
            key={b.id}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", border: "1px solid var(--color-border)",
              borderRadius: 6, background: "var(--color-card-bg)",
            }}
          >
            <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[b.category] || "📚"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/catalog/book?id=${b.id}`} style={{ fontWeight: 600, fontSize: 15, color: "inherit", textDecoration: "none" }}>
                {b.title}
              </Link>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                {b.category} › {b.subcategories.join(" › ") || "—"} · {formatSize(b.size)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Link
                href={`/catalog/book?id=${b.id}`}
                className="btn btn-secondary"
                style={{ fontSize: 13, padding: "6px 12px", whiteSpace: "nowrap" }}
              >详情</Link>
              <Link
                href={`/read/remote?id=${b.id}`}
                className="btn btn-primary"
                style={{ fontSize: 13, padding: "6px 14px", whiteSpace: "nowrap" }}
              >阅读</Link>
            </div>
          </div>
        ))}
      </div>

      {pageItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">未找到匹配古籍</div>
          <div>请尝试更换关键词或筛选条件</div>
        </div>
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
