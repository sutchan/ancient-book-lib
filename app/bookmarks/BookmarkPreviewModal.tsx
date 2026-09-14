// app/bookmarks/BookmarkPreviewModal.tsx v1.18.1
"use client";

import Link from "next/link";
import { formatSize, type CatalogEntry } from "@/lib/catalog";
import { DATA_SOURCE } from "@/lib/constants";

interface BookmarkPreviewModalProps {
  previewId: string | null;
  previewBook: CatalogEntry | null;
  loadingPreview: boolean;
  onClose: () => void;
}

export default function BookmarkPreviewModal({
  previewId,
  previewBook,
  loadingPreview,
  onClose,
}: BookmarkPreviewModalProps) {
  if (!previewId) return null;

  return (
    <div
      id="bookmark-preview-modal-overlay"
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
      onClick={onClose}
    >
      <div
        id="bookmark-preview-modal-card"
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
            id="bookmark-preview-close-btn"
            className="btn btn-secondary"
            style={{ fontSize: 14, padding: "2px 8px", borderRadius: 4 }}
            onClick={onClose}
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
                onClick={onClose}
              >
                开始阅读
              </Link>
              <Link
                href={`/catalog/book?id=${previewBook.id}`}
                className="btn btn-secondary"
                onClick={onClose}
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
  );
}
