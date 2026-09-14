// app/bookmarks/page.tsx v1.18.1
"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import Link from "next/link";
import { useBookmarks } from "@/lib/useBookmarks";
import {
  getBookmarks,
  importBookmarks,
  removeBookmark,
  clearBookmarks,
  updateBookmarkNote,
  type Bookmark,
} from "@/lib/bookmarks";
import { downloadText } from "@/lib/download";
import { loadCatalog, findBookById, type CatalogEntry } from "@/lib/catalog";
import BookmarksStats from "./BookmarksStats";
import BookmarkPreviewModal from "./BookmarkPreviewModal";

export default function BookmarksPage() {
  const bookmarks = useBookmarks();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");

  // 备注编辑状态
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

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

  const mostActiveCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "暂无";
  const recentBookmarks = [...bookmarks].sort((a, b) => b.time - a.time).slice(0, 5);

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
          note?: string;
        }[];
        if (!Array.isArray(incoming)) throw new Error("格式不正确");
        const count = importBookmarks(
          incoming
            .filter((b) => b && b.id)
            .map((b) => ({ id: b.id, title: b.title || "", category: b.category || "", note: b.note }))
        );
        setImportMsg(`已合并 ${count.length} 条书签（自动去重）`);
      } catch {
        setImportMsg("导入失败：文件格式不正确");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const startEditNote = (b: { id: string; note?: string }) => {
    setEditingNoteId(b.id);
    setNoteInput(b.note || "");
  };

  const saveNote = (id: string) => {
    updateBookmarkNote(id, noteInput);
    setEditingNoteId(null);
    setNoteInput("");
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

      {/* 统计区域与最近收藏 */}
      <BookmarksStats
        bookmarks={bookmarks}
        categoryCounts={categoryCounts}
        mostActiveCategory={mostActiveCategory}
        recentBookmarks={recentBookmarks}
        fmtTime={fmtTime}
      />

      {/* 分类筛选栏 */}
      {bookmarks.length > 0 && (
        <div id="category-filter-bar" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
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

      <div id="bookmark-actions-row" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
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
        <div id="import-msg-banner" className="empty-state" style={{ padding: 12, marginBottom: 16 }}>
          <div className="empty-title" style={{ fontSize: 14 }}>{importMsg}</div>
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div id="empty-bookmarks" className="empty-state">
          <div className="empty-icon">⭐</div>
          <div className="empty-title">还没有收藏任何书</div>
          <div>在全馆藏或书籍详情页点击「☆」即可加入书架；收藏后会显示在这里。</div>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div id="empty-filtered-bookmarks" className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">该分类下暂无收藏</div>
          <div>当前分类「{selectedCategory}」没有找到匹配的书签。</div>
        </div>
      ) : (
        <div id="bookmarks-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {filteredBookmarks.map((b) => (
            <div key={b.id} id={`bookmark-card-${b.id}`} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{b.title}</div>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: "2px 6px", flexShrink: 0 }}
                    onClick={() => startEditNote(b)}
                    title="编辑备注"
                  >
                    ✏️ 备注
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 10 }}>
                  {b.category} · {fmtTime(b.time)}
                </div>

                {/* 备注区域 */}
                {editingNoteId === b.id ? (
                  <div style={{ marginBottom: 12, display: "flex", gap: 6, flexDirection: "column" }}>
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="输入阅读心得或备忘..."
                      style={{
                        width: "100%",
                        padding: 8,
                        fontSize: 13,
                        borderRadius: 6,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg)",
                        color: "var(--color-text)",
                        resize: "vertical",
                        minHeight: 60,
                      }}
                    />
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 12, padding: "3px 8px" }}
                        onClick={() => setEditingNoteId(null)}
                      >
                        取消
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: "3px 8px" }}
                        onClick={() => saveNote(b.id)}
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : b.note ? (
                  <div
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      padding: "8px 10px",
                      fontSize: 13,
                      color: "var(--color-text)",
                      marginBottom: 12,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    <span style={{ color: "var(--color-primary)", fontWeight: 500, marginRight: 4 }}>备注：</span>
                    {b.note}
                  </div>
                ) : null}
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

      {/* 预览详情模态框组件 */}
      <BookmarkPreviewModal
        previewId={previewId}
        previewBook={previewBook}
        loadingPreview={loadingPreview}
        onClose={() => setPreviewId(null)}
      />
    </section>
  );
}
