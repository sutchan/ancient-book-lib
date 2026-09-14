// app/category/page.tsx v1.15.8
import Link from "next/link";

export default function CategoryIndexPage() {
  return (
    <section id="category-main">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>全馆藏</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>全馆藏浏览</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        馆藏总览已合并至「全馆藏」书目页：
      </p>
      <Link href="/catalog" className="btn btn-primary">
        前往全馆藏
      </Link>
    </section>
  );
}
