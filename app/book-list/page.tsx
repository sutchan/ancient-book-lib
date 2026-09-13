// app/book-list/page.tsx v1.15.1
import Link from "next/link";

export default function BookListPage() {
  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>全馆藏</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>馆藏书籍</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        全部典籍已合并至「全馆藏」书目页：
      </p>
      <Link href="/catalog" className="btn btn-primary">
        前往全馆藏书目
      </Link>
    </section>
  );
}
