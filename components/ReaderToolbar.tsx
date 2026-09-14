// components/ReaderToolbar.tsx v1.16.0
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
  isSpeaking: boolean;
  isPaused: boolean;
  onToggleSpeech: () => void;
  onStopSpeech: () => void;
}

/** 阅读页工具栏：字号 / 行距 / 简体对照 / 语音朗读 / 下载本书 */
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
  isSpeaking,
  isPaused,
  onToggleSpeech,
  onStopSpeech,
}: ReaderToolbarProps) {
  return (
    <div className="reader-toolbar" id="reader-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
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
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button
          className={`btn ${isSpeaking ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: 13, padding: "5px 12px" }}
          onClick={onToggleSpeech}
        >
          {isSpeaking ? (isPaused ? "▶ 继续" : "⏸ 暂停") : "🔊 语音朗读"}
        </button>
        {isSpeaking && (
          <button
            className="btn btn-secondary"
            style={{ fontSize: 13, padding: "5px 10px" }}
            onClick={onStopSpeech}
          >
            停止
          </button>
        )}
      </div>
      <button className="btn btn-secondary" style={{ fontSize: 13, padding: "5px 12px" }} onClick={onDownload}>
        下载本书
      </button>
    </div>
  );
}
