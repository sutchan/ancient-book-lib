import { Suspense } from "react";
import PeopleInner from "./PeopleInner";

export const metadata = {
  title: "人物库 · 古籍通",
  description:
    "661,350 位中国历代人物传记数据（CBDB 中国历代人物传记资料库），按姓氏/朝代浏览、检索。",
};

export default function PeoplePage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>加载人物库...</div>}>
      <PeopleInner />
    </Suspense>
  );
}
