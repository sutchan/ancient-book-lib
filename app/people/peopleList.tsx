// app/people/peopleList.tsx v1.15.8
"use client";

/** 人物库结果区：统计文案 / 人物列表 / 分页，从 PeopleInner.tsx 拆出 */
import Link from "next/link";
import { formatLife, type CbdbPerson } from "@/lib/cbdb";

export type PersonListItem = {
  id: number;
  name: string;
  matched?: "name" | "alias";
  alias?: string;
  person?: CbdbPerson;
};

export function PeopleResultSummary({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 12 }} id="people-result-summary">
      {text}
    </div>
  );
}

export function PersonList({ items }: { items: PersonListItem[] }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }} id="people-list">
      {items.map((item, i) => {
        const person = item.person;
        return (
          <Link
            key={item.id}
            href={`/people/detail?id=${item.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
              borderBottom: i < items.length - 1 ? "1px solid var(--color-border)" : "none",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span style={{ fontWeight: 600, width: 132, fontSize: 15 }}>
              {item.name}
              {item.matched === "alias" && item.alias && (
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    marginLeft: 4,
                  }}
                >
                  （{item.alias}）
                </span>
              )}
            </span>
            {person && (
              <>
                <span className="tag">{person[7] || "朝代未詳"}</span>
                {person[6] === 1 && <span className="tag">女</span>}
                <span style={{ flex: 1, fontSize: 13, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {person[8] ? `籍贯：${person[8]}` : ""}
                </span>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  {person[3] || person[4] ? formatLife(person[3], person[4]) : person[5] ? `指数年 ${person[5]}` : ""}
                </span>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function PeoplePagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20 }} id="people-pagination">
      <button className="btn btn-secondary" disabled={page === 1} onClick={() => onPage(page - 1)} style={{ fontSize: 13 }}>上一页</button>
      <span style={{ fontSize: 13 }}>第 {page} / {totalPages} 页</span>
      <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)} style={{ fontSize: 13 }}>下一页</button>
    </div>
  );
}
