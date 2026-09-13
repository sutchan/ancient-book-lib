// components/ReaderSearchBar.tsx v1.15.0
"use client";
import { type ReaderMatch, splitHighlight } from "@/lib/readerSearch";

interface Props {
  query: string;
  onQuery: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  matches: ReaderMatch[];
  onJump: (m: ReaderMatch) => void;
  labelOf: (m: ReaderMatch) => string;
  submitted: boolean;
}

/** 阅读器页内搜索面板：输入 + 命中列表（可跳转到命中处） */
export default function ReaderSearchBar({
  query,
  onQuery,
  onSubmit,
  onClose,
  matches,
  onJump,
  labelOf,
  submitted,
}: Props) {
  return (
    <div className="card" id="reader-search-panel" style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          className="input-text"
          id="reader-search-input"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
          placeholder="在本书中查找……"
          aria-label="页内搜索关键词"
          style={{ flex: 1, minWidth: 180 }}
        />
        <button className="btn btn-primary" id="reader-search-submit" onClick={onSubmit} style={{ fontSize: 13, padding: "6px 14px" }}>
          查找
        </button>
        <button className="btn btn-secondary" id="reader-search-close" onClick={onClose} style={{ fontSize: 13, padding: "6px 12px" }}>
          关闭
        </button>
      </div>

      {submitted && (
        <div id="reader-search-results" style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>
            {matches.length > 0 ? `命中 ${matches.length} 处` : "未找到匹配内容"}
          </div>
          {matches.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
              {matches.map((m, i) => (
                <li key={`${m.chapterIdx}-${m.paraIdx}-${i}`}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onJump(m)}
                    style={{ width: "100%", textAlign: "left", padding: "6px 10px", fontSize: 13, lineHeight: 1.7 }}
                  >
                    <span style={{ color: "var(--color-primary)" }}>
                      {labelOf(m)} · 第 {m.pageIdx + 1} 页
                    </span>
                    <span style={{ display: "block", color: "var(--color-text-secondary)", marginTop: 2 }}>
                      {splitHighlight(m.snippet, query).map((s, k) =>
                        s.hit ? <mark key={k}>{s.text}</mark> : <span key={k}>{s.text}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
