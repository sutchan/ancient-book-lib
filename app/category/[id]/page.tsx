import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ id: c.id }));
}

export default function CategoryPage({ params }: Props) {
  const cat = CATEGORIES.find((c) => c.id === params.id);
  const href = cat ? `/catalog?category=${encodeURIComponent(cat.name)}` : "/catalog";
  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>全馆藏</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>馆藏分类{cat ? `：${cat.name}` : ""}</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        该分类已合并至「全馆藏」书目页，可按馆藏筛选浏览：
      </p>
      <Link href={href} className="btn btn-primary">
        前往全馆藏书目
      </Link>
    </section>
  );
}
