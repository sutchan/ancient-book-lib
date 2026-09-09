// components/ReaderToolbar.tsx v1.4.3
"use client";

interface ReaderToolbarProps {
  fontSize: number;
  lineHeight: number;
  simple: boolean;
  onFontDec: () => void;
  onFontInc: () => void;
  onLineDec: () => void;
  onLineInc: () => void;
  onToggleSimple: (v: boolean) => void;
  onDownload: () => void;
}

/** 阅读页工具栏：字号 / 行距 / 简体对照 / 下载本书 */
export default function ReaderToolbar({
  fontSize,
  lineHeight,
  simple,
  onFontDec,
  onFontInc,
  onLineDec,
  onLineInc,
  onToggleSimple,
  onDownload,
}: ReaderToolbarProps) {
  return (
    <div className="reader-toolbar">
      <div className="ctrl">
        <span>字号</span>
        <button onClick={onFontDec}>A-</button>
        <button onClick={onFontInc}>A+</button>
      </div>
      <div className="ctrl">
        <span>行距</span>
        <button onClick={onLineDec}>－</button>
        <button onClick={onLineInc}>＋</button>
      </div>
      <label className="ctrl" style={{ cursor: "pointer" }}>
        <input type="checkbox" checked={simple} onChange={(e) => onToggleSimple(e.target.checked)} style={{ marginRight: 4 }} />
        简体对照
      </label>
      <button className="btn btn-secondary" style={{ fontSize: 13, padding: "5px 12px" }} onClick={onDownload}>
        下载本书
      </button>
    </div>
  );
}
