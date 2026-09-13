// components/stats/DynastyPanels.tsx v1.15.8
import type { GeoMeta, OfficeDynastyMeta, EntryDynastyMeta, PersonYearsMeta } from "@/lib/cbdb";
import { BarChart } from "./BarChart";

const SELECT_STYLE = { padding: "6px 10px", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card-bg)", fontSize: 13 } as const;

/** 籍贯分布（按朝代筛选） */
export function GeoPanel({
  geo,
  dynasty,
  onDynasty,
}: {
  geo: GeoMeta;
  dynasty: string;
  onDynasty: (v: string) => void;
}) {
  return (
    <div className="card stat-panel" style={{ marginTop: 16 }} id="stats-geo">
      <div className="stat-panel-title">人物籍贯分布（CBDB · 按朝代筛选）</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
        <select aria-label="籍贯朝代" value={dynasty} onChange={(e) => onDynasty(e.target.value)} style={SELECT_STYLE}>
          {geo.byDynasty.map((d) => (
            <option key={d.dynasty} value={d.dynasty}>
              {d.dynasty}（{d.count.toLocaleString()} 人）
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          共 {geo.stats.personTotal.toLocaleString()} 位有籍贯可归省的人物 / {geo.stats.provinceCount} 个省级行政区
        </span>
      </div>
      <BarChart
        title={`${dynasty} · 籍贯地区 Top 15（省/道/路）`}
        rows={(geo.byDynasty.find((d) => d.dynasty === dynasty)?.topProvinces ?? []).map((p) => ({ name: p.province, count: p.count }))}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        {geo.method}；古代行政区名按原数据呈现（如明「浙江布政司」、宋「福建路」、唐「河北道」），与今省名不可直接等同。
      </div>
    </div>
  );
}

/** 官职-朝代联动分析 */
export function OfficeDynastyPanel({
  offDyn,
  dynasty,
  onDynasty,
}: {
  offDyn: OfficeDynastyMeta;
  dynasty: string;
  onDynasty: (v: string) => void;
}) {
  return (
    <div className="card stat-panel" style={{ marginTop: 16 }} id="stats-office-dynasty">
      <div className="stat-panel-title">官职-朝代联动分析（CBDB · 按朝代筛选）</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
        <select aria-label="官职朝代" value={dynasty} onChange={(e) => onDynasty(e.target.value)} style={SELECT_STYLE}>
          {offDyn.byDynasty.map((d) => (
            <option key={d.dynasty} value={d.dynasty}>
              {d.dynasty}（{d.officeTotal.toLocaleString()} 条任职）
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          共 {offDyn.stats.officeTotal.toLocaleString()} 条任职-朝代记录
        </span>
      </div>
      <BarChart
        title={`${dynasty} · 高频官职 Top 15`}
        rows={(offDyn.byDynasty.find((d) => d.dynasty === dynasty)?.topOffices ?? []).map((o) => ({ name: o.office, count: o.count }))}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        {offDyn.method}；官职名为 CBDB 原始名称，同一官职在不同朝代可能有不同名称与含义。
      </div>
    </div>
  );
}

/** 科举-朝代分析 */
export function EntryDynastyPanel({
  entryDyn,
  dynasty,
  onDynasty,
}: {
  entryDyn: EntryDynastyMeta;
  dynasty: string;
  onDynasty: (v: string) => void;
}) {
  return (
    <div className="card stat-panel" style={{ marginTop: 16 }} id="stats-entry-dynasty">
      <div className="stat-panel-title">科举-朝代分析（CBDB · 按朝代筛选）</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
        <select aria-label="科举朝代" value={dynasty} onChange={(e) => onDynasty(e.target.value)} style={SELECT_STYLE}>
          {entryDyn.byDynasty.map((d) => (
            <option key={d.dynasty} value={d.dynasty}>
              {d.dynasty}（{d.entryTotal.toLocaleString()} 条）
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          共 {entryDyn.stats.entryTotal.toLocaleString()} 条科举/入仕记录 /{" "}
          {entryDyn.byDynasty.find((d) => d.dynasty === dynasty)?.personTotal.toLocaleString()} 人
        </span>
      </div>
      <BarChart
        title={`${dynasty} · 登科方式 Top 12`}
        rows={(entryDyn.byDynasty.find((d) => d.dynasty === dynasty)?.topEntries ?? []).map((e) => ({ name: e.entry, count: e.count }))}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        {entryDyn.method}；登科方式为 CBDB 原始名称（如「科舉: 進士」「科舉: 鄉貢舉人」「監生」等）。
      </div>
    </div>
  );
}

/** 历代人物时间分布 */
export function PersonYearsPanel({
  personYears,
  scope,
  onScope,
}: {
  personYears: PersonYearsMeta;
  scope: string;
  onScope: (v: string) => void;
}) {
  return (
    <div className="card stat-panel" style={{ marginTop: 16 }} id="stats-person-years">
      <div className="stat-panel-title">历代人物时间分布（CBDB · 指数年按世纪）</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
        <select aria-label="时间分布范围" value={scope} onChange={(e) => onScope(e.target.value)} style={SELECT_STYLE}>
          <option value="all">全部朝代</option>
          {personYears.byDynasty.map((d) => (
            <option key={d.dynasty} value={d.dynasty}>{d.dynasty}</option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          {personYears.stats.withYear.toLocaleString()} 位有指数年人物（占 {personYears.stats.total.toLocaleString()} 的{" "}
          {Math.round((personYears.stats.withYear / personYears.stats.total) * 100)}%）
        </span>
      </div>
      <BarChart
        title={`${scope === "all" ? "全部" : scope} · 各世纪人物数量（指数年）`}
        rows={(scope === "all"
          ? personYears.buckets
          : personYears.byDynasty.find((d) => d.dynasty === scope)?.buckets ?? []
        ).map((b) => ({ name: `${b.from}-${b.from + 99}`, count: b.count }))}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        {personYears.method}；数据形态呈「隋唐积累、宋元高峰、明清爆发」，与 CBDB 收录史料分布一致。
      </div>
    </div>
  );
}
