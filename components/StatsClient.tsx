// components/StatsClient.tsx v1.15.8
"use client";

/**
 * 数据统计页（编排层）：索引加载与朝代筛选状态在此，
 * 展示面板拆分于 components/stats/ 下。行为与拆分前一致。
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadCatalog, type DaizhigeCatalog } from "@/lib/catalog";
import {
  loadCbdbMeta, loadEntryDynastyMeta, loadGeoMeta, loadOfficeDynastyMeta,
  loadOfficesMeta, loadPersonYears, loadRelMeta,
  type CbdbMeta, type EntryDynastyMeta, type GeoMeta, type OfficeDynastyMeta,
  type OfficesMeta, type PersonYearsMeta, type RelMeta,
} from "@/lib/cbdb";
import { BarChart } from "./stats/BarChart";
import { StatKpis, OverviewPanel, RelPanel, OfficesPanel } from "./stats/StatPanels";
import { GeoPanel, OfficeDynastyPanel, EntryDynastyPanel, PersonYearsPanel } from "./stats/DynastyPanels";
import { DATA_SOURCE } from "@/lib/constants";

export default function StatsClient() {
  const [catalog, setCatalog] = useState<DaizhigeCatalog | null>(null);
  const [cbdb, setCbdb] = useState<CbdbMeta | null>(null);
  const [rel, setRel] = useState<RelMeta | null>(null);
  const [offices, setOffices] = useState<OfficesMeta | null>(null);
  const [geo, setGeo] = useState<GeoMeta | null>(null);
  const [offDyn, setOffDyn] = useState<OfficeDynastyMeta | null>(null);
  const [entryDyn, setEntryDyn] = useState<EntryDynastyMeta | null>(null);
  const [personYears, setPersonYears] = useState<PersonYearsMeta | null>(null);
  const [geoDynasty, setGeoDynasty] = useState<string | null>(null);
  const [offDynasty, setOffDynasty] = useState<string | null>(null);
  const [entryDynasty, setEntryDynasty] = useState<string | null>(null);
  const [yearsScope, setYearsScope] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog()
      .then(setCatalog)
      .catch((e) => setError(String(e)));
    loadCbdbMeta().then(setCbdb).catch(() => {});
    loadRelMeta().then(setRel).catch(() => {});
    loadOfficesMeta().then(setOffices).catch(() => {});
    loadGeoMeta()
      .then((m) => { setGeo(m); setGeoDynasty(m.byDynasty[0]?.dynasty ?? null); })
      .catch(() => {});
    loadOfficeDynastyMeta()
      .then((m) => { setOffDyn(m); setOffDynasty(m.byDynasty[0]?.dynasty ?? null); })
      .catch(() => {});
    loadEntryDynastyMeta()
      .then((m) => { setEntryDyn(m); setEntryDynasty(m.byDynasty[0]?.dynasty ?? null); })
      .catch(() => {});
    loadPersonYears().then(setPersonYears).catch(() => {});
  }, []);

  const byCat = useMemo(() => {
    if (!catalog) return [];
    return Object.entries(catalog.stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [catalog]);

  const byDynasty = useMemo(() => {
    if (!cbdb) return [];
    return cbdb.dynasty.slice(0, 10).map((d) => ({ name: d.dynasty, count: d.count }));
  }, [cbdb]);

  if (error) {
    return (
      <section id="stats-error">
        <div className="breadcrumb">
          <Link href="/">首页</Link>
          <span className="sep">/</span>
          <span>数据统计</span>
        </div>
        <p style={{ color: "#c00" }}>索引加载失败：{error}</p>
      </section>
    );
  }

  if (!catalog) {
    return (
      <section id="stats-loading">
        <div className="breadcrumb">
          <Link href="/">首页</Link>
          <span className="sep">/</span>
          <span>数据统计</span>
        </div>
        <div style={{ padding: 40, textAlign: "center" }}>加载中…</div>
      </section>
    );
  }

  const total = catalog.total;
  const relTotal = rel ? rel.stats.kinTotal + rel.stats.assocTotal : null;

  return (
    <section id="stats-main">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>数据统计</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>馆藏数据统计与分析</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        基于 {DATA_SOURCE} 全量 {total.toLocaleString()} 部古籍与 CBDB 全量人物传记数据的真实统计
      </p>

      <StatKpis
        categoryCount={byCat.length}
        total={total}
        totalSizeBytes={catalog.totalSizeBytes}
        cbdbTotal={cbdb ? cbdb.total : null}
        relTotal={relTotal}
      />

      <OverviewPanel
        total={total}
        cbdbTotal={cbdb ? cbdb.total : null}
        relTotal={relTotal}
        relPersonTotal={rel ? rel.stats.personTotal : null}
        officeTotal={offices ? offices.stats.officeTotal : null}
      />

      <div className="stat-grid" style={{ marginTop: 16 }}>
        <BarChart title="馆藏分布（按十大藏库）" rows={byCat} />
        <BarChart title="CBDB 人物朝代分布（前 10 朝代）" rows={byDynasty} />
      </div>

      {rel && <RelPanel rel={rel} />}
      {offices && <OfficesPanel offices={offices} />}
      {geo && geoDynasty && <GeoPanel geo={geo} dynasty={geoDynasty} onDynasty={setGeoDynasty} />}
      {offDyn && offDynasty && <OfficeDynastyPanel offDyn={offDyn} dynasty={offDynasty} onDynasty={setOffDynasty} />}
      {entryDyn && entryDynasty && <EntryDynastyPanel entryDyn={entryDyn} dynasty={entryDynasty} onDynasty={setEntryDynasty} />}
      {personYears && <PersonYearsPanel personYears={personYears} scope={yearsScope} onScope={setYearsScope} />}
    </section>
  );
}
