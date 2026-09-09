// components/ReaderToc.tsx v1.4.3
"use client";

interface ReaderTocProps {
  items: { title: string }[];
  current: number;
  onSelect: (idx: number) => void;
  disabled?: boolean;
}

/** 章节导航：上一章 / 下拉选择 / 下一章 */
export default function ReaderToc({ items, current, onSelect, disabled }: ReaderTocProps) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <button
        className="btn btn-secondary"
        disabled={disabled || current === 0}
        onClick={() => onSelect(current - 1)}
        style={{ fontSize: 13 }}
      >
        ← 上一章
      </button>
      <select
        value={current}
        disabled={disabled}
        onChange={(e) => onSelect(+e.target.value)}
        style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--color-border)", fontSize: 13 }}
      >
        {items.map((c, i) => (
          <option key={i} value={i}>
            第 {i + 1} 章 · {c.title}
          </option>
        ))}
      </select>
      <button
        className="btn btn-secondary"
        disabled={disabled || current >= items.length - 1}
        onClick={() => onSelect(current + 1)}
        style={{ fontSize: 13 }}
      >
        下一章 →
      </button>
    </div>
  );
}
