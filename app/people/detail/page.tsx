import { Suspense } from "react";
import PeopleDetailInner from "./PeopleDetailInner";

export const metadata = {
  title: "人物详情 · 古籍通",
  description: "中国历代人物传记详情（CBDB 数据），支持关联古籍检索。",
};

export default function PeopleDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>加载人物详情...</div>}>
      <PeopleDetailInner />
    </Suspense>
  );
}
