// app/catalog/CatalogBookRow.tsx v1.15.8 —— 全馆藏书目列表单行（从 CatalogInner 拆出）
import Link from "next/link";
import { formatSize } from "@/lib/catalog";

interface CatalogBookRowProps {
  book: { id: string; title: string; category: string; subcategories: string[]; size: number };
  icon: string;
  bookmarked: boolean;
  onToggleBookmark: (b: CatalogBookRowProps["book"]) => void;
}

/** 全馆藏单本书目行：书名、馆藏路径、大小、书签开关与详情/阅读入口 */
export default function CatalogBookRow({ book, icon, bookmarked, onToggleBookmark }: CatalogBookRowProps) {
  return (
    <div
      key={book.id}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px", border: "1px solid var(--color-border)",
        borderRadius: 6, background: "var(--color-card-bg)",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/catalog/book?id=${book.id}`} style={{ fontWeight: 600, fontSize: 15, color: "inherit", textDecoration: "none" }}>
          {book.title}
        </Link>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
          {book.category} › {book.subcategories.join(" › ") || "—"} · {formatSize(book.size)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          className="btn btn-secondary"
          id={`bookmark-toggle-${book.id}`}
          aria-label={bookmarked ? "移除书签" : "加入书签"}
          title={bookmarked ? "移除书签" : "加入书签"}
          onClick={() => onToggleBookmark(book)}
          style={{ fontSize: 16, padding: "6px 10px", lineHeight: 1 }}
        >
          {bookmarked ? "★" : "☆"}
        </button>
        <Link
          href={`/catalog/book?id=${book.id}`}
          className="btn btn-secondary"
          style={{ fontSize: 13, padding: "6px 12px", whiteSpace: "nowrap" }}
        >详情</Link>
        <Link
          href={`/read/remote?id=${book.id}`}
          className="btn btn-primary"
          style={{ fontSize: 13, padding: "6px 14px", whiteSpace: "nowrap" }}
        >阅读</Link>
      </div>
    </div>
  );
}
