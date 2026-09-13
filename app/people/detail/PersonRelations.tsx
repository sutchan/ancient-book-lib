// app/people/detail/PersonRelations.tsx v1.15.8
import Link from "next/link";
import RelationGraph from "@/components/RelationGraph";
import type { RelationItem } from "./personTypes";

/** 人物关系区块：加载/失败/空态、关系网络图与亲属/社会/著作卡片，从 PeopleDetailInner.tsx 拆出 */
export function PersonRelations({
  personName,
  relLoading,
  relError,
  kin,
  assoc,
  texts,
}: {
  personName: string;
  relLoading: boolean;
  relError: string | null;
  kin: RelationItem[] | null;
  assoc: RelationItem[] | null;
  texts: { title: string; role: string; year: number }[] | null;
}) {
  return (
    <>
      <h3 className="section-title">人物关系（CBDB）</h3>
      {relLoading && <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--color-text-secondary)" }}>加载关系中...</div>}
      {relError && <div className="card" style={{ padding: 16, color: "#c00", fontSize: 14 }}>关系加载失败：{relError}</div>}
      {!relLoading && !relError && (kin?.length === 0) && (assoc?.length === 0) && (texts?.length === 0) && (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--color-text-secondary)" }}>
          CBDB 暂无此人的亲属/社会关系与著作记录
        </div>
      )}

      {/* 关系网络图 */}
      {!relLoading && !relError && ((kin?.length ?? 0) + (assoc?.length ?? 0)) > 0 && (
        <RelationGraph
          personName={personName}
          kin={(kin ?? []).map((r) => ({ id: r.id, name: r.name, rel: r.rel, kind: "kin" as const }))}
          assoc={(assoc ?? []).map((r) => ({ id: r.id, name: r.name, rel: r.rel, kind: "assoc" as const }))}
        />
      )}

      <div style={{ display: "grid", gap: 16, marginBottom: 20 }} id="person-relation-cards">
        {kin && kin.length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ margin: "0 0 10px" }}>亲属关系（{kin.length}）</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {kin.slice(0, 60).map((r) => (
                <Link
                  key={`k-${r.id}`}
                  href={`/people/detail?id=${r.id}`}
                  className="tag"
                  style={{ textDecoration: "none", padding: "5px 10px", fontSize: 13 }}
                >
                  {r.name}（{r.rel}）
                </Link>
              ))}
              {kin.length > 60 && (
                <span className="tag" style={{ fontSize: 13 }}>另有 {kin.length - 60} 位，详见 CBDB</span>
              )}
            </div>
          </div>
        )}

        {assoc && assoc.length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ margin: "0 0 10px" }}>社会关系（{assoc.length}）</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {assoc.slice(0, 60).map((r) => (
                <Link
                  key={`a-${r.id}`}
                  href={`/people/detail?id=${r.id}`}
                  className="tag"
                  style={{ textDecoration: "none", padding: "5px 10px", fontSize: 13 }}
                >
                  {r.name}（{r.rel}{r.year ? `，${r.year} 年` : ""}）
                </Link>
              ))}
              {assoc.length > 60 && (
                <span className="tag" style={{ fontSize: 13 }}>另有 {assoc.length - 60} 条，详见 CBDB</span>
              )}
            </div>
          </div>
        )}

        {texts && texts.length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ margin: "0 0 10px" }}>著作与文献（{texts.length}）</h4>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.9 }}>
              {texts.slice(0, 40).map((t, i) => (
                <li key={i}>
                  {t.title}
                  {t.role && <span className="tag" style={{ marginLeft: 8, fontSize: 12 }}>{t.role}</span>}
                  {t.year ? <span style={{ color: "var(--color-text-secondary)", marginLeft: 6, fontSize: 13 }}>{t.year} 年</span> : null}
                  {" "}
                  <Link
                    href={`/search?q=${encodeURIComponent(t.title.split(":")[0].trim())}&mode=title`}
                    style={{ fontSize: 12, color: "var(--color-primary)", textDecoration: "none" }}
                  >
                    在馆藏检索
                  </Link>
                </li>
              ))}
              {texts.length > 40 && <li style={{ color: "var(--color-text-secondary)" }}>另有 {texts.length - 40} 条，详见 CBDB</li>}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
