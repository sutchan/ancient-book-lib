// app/people/detail/PersonCvSections.tsx v1.15.8

/** 人物 CV 区块：字號別名 / 科舉入仕 / 史料來源 / 生平任职，从 PeopleDetailInner.tsx 拆出。
 *  调用方负责 `{!relLoading && !relError && data && ...}` 守卫。 */

export function AltNamesSection({ items }: { items: { name: string; type: string }[] }) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }} id="person-altnames">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((a, i) => (
          <span key={i} className="tag" style={{ fontSize: 13, padding: "5px 10px" }}>
            {a.name}
            {a.type && <span style={{ color: "var(--color-text-secondary)" }}>（{a.type}）</span>}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)" }}>
        古籍原文常以字、號、諡號等称呼人物，搜索姓名或别名均可命中。
      </div>
    </div>
  );
}

export function EntriesSection({ items }: { items: { entry: string; year: number; rank: string }[] }) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }} id="person-entries">
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 2 }}>
        {items.map((e, i) => (
          <li key={i}>
            {e.entry}
            {e.year ? <span style={{ color: "var(--color-text-secondary)", marginLeft: 6 }}>{e.year} 年</span> : null}
            {e.rank && <span style={{ color: "var(--color-text-secondary)", marginLeft: 6 }}>名次/第 {e.rank}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SourcesSection({ items }: { items: string[] }) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }} id="person-sources">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((s, i) => (
          <span key={i} className="tag" style={{ fontSize: 13, padding: "5px 10px" }}>
            {s}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)" }}>
        列出来自 CBDB 的主要文献来源（每书为 CBDB 原始书目）。
      </div>
    </div>
  );
}

export function OfficesSection({ items }: { items: { office: string; firstYear: number; lastYear: number; appt: string }[] }) {
  return (
    <>
      {items.length > 0 ? (
        <div className="card" style={{ padding: 16, marginBottom: 20 }} id="person-offices">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {items.slice(0, 60).map((o, i) => (
              <span key={i} className="tag" style={{ fontSize: 13, padding: "5px 10px" }}>
                {o.office}
                {o.appt && <span style={{ color: "var(--color-primary)" }}>（{o.appt}）</span>}
                {o.firstYear || o.lastYear ? (
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {" "}{o.firstYear ? o.firstYear : "?"}{o.lastYear && o.lastYear !== o.firstYear ? `-${o.lastYear}` : ""} 年
                  </span>
                ) : null}
              </span>
            ))}
            {items.length > 60 && (
              <span className="tag" style={{ fontSize: 13 }}>另有 {items.length - 60} 条，详见 CBDB</span>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 14, marginBottom: 20, color: "var(--color-text-secondary)", fontSize: 13 }} id="person-offices-empty">
          CBDB 暂无此人任职记录
        </div>
      )}
    </>
  );
}
