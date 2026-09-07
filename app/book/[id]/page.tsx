import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import data from "@/lib/data-generated";
import { toSimplified } from "@/lib/t2s";
import BookActions from "@/components/BookActions";

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return data.books.map((b) => ({ id: b.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const book = data.books.find((b) => b.id === params.id);
  return {
    title: `${book?.title ?? "书籍"}｜古籍通 AncientBook`,
    description: book?.desc,
  };
}

export default function BookDetailPage({ params }: Props) {
  const book = data.books.find((b) => b.id === params.id);
  if (!book) notFound();
  const cat = data.categories.find((c) => c.name === book.category);

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <Link href={`/category/${cat?.id ?? ""}`}>{toSimplified(book.category)}</Link>
        <span className="sep">/</span>
        <span>{toSimplified(book.title)}</span>
      </div>

      <div className="book-detail">
        <h2 className="book-detail-title">{toSimplified(book.title)}</h2>
        <div className="book-detail-meta">
          <span className="tag">{toSimplified(book.category)}</span>
          <span className="tag">{toSimplified(book.dynasty)}</span>
          <span className="tag">{toSimplified(book.author)}</span>
          <span className="tag">{book.chapters.length} 卷</span>
        </div>
        <p className="book-detail-desc">{toSimplified(book.desc)}</p>

        <BookActions book={book} />
      </div>

      <h3 className="section-title">章节目录（{book.chapters.length} 卷）</h3>
      <div className="chapter-list">
        {book.chapters.map((c, i) => (
          <Link key={i} href={`/read/${book.title}`} className="chapter-item">
            <span className="chapter-index">{i + 1}</span>
            <span>{toSimplified(c)}</span>
            <span className="chapter-arrow">›</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
