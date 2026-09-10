"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { searchPersons } from "@/lib/cbdb";

export default function PeopleSearchResults({ query }: { query: string }) {
  const [people, setPeople] = useState<{ id: number; name: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setPeople(null);
      return;
    }
    let cancelled = false;
    searchPersons(query.trim(), 8)
      .then((r) => !cancelled && setPeople(r))
      .catch((e) => !cancelled && setError(String(e?.message || e)));
    return () => { cancelled = true; };
  }, [query]);

  if (error) return null; // 人物匹配失败不影响主检索结果
  if (!people || people.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 20, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ fontSize: 16, margin: 0 }}>人物匹配（CBDB）</h3>
        <Link href={`/people?q=${encodeURIComponent(query)}`} style={{ fontSize: 13, color: "var(--color-primary)" }}>
          查看全部 →
        </Link>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {people.map((p) => (
          <Link
            key={p.id}
            href={`/people/detail?id=${p.id}`}
            className="tag"
            style={{ textDecoration: "none", padding: "6px 12px", fontSize: 14 }}
          >
            {p.name}
          </Link>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 10 }}>
        数据来源：CBDB 中国历代人物传记资料库（661,350 人）
      </div>
    </div>
  );
}
