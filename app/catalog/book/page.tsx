// app/catalog/book/page.tsx v1.4.3
"use client";

import { Suspense } from "react";
import CatalogBookInner from "./CatalogBookInner";

export default function CatalogBookPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>加载中...</div>}>
      <CatalogBookInner />
    </Suspense>
  );
}
