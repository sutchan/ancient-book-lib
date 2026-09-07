import type { Metadata } from "next";
import Link from "next/link";
import data from "@/lib/data-generated";

export const metadata: Metadata = {
  title: "十大藏库｜古籍通 AncientBook",
  description: "古籍通十大馆藏总览：佛藏、儒藏、医藏、史藏、子藏、易藏、艺藏、诗藏、道藏、集藏。",
};

export default function CategoryIndexPage() {
  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>十大藏库</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>十大藏库</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        按经史子集与专门之学分设十大馆藏，共收录 {data.books.length} 部核心典籍
      </p>
      <div className="category-grid">
        {data.categories.map((c) => {
          const count = data.books.filter((b) => b.category === c.name).length;
          return (
            <Link key={c.id} href={`/category/${c.id}`} className="card category-card">
              <div className="cat-icon">{c.icon}</div>
              <div className="cat-name">{c.name}</div>
              <div className="cat-desc">{c.desc}</div>
              <div className="cat-count">{count} 部</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
