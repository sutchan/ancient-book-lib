// components/reader/ReaderBody.tsx v1.15.8
"use client";

/** 阅读器展示层：进度条（可拖拽跳章）、正文（移动端滑动翻页）与分页 */
import type { ReactNode } from "react";

export function ReaderProgressBar({
  total,
  current,
  onSeek,
}: {
  total: number;
  current: number;
  onSeek: (idx: number) => void;
}) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }} id="reader-progress">
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>
        <span>阅读进度</span>
        <span>{total > 0 ? Math.round(pct) : 0}%</span>
      </div>
      <div style={{ background: "var(--color-border,#eee)", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ background: "var(--color-primary,#8C3130)", height: "100%", width: `${pct}%`, transition: "width 0.3s" }} />
      </div>
      {total > 1 && (
        <input
          type="range"
          id="reader-progress-slider"
          className="reader-progress-slider"
          min={0}
          max={total - 1}
          value={current}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          aria-label="拖拽跳转章节"
        />
      )}
    </div>
  );
}

export function ReaderBodyText({
  title,
  paragraphs,
  renderText,
  fontSize,
  lineHeight,
  onTouchStart,
  onTouchEnd,
}: {
  title: string;
  paragraphs: string[];
  renderText: (text: string) => ReactNode;
  fontSize: number;
  lineHeight: number;
  onTouchStart: (x: number) => void;
  onTouchEnd: (endX: number) => void;
}) {
  return (
    <div
      className="reader-body"
      id="reader-body"
      style={{ fontSize, lineHeight, userSelect: "text" }}
      onTouchStart={(e) => onTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}
    >
      <h3 style={{ textAlign: "center", marginBottom: 20, fontSize: 18 }}>{title}</h3>
      {paragraphs.map((p, i) => (
        <p key={i}>{renderText(p)}</p>
      ))}
    </div>
  );
}

export function ReaderPagination({
  pageIdx,
  totalPages,
  onPage,
}: {
  pageIdx: number;
  totalPages: number;
  onPage: (delta: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 32 }} id="reader-pagination">
      <button className="btn btn-secondary" disabled={pageIdx === 0} onClick={() => onPage(-1)} style={{ fontSize: 13 }}>上一页</button>
      <span style={{ fontSize: 14 }}>第 {pageIdx + 1} / {totalPages} 页</span>
      <button className="btn btn-secondary" disabled={pageIdx >= totalPages - 1} onClick={() => onPage(1)} style={{ fontSize: 13 }}>下一页</button>
    </div>
  );
}
