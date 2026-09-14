// app/bookmarks/page.tsx v1.17.0
"use client";
import { useState, useEffect, type ChangeEvent } from "react";
import Link from "next/link";
import { useBookmarks } from "@/lib/useBookmarks";
import {
  getBookmarks,
  importBookmarks,
  removeBookmark,
  clearBookmarks,
} from "@/lib/bookmarks";
import { downloadText } from "@/lib/download";
import { loadCatalog, findBookById, formatSize, type CatalogEntry } from "@/lib/catalog";
import { DATA_SOURCE } from "@/lib/constants";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CHART_COLORS = ["#8C3130", "#CEA76A", "#704030", "#B89A68", "#4A6B5D", "#5A6152", "#9E6B55", "#C9605E"];

export default function BookmarksPage() {
  const bookmarks = useBookmarks();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");

  // 预览模态框状态
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewBook, setPreviewBook] = useState<CatalogEntry | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!previewId) {
      setPreviewBook(null);
      return;
    }
    setLoadingPreview(true);
    loadCatalog()
      .then((cat) => {
        const found = findBookById(cat, previewId);
        if (found) {
          setPreviewBook(found);
        } else {
          const bm = bookmarks.find((x) => x.id === previewId);
          setPreviewBook({
            id: previewId,
            title: bm?.title || previewId,
            category: bm?.category || "未分类",
            subcategories: [],
            path: "",
            size: 0,
            rawUrl: "",
            mirrors: [],
          } as CatalogEntry);
        }
      })
      .catch(() => {
        const bm = bookmarks.find((x) => x.id === previewId);
        setPreviewBook({
          id: previewId,
          title: bm?.title || previewId,
          category: bm?.category || "未分类",
          subcategories: [],
          path: "",
          size: 0,
          rawUrl: "",
          mirrors: [],
        } as CatalogEntry);
      })
      .finally(() => {
        setLoadingPreview(false);
      });
  }, [previewId, bookmarks]);

  // 计算统计数据
  const categoryCounts = bookmarks.reduce((acc, b) => {
    const cat = b.category || "未分类";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
  const mostActiveCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "暂无";

  const filteredBookmarks = selectedCategory === "全部"
    ? bookmarks
    : bookmarks.filter((b) => (b.category || "未分类") === selectedCategory);

  const fmtTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${Math.floor(diff / 86400000)} 天前`;
  };

  const handleClear = () => {
    if (typeof window !== "undefined" && window.confirm("确定清空全部书签？此操作不可撤销。")) {
      clearBookmarks();
    }
  };

  const handleExport = () => {
    const data = {
      app: "ancient-book-lib",
      type: "bookmarks",
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks: getBookmarks(),
    };
    downloadText("古籍通_书签.json", JSON.stringify(data, null, 2));
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming = (Array.isArray(parsed) ? parsed : parsed.bookmarks) as {
          id: string;
          title?: string;
          category?: string;
        }[];
        if (!Array.isArray(incoming)) throw new Error("格式不正确");
        const count = importBookmarks(
          incoming
            .filter((b) => b && b.id)
            .map((b) => ({ id: b.id, title: b.title || "", category: b.category || "" }))
        );
        setImportMsg(`已合并 ${count.length} 条书签（自动去重）`);
      } catch {
        setImportMsg("导入失败：文件格式不正确");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <section id="bookmarks-main">
      <div className="breadcrumb">
        <Link href="/">首页</Link><span className="sep">/</span><span>我的书架</span>
      </div>
      <h2 style={{ marginBottom: 4 }}>我的书架</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 16, fontSize: 14 }}>
        收藏仅保存在本机浏览器，不跨设备同步。
      </p>

      {/* 统计区域 */}
      {bookmarks.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--color-text)" }}>书架数据概览</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "var(--color-text-secondary)" }}>
              <div>收藏总数：<strong style={{ color: "var(--color-primary)", fontSize: 16 }}>{bookmarks.length}</strong> 部</div>
              <div>涉及分类数：<strong style={{ color: "var(--color-text)" }}>{Object.keys(categoryCounts).length}</strong> 个</div>
              <div>最活跃类别：<strong style={{ color: "var(--color-primary)" }}>{mostActiveCategory}</strong></div>
            </div>
          </div>
          <div style={{ height: 180, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={30}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 分类筛选栏 */}
      {bookmarks.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>分类筛选：</span>
          <button
            onClick={() => setSelectedCategory("全部")}
            className={`btn ${selectedCategory === "全部" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 13, padding: "5px 12px", borderRadius: 16 }}
          >
            全部 ({bookmarks.length})
          </button>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn ${selectedCategory === cat ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: 13, padding: "5px 12px", borderRadius: 16 }}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button className="btn btn-secondary" style={{ fontSize: 13, padding: "6px 12px" }} onClick={handleExport}>
          导出书签 JSON
        </button>
        <label className="btn btn-secondary" style={{ fontSize: 13, padding: "6px 12px", cursor: "pointer" }}>
          导入书签 JSON
          <input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={handleImport} />
        </label>
        <button
          className="btn btn-secondary"
          style={{ fontSize: 13, padding: "6px 12px" }}
          onClick={handleClear}
          disabled={bookmarks.length === 0}
        >
          清空
        </button>
      </div>

      {importMsg && (
        <div className="empty-state" style={{ padding: 12, marginBottom: 16 }}>
          <div className="empty-title" style={{ fontSize: 14 }}>{importMsg}</div>
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <div className="empty-title">还没有收藏任何书</div>
          <div>在全馆藏或书籍详情页点击「☆」即可加入书架；收藏后会显示在这里。</div>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">该分类下暂无收藏</div>
          <div>当前分类「{selectedCategory}」没有找到匹配的书签。</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {filteredBookmarks.map((b) => (
            <div key={b.id} className="card" style={{ padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 10 }}>
                  {b.category} · {fmtTime(b.time)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                <Link href={`/read/remote?id=${b.id}`} className="btn btn-primary" style={{ fontSize: 13, padding: "5px 10px" }}>
                  阅读
                </Link>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 13, padding: "5px 10px" }}
                  onClick={() => setPreviewId(b.id)}
                >
                  预览详情
                </button>
                <Link href={`/catalog/book?id=${b.id}`} className="btn btn-secondary" style={{ fontSize: 13, padding: "5px 10px" }}>
                  详情页
                </Link>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 13, padding: "5px 10px" }}
                  onClick={() => removeBookmark(b.id)}
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 预览详情模态框 */}
      {previewId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setPreviewId(null)}
        >
          <div
            style={{
              background: "var(--color-card-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              maxWidth: 580,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {loadingPreview ? "加载中..." : previewBook?.title || previewId}
              </h3>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 14, padding: "2px 8px", borderRadius: 4 }}
                onClick={() => setPreviewId(null)}
              >
                ✕
              </button>
            </div>

            {loadingPreview ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>
                正在获取该书馆藏元数据…
              </div>
            ) : previewBook ? (
              <div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  <span className="tag">{previewBook.category}</span>
                  {previewBook.subcategories?.map((s, i) => (
                    <span key={i} className="tag">{s}</span>
                  ))}
                  {previewBook.size > 0 && <span className="tag">{formatSize(previewBook.size)}</span>}
                </div>

                <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--color-text)", marginBottom: 20 }}>
                  <p style={{ marginBottom: 10 }}>
                    <strong>数据来源：</strong>{DATA_SOURCE} 全量古籍书目。原文支持在线保真阅读、按需加载与离线缓存。
                  </p>
                  <p style={{ marginBottom: 10 }}>
                    <strong>标识 ID：</strong><code>{previewBook.id}</code>
                  </p>
                  {previewBook.rawUrl && (
                    <p style={{ wordBreak: "break-all", fontSize: 13, color: "var(--color-text-secondary)" }}>
                      <strong>上游原文链接：</strong>
                      <a href={previewBook.rawUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", marginLeft: 4 }}>
                        {previewBook.rawUrl}
                      </a>
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
                  <Link
                    href={`/read/remote?id=${previewBook.id}`}
                    className="btn btn-primary"
                    onClick={() => setPreviewId(null)}
                  >
                    开始阅读
                  </Link>
                  <Link
                    href={`/catalog/book?id=${previewBook.id}`}
                    className="btn btn-secondary"
                    onClick={() => setPreviewId(null)}
                  >
                    前往完整详情页
                  </Link>
                  {previewBook.rawUrl && (
                    <a
                      href={previewBook.rawUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      访问上游原文
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: 30, textAlign: "center", color: "var(--color-text-secondary)" }}>
                未找到该书的馆藏元数据。
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

