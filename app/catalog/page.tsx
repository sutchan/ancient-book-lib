// app/catalog/page.tsx v1.4.3
import { Suspense } from "react";
import CatalogInner from "./CatalogInner";
import { BOOK_COUNT_LABEL } from "@/lib/constants";

export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>正在加载 {BOOK_COUNT_LABEL} 部古籍书目索引...</div>}>
      <CatalogInner />
    </Suspense>
  );
}
