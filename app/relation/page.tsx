// app/relation/page.tsx v1.5.0
import type { Metadata } from "next";
import { Suspense } from "react";
import RelationClient from "@/components/RelationClient";
import { REL_KIN_COUNT, REL_SOC_COUNT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "社会关系溯源｜古籍通 AncientBook",
  description:
    `古籍通人物社会关系网络（CBDB 真实数据）：亲属 ${REL_KIN_COUNT} 条 + 社会关系 ${REL_SOC_COUNT} 条，支持双人关系溯源。`,
};

export default function RelationPage() {
  return (
    <Suspense fallback={<div className="empty-state">关系网络加载中…</div>}>
      <RelationClient />
    </Suspense>
  );
}
