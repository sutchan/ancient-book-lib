// app/bookmarks/page.tsx v1.15.1
"use client";
import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useBookmarks } from "@/lib/useBookmarks";
import {
  getBookmarks,
  importBookmarks,
  removeBookmark,
  clearBookmarks,
} from "@/lib/bookmarks";
import { downloadText } from "@/lib/download";

export default function BookmarksPage() {
  const bookmarks = useBookmarks();
  const [importMsg, setImportMsg] = useState<string | null>(null);

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
        收藏保存在本机浏览器，跨会话保留，不与服务器同步。
      </p>

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
      ) : (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {bookmarks.map((b) => (
            <div key={b.id} className="card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{b.title}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 10 }}>
                {b.category} · {fmtTime(b.time)}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Link href={`/read/remote?id=${b.id}`} className="btn btn-primary" style={{ fontSize: 13, padding: "5px 12px" }}>
                  阅读
                </Link>
                <Link href={`/catalog/book?id=${b.id}`} className="btn btn-secondary" style={{ fontSize: 13, padding: "5px 12px" }}>
                  详情
                </Link>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 13, padding: "5px 12px" }}
                  onClick={() => removeBookmark(b.id)}
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
