"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RemoteReader from "@/components/RemoteReader";

function RemoteReaderInner() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  return <RemoteReader bookId={id} />;
}

export default function RemoteReadPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>加载中...</div>}>
      <RemoteReaderInner />
    </Suspense>
  );
}
