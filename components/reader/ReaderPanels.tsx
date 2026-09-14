// components/reader/ReaderPanels.tsx v1.15.8
"use client";

/** 阅读器展示层：加载 / 大文件警告 / 错误 / toast / 位置书签面板 / 头部 / 操作按钮行 */
import Link from "next/link";
import { formatSize, type CatalogEntry } from "@/lib/catalog";
import { safeHttpUrl } from "./constants";
import type { ReadPosBookmark } from "@/lib/bookmarks";

export function ReaderLoading({ fromCache, progress }: { fromCache: boolean; progress: number }) {
  return (
    <div style={{ padding: 60, textAlign: "center" }} id="reader-loading">
      <div style={{ fontSize: 16, marginBottom: 16 }}>
        {fromCache ? "从本地书箧取书…" : "正在向殆知阁取卷…"}
      </div>
      {!fromCache && progress > 0 && (
        <div style={{ maxWidth: 400, margin: "0 auto" }}>
          <div style={{ background: "var(--color-border,#eee)", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ background: "var(--color-primary,#8C3130)", height: "100%", width: `${progress}%`, transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 8 }}>{progress}%</div>
        </div>
      )}
    </div>
  );
}

export function ReaderLargeWarning({ book, onConfirm }: { book: CatalogEntry; onConfirm: () => void }) {
  return (
    <div style={{ padding: 40, maxWidth: 560, margin: "0 auto" }} id="reader-large-warning">
      <div className="card" style={{ padding: 24, border: "2px solid #faad14" }}>
        <h3 style={{ marginBottom: 12, color: "#d48806" }}>⚠️ 大文件提示</h3>
        <p style={{ marginBottom: 8 }}>
          <strong>{book.title}</strong> 原文约 <strong>{formatSize(book.size)}</strong>，加载可能需要较长时间。
        </p>
        <p style={{ marginBottom: 16, fontSize: 14, color: "var(--color-text-secondary)" }}>
          建议在 Wi-Fi 下阅读；加载后自动缓存本地，下次免重下。
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={onConfirm}>仍然在线阅读</button>
          {safeHttpUrl(book.rawUrl) ? (
            <a className="btn btn-secondary" href={safeHttpUrl(book.rawUrl)!} target="_blank" rel="noopener">打开原文（可另存为）</a>
          ) : (
            <span className="btn btn-secondary" style={{ opacity: 0.6 }}>原文链接不可用</span>
          )}
          <Link href="/catalog" className="btn btn-secondary">返回书目</Link>
        </div>
      </div>
    </div>
  );
}

export function ReaderError({
  error,
  book,
  onRetry,
}: {
  error: string;
  book: CatalogEntry | null;
  onRetry: () => void;
}) {
  return (
    <div style={{ padding: 40 }} id="reader-error">
      <h3>加载失败</h3>
      <p style={{ color: "#c00" }}>{error}</p>
      {book && (
        <p style={{ marginTop: 8 }}>
          {safeHttpUrl(book.rawUrl) ? (
            <>可直接访问上游原文：<a href={safeHttpUrl(book.rawUrl)!} target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>{book.rawUrl}</a></>
          ) : (
            <span>上游原文链接不可用，请返回书目重试。</span>
          )}
        </p>
      )}
      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button className="btn btn-primary" onClick={onRetry}>重试</button>
        <Link href="/catalog" className="btn btn-secondary">返回书目</Link>
      </div>
    </div>
  );
}

export function ReaderToast({ message }: { message: string }) {
  return (
    <div
      id="reader-toast"
      style={{ position: "fixed", left: "50%", bottom: 40, transform: "translateX(-50%)", background: "var(--color-primary,#8C3130)", color: "#fff", padding: "8px 16px", borderRadius: 6, fontSize: 13, zIndex: 100 }}
    >
      {message}
    </div>
  );
}

export function ReadPosPanel({
  list,
  onGoto,
  onDelete,
  onClose,
}: {
  list: ReadPosBookmark[];
  onGoto: (p: ReadPosBookmark) => void;
  onDelete: (createdAt: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="card" style={{ padding: 14, marginBottom: 12 }} id="read-pos-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>阅读位置书签</strong>
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: "2px 8px" }} onClick={onClose}>收起</button>
      </div>
      {list.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>暂无保存的阅读位置，点击「保存当前位置」记录本章页码。</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {list.map((p) => (
            <li key={p.createdAt} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
              <button className="btn btn-primary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onGoto(p)}>跳转</button>
              <span style={{ flex: 1 }}>{p.label}</span>
              <button className="btn btn-secondary" style={{ fontSize: 12, padding: "2px 8px" }} onClick={() => onDelete(p.createdAt)}>删除</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReaderHeader({
  book,
  chapterCount,
  usingManifest,
}: {
  book: CatalogEntry;
  chapterCount: number;
  usingManifest: boolean;
}) {
  return (
    <>
      <div className="reader-title" id="reader-title">{book.title}</div>
      <div className="reader-sub" id="reader-meta">
        {book.category} › {book.subcategories.join(" › ")} · {formatSize(book.size)} · {chapterCount} 章
        {usingManifest && <span style={{ color: "var(--color-primary)" }}> · 分片懒加载</span>}
        · {safeHttpUrl(book.rawUrl) ? (
          <a href={safeHttpUrl(book.rawUrl)!} target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>上游原文</a>
        ) : (
          <span>上游原文链接不可用</span>
        )}
      </div>
    </>
  );
}

export function ReaderActionRow({
  bookmarked,
  onToggleBookmark,
  onSavePos,
  onTogglePos,
  posCount,
  onToggleSearch,
}: {
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onSavePos: () => void;
  onTogglePos: () => void;
  posCount: number;
  onToggleSearch: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }} id="reader-actions">
      <button className="btn btn-secondary" id="reader-bookmark-toggle" onClick={onToggleBookmark} aria-pressed={bookmarked} style={{ fontSize: 13, padding: "6px 12px" }}>
        {bookmarked ? "★ 已收藏" : "☆ 收藏"}
      </button>
      <button className="btn btn-secondary" id="reader-save-pos" onClick={onSavePos} style={{ fontSize: 13, padding: "6px 12px" }}>
        保存当前位置
      </button>
      <button className="btn btn-secondary" id="reader-pos-toggle" onClick={onTogglePos} style={{ fontSize: 13, padding: "6px 12px" }}>
        阅读书签{posCount > 0 ? ` (${posCount})` : ""}
      </button>
      <button className="btn btn-secondary" id="reader-search-toggle" onClick={onToggleSearch} style={{ fontSize: 13, padding: "6px 12px" }}>
        页内搜索
      </button>
    </div>
  );
}
