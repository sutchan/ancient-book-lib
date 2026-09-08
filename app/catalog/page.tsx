import { Suspense } from "react";
import CatalogInner from "./CatalogInner";

export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>正在加载 15,694 部古籍书目索引...</div>}>
      <CatalogInner />
    </Suspense>
  );
}
