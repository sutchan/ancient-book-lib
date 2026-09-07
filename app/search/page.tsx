import type { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export const metadata: Metadata = {
  title: "全文检索｜古籍通 AncientBook",
  description: "古籍通毫秒级全文检索：标题/全文双模式，支持馆藏、朝代筛选，命中片段高亮。",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="empty-state">检索加载中…</div>}>
      <SearchClient />
    </Suspense>
  );
}
