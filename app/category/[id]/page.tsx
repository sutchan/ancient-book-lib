import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import data from "@/lib/data-generated";

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return data.categories.map((c) => ({ id: c.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = data.categories.find((c) => c.id === params.id);
  return {
    title: `${cat?.name ?? "馆藏"}｜古籍通 AncientBook`,
    description: cat?.desc,
  };
}

export default function CategoryPage({ params }: Props) {
  const cat = data.categories.find((c) => c.id === params.id);
  if (!cat) notFound();
  const books = data.books.filter((b) => b.category === cat.name);

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>{cat.name}</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>{cat.name}</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        {cat.desc} · 共收录 {books.length} 部典籍
      </p>
      {books.map((b, i) => (
        <Link key={b.id} href={`/book/${b.id}`} className="book-item">
          <div className="book-index">{i + 1}</div>
          <div>
            <div className="book-title">{b.title}</div>
            <div className="book-meta">
              {b.dynasty} · {b.author} · {b.chapters.length} 卷
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}
