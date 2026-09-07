import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReaderClient from "@/components/ReaderClient";
import data from "@/lib/data-generated";

interface Props {
  params: { title: string };
}

export function generateStaticParams() {
  return data.books.map((b) => ({ title: encodeURIComponent(b.title) }));
}

export function generateMetadata({ params }: Props): Metadata {
  const book = data.books.find((b) => b.title === decodeURIComponent(params.title));
  return {
    title: `${book?.title ?? "阅读"}｜古籍通 AncientBook`,
    description: book?.desc,
  };
}

export default function ReadPage({ params }: Props) {
  const title = decodeURIComponent(params.title);
  const book = data.books.find((b) => b.title === title);
  if (!book) notFound();
  return <ReaderClient bookTitle={params.title} />;
}
