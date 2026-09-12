// app/read/remote/page.tsx v1.4.3
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
    <Suspense fallback={<div className="empty-state">卷帙浩繁，正在展开…</div>}>
      <RemoteReaderInner />
    </Suspense>
  );
}
