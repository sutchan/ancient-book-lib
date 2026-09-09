// components/RecentBooks.tsx v1.4.3
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecentBook {
  id: string;
  title: string;
  category: string;
  time: number;
}

export default function RecentBooks() {
  const [books, setBooks] = useState<RecentBook[]>([]);

  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem("ab-recent") || "[]");
      setBooks(recent);
    } catch {
      setBooks([]);
    }
  }, []);

  if (books.length === 0) return null;

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${Math.floor(diff / 86400000)} 天前`;
  };

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 className="section-title">最近阅读</h2>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {books.map((b) => (
          <Link
            key={b.id}
            href={`/read/remote?id=${b.id}`}
            className="card"
            style={{ padding: "12px 14px", textDecoration: "none" }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{b.title}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {b.category} · {formatTime(b.time)}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
