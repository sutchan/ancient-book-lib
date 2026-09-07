import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReaderClient from "@/components/ReaderClient";
import data from "@/lib/data-generated";

interface Props {
  params: { title: string };
}

export function generateStaticParams() {
  // 返回原始值，Next.js 负责 URL 编码；不得 encodeURIComponent（会导致双重编码）
  return data.books.map((b) => ({ title: b.title }));
}

export function generateMetadata({ params }: Props): Metadata {
  // 注意：output:export 模式下 params 传入的是 URL 编码值，需 decode 一次
  const book = data.books.find((b) => b.title === decodeURIComponent(params.title));
  return {
    title: `${book?.title ?? "阅读"}｜古籍通 AncientBook`,
    description: book?.desc,
  };
}

export default function ReadPage({ params }: Props) {
  const title = decodeURIComponent(params.title);
  const book = data.books.find((b) => b.title === title);
  if (!book) {
    return (
      <div className="empty-state">
        <div className="empty-title">未找到此典籍</div>
        <div>「{title}」暂未收录，请返回首页浏览馆藏</div>
      </div>
    );
  }
  return <ReaderClient bookTitle={title} />;
}
