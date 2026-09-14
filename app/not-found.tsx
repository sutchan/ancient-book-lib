// app/not-found.tsx v1.4.4
import EmptyState from "@/components/EmptyState";
import { BOOK_COUNT_LABEL } from "@/lib/constants";

export default function NotFound() {
  return (
    <EmptyState
      icon="📜"
      title="404 · 此卷不在架上"
      description="您要找的内容不在书架之上，也许已移入其他馆藏"
      actions={[
        { label: "返回首页", href: "/", variant: "primary" },
        { label: `浏览全馆藏（${BOOK_COUNT_LABEL} 部）`, href: "/catalog" },
      ]}
    />
  );
}
