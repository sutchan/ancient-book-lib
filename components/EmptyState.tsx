import Link from "next/link";
import type { ReactNode } from "react";

export interface EmptyAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export default function EmptyState({
  icon = "📜",
  title,
  description,
  actions,
  children,
}: {
  icon?: string;
  title: string;
  description?: ReactNode;
  actions?: EmptyAction[];
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {description && <div>{description}</div>}
      {children}
      {actions && actions.length > 0 && (
        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {actions.map((a, i) =>
            a.href ? (
              <Link key={i} className={`btn btn-${a.variant || "secondary"}`} href={a.href}>
                {a.label}
              </Link>
            ) : (
              <button key={i} className={`btn btn-${a.variant || "secondary"}`} onClick={a.onClick}>
                {a.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
