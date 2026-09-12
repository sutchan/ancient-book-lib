// app/not-found.tsx v1.4.4
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state">
      <div className="empty-icon">📜</div>
      <div className="empty-title">404 · 此卷不在架上</div>
      <div>您要找的内容不在书架之上，也许已移入其他馆藏</div>
      <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link className="btn btn-primary" href="/">
          返回首页
        </Link>
        <Link className="btn btn-secondary" href="/catalog">
          浏览全馆藏（15,694 部）
        </Link>
      </div>
    </div>
  );
}
