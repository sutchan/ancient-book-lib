import Link from "next/link";

export default function ErrorBlock({
  title,
  message,
  errorRef,
  onRetry,
  showHome = true,
}: {
  title: string;
  message: string;
  errorRef?: string;
  onRetry?: () => void;
  showHome?: boolean;
}) {
  return (
    <>
      <div className="empty-icon">⚠️</div>
      <div className="empty-title">{title}</div>
      <div>{message}</div>
      {errorRef && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)" }}>
          错误编号：{errorRef}
        </div>
      )}
      <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>
            重试
          </button>
        )}
        {showHome && (
          <Link className="btn btn-secondary" href="/">
            返回首页
          </Link>
        )}
      </div>
    </>
  );
}
