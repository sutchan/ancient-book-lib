"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadCatalog, searchCatalog, formatSize, type CatalogEntry } from "@/lib/catalog";

const CATEGORY_ICONS: Record<string, string> = {
  佛藏: "🏛", 儒藏: "📜", 医藏: "⚕", 史藏: "📚", 子藏: "💭",
  易藏: "🔮", 艺藏: "🎨", 诗藏: "🖋", 道藏: "☯", 集藏: "📖",
};

/** 检索页：全馆藏书目匹配（15,694 部书名级检索） */
export default function CatalogSearchResults() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState<CatalogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); setTotal(0); setReady(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const catalog = await loadCatalog();
        if (cancelled) return;
        const all = searchCatalog(catalog, q, { limit: 99999 });
        setTotal(all.length);
        setResults(all.slice(0, 8));
      } catch { /* ignore */ } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [q]);

  if (!ready || !q.trim() || total === 0) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ marginBottom: 12, fontSize: 17 }}>
        📚 全馆藏书目匹配（{total.toLocaleString()} 部，来自殆知阁 v20）
        <Link
          href={`/catalog?q=${encodeURIComponent(q)}`}
          style={{ fontSize: 13, marginLeft: 12, color: "var(--color-primary)" }}
        >查看全部 →</Link>
      </h3>
      <div style={{ display: "grid", gap: 6 }}>
        {results.map((b) => (
          <div
            key={b.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", border: "1px solid var(--color-border)",
              borderRadius: 6, background: "var(--color-card-bg)",
            }}
          >
            <span>{CATEGORY_ICONS[b.category] || "📚"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                {b.category} › {b.subcategories.join(" › ")} · {formatSize(b.size)}
              </div>
            </div>
            <Link
              href={`/read/remote?id=${b.id}`}
              className="btn btn-primary"
              style={{ fontSize: 12, padding: "4px 10px" }}
            >阅读</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
