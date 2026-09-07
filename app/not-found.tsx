import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state">
      <div className="empty-icon">📜</div>
      <div className="empty-title">404 · 未找到此卷</div>
      <div>您访问的内容不存在或已被移入其他馆藏</div>
      <div style={{ marginTop: 20 }}>
        <Link className="btn btn-primary" href="/">返回首页</Link>
      </div>
    </div>
  );
}
