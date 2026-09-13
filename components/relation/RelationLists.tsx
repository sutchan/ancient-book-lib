// components/relation/RelationLists.tsx v1.15.8
import Link from "next/link";
import type { RelItem, SelectedPerson } from "./types";

/** 单人关系网络：空态提示 + 亲属/社会关系列表卡片，从 RelationClient.tsx 拆出 */
export function RelationLists({
  person,
  relations,
  loading,
}: {
  person: SelectedPerson;
  relations: { kin: RelItem[]; assoc: RelItem[] } | null;
  loading: boolean;
}) {
  return (
    <>
      {loading && <div style={{ padding: 40, textAlign: "center" }}>加载关系网络...</div>}
      {!loading && relations && relations.kin.length === 0 && relations.assoc.length === 0 && (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--color-text-secondary)" }} id="relation-empty">
          CBDB 暂无「{person.name}」的亲属/社会关系记录
        </div>
      )}
      {!loading && relations && relations.kin.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }} id="relation-kin-list">
          <h4 style={{ margin: "0 0 10px" }}>亲属关系（{relations.kin.length}）</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {relations.kin.slice(0, 80).map((r) => (
              <Link
                key={`k-${r.id}`}
                href={`/people/detail?id=${r.id}`}
                className="tag"
                style={{ textDecoration: "none", padding: "5px 10px", fontSize: 13 }}
              >
                {r.name}（{r.rel}）
              </Link>
            ))}
            {relations.kin.length > 80 && (
              <span className="tag" style={{ fontSize: 13 }}>另有 {relations.kin.length - 80} 位，详见 CBDB</span>
            )}
          </div>
        </div>
      )}
      {!loading && relations && relations.assoc.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }} id="relation-assoc-list">
          <h4 style={{ margin: "0 0 10px" }}>社会关系（{relations.assoc.length}）</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {relations.assoc.slice(0, 80).map((r) => (
              <Link
                key={`a-${r.id}`}
                href={`/people/detail?id=${r.id}`}
                className="tag"
                style={{ textDecoration: "none", padding: "5px 10px", fontSize: 13 }}
              >
                {r.name}（{r.rel}{r.year ? `，${r.year}` : ""}）
              </Link>
            ))}
            {relations.assoc.length > 80 && (
              <span className="tag" style={{ fontSize: 13 }}>另有 {relations.assoc.length - 80} 条，详见 CBDB</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** 未选人物时的引导卡 */
export function RelationHint() {
  return (
    <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)" }} id="relation-hint">
      <div style={{ fontSize: 15, marginBottom: 8 }}>输入人物姓名，查看其亲属与社会关系网络</div>
      <div style={{ fontSize: 13 }}>支持双人溯源：输入人物 B 可查找两人之间的直接关系或二级中间关系</div>
    </div>
  );
}
