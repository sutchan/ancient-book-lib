// app/search/page.tsx v1.4.3
import type { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export const metadata: Metadata = {
  title: "检索｜古籍通 AncientBook",
  description: "古籍通检索：标题/全文双模式，支持馆藏筛选，命中书目高亮；全馆藏 15,694 部均支持检索。",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="empty-state">检索加载中…</div>}>
      <SearchClient />
    </Suspense>
  );
}
