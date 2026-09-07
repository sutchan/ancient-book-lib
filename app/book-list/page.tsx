import type { Metadata } from "next";
import Link from "next/link";
import data from "@/lib/data-generated";

export const metadata: Metadata = {
  title: "馆藏书籍｜古籍通 AncientBook",
  description: "古籍通全馆藏书籍列表：十大藏库 45+ 部典籍，按馆藏分类浏览。",
};

export default function BookListPage() {
  const byCat = data.categories.map((c) => ({
    cat: c,
    books: data.books.filter((b) => b.category === c.name),
  }));

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>馆藏书籍</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>馆藏书籍总览</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        十大馆藏共收录 {data.books.length} 部典籍、{data.books.reduce((s, b) => s + b.chapters.length, 0)} 个章节卷次
      </p>
      {byCat.map(({ cat, books }) => (
        <div key={cat.id} style={{ marginBottom: 32 }}>
          <h3 className="section-title">{cat.name}</h3>
          {books.map((b, i) => (
            <Link key={b.id} href={`/read/${encodeURIComponent(b.title)}`} className="book-item">
              <div className="book-index">{i + 1}</div>
              <div>
                <div className="book-title">{b.title}</div>
                <div className="book-meta">
                  {b.dynasty} · {b.author} · {b.chapters.length} 卷
                </div>
              </div>
            </Link>
          ))}
        </div>
      ))}
    </section>
  );
}
