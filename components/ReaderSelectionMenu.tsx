// components/ReaderSelectionMenu.tsx v1.15.0
"use client";

export interface Selection {
  text: string;
  x: number;
  y: number;
}

interface Props {
  sel: Selection;
  onSearch: (text: string) => void;
  onCite: (text: string) => void;
}

/** 划词浮层：一键检索 / 复制引用 */
export default function ReaderSelectionMenu({ sel, onSearch, onCite }: Props) {
  return (
    <div
      id="reader-selection-menu"
      style={{ position: "absolute", left: sel.x, top: sel.y, transform: "translateX(-50%)", zIndex: 50, display: "flex", gap: 6 }}
    >
      <button
        className="btn btn-primary"
        style={{ fontSize: 12, padding: "4px 10px" }}
        onClick={() => onSearch(sel.text)}
      >
        检索「{sel.text}」
      </button>
      <button
        className="btn btn-secondary"
        id="reader-cite-copy"
        style={{ fontSize: 12, padding: "4px 10px" }}
        onClick={() => onCite(sel.text)}
      >
        复制引用
      </button>
    </div>
  );
}
