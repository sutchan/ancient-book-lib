// components/StatsClient.tsx v1.5.0
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadCatalog, formatSize, type DaizhigeCatalog } from "@/lib/catalog";
import { loadCbdbMeta, loadGeoMeta, loadOfficeDynastyMeta, loadOfficesMeta, loadRelMeta, type CbdbMeta, type GeoMeta, type OfficeDynastyMeta, type OfficesMeta, type RelMeta } from "@/lib/cbdb";

const PALETTE = ["#8C3130", "#B8754E", "#C9A227", "#4E7A5A", "#5B7A9D", "#7A5B9D", "#9D5B6E", "#3E7A78", "#8A6D3B", "#5A6B8C"];

function BarChart({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="card stat-panel">
      <div className="stat-panel-title">{title}</div>
      <div className="stat-bars">
        {rows.map((r, i) => (
          <div className="stat-bar-row" key={r.name}>
            <div className="stat-bar-label">{r.name}</div>
            <div className="stat-bar-track">
              <span
                className="stat-bar-fill"
                style={{
                  width: `${(r.count / max) * 100}%`,
                  background: PALETTE[i % PALETTE.length],
                }}
              />
            </div>
            <div className="stat-bar-value">{r.count.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsClient() {
  const [catalog, setCatalog] = useState<DaizhigeCatalog | null>(null);
  const [cbdb, setCbdb] = useState<CbdbMeta | null>(null);
  const [rel, setRel] = useState<RelMeta | null>(null);
  const [offices, setOffices] = useState<OfficesMeta | null>(null);
  const [geo, setGeo] = useState<GeoMeta | null>(null);
  const [offDyn, setOffDyn] = useState<OfficeDynastyMeta | null>(null);
  const [geoDynasty, setGeoDynasty] = useState<string | null>(null);
  const [offDynasty, setOffDynasty] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog()
      .then(setCatalog)
      .catch((e) => setError(String(e)));
    loadCbdbMeta()
      .then(setCbdb)
      .catch(() => {});
    loadRelMeta()
      .then(setRel)
      .catch(() => {});
    loadOfficesMeta()
      .then(setOffices)
      .catch(() => {});
    loadGeoMeta()
      .then((m) => {
        setGeo(m);
        setGeoDynasty(m.byDynasty[0]?.dynasty ?? null);
      })
      .catch(() => {});
    loadOfficeDynastyMeta()
      .then((m) => {
        setOffDyn(m);
        setOffDynasty(m.byDynasty[0]?.dynasty ?? null);
      })
      .catch(() => {});
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
      <section>
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
      <section>
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
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>数据统计</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>馆藏数据统计与分析</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        基于殆知阁 v20 全量 {total.toLocaleString()} 部古籍与 CBDB 全量人物传记数据的真实统计
      </p>

      <div className="stat-kpis">
        <div className="stat-kpi">
          <div className="kpi-num">{byCat.length}</div>
          <div className="kpi-label">馆藏分类</div>
        </div>
        <div className="stat-kpi">
          <div className="kpi-num">{total.toLocaleString()}</div>
          <div className="kpi-label">收录典籍</div>
        </div>
        <div className="stat-kpi">
          <div className="kpi-num">{formatSize(catalog.totalSizeBytes)}</div>
          <div className="kpi-label">原始数据量</div>
        </div>
        <div className="stat-kpi">
          <div className="kpi-num">{cbdb ? cbdb.total.toLocaleString() : "…"}</div>
          <div className="kpi-label">人物库（CBDB）</div>
        </div>
        <div className="stat-kpi">
          <div className="kpi-num">{relTotal !== null ? relTotal.toLocaleString() : "…"}</div>
          <div className="kpi-label">关系条目</div>
        </div>
      </div>

      <div className="card stat-panel" style={{ marginTop: 20, padding: "16px 20px" }}>
        <div className="stat-panel-title">全量数据概览（殆知阁 v20 + CBDB · 原始数据上游托管 · 本仓库零复制原文）</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 12 }}>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>{total.toLocaleString()}</span>{" "}
            <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>部古籍</span>
          </div>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>4.9</span>{" "}
            <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>GB 原始 TXT</span>
          </div>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>
              {cbdb ? cbdb.total.toLocaleString() : "…"}
            </span>{" "}
            <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>位历代人物（CBDB）</span>
          </div>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>
              {relTotal !== null ? relTotal.toLocaleString() : "…"}
            </span>{" "}
            <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条关系（亲属+社会）</span>
          </div>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>
              {rel ? rel.stats.personTotal.toLocaleString() : "…"}
            </span>{" "}
            <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>位涉及关系人物</span>
          </div>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>
              {offices ? offices.stats.officeTotal.toLocaleString() : "…"}
            </span>{" "}
            <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条任职记录（CBDB）</span>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-text-secondary)" }}>
          数据源：
          <a href="https://github.com/garychowcmu/daizhigev20" target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>
            garychowcmu/daizhigev20
          </a>
          {" · "}
          <a href="https://cbdb.hsites.harvard.edu/" target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>
            CBDB 中国历代人物传记资料库
          </a>
          {" · 阅读时按需 fetch raw URL，不预加载全量数据"}
        </div>
      </div>

      <div className="stat-grid" style={{ marginTop: 16 }}>
        <BarChart title="馆藏分布（按十大藏库）" rows={byCat} />
        <BarChart title="CBDB 人物朝代分布（前 10 朝代）" rows={byDynasty} />
      </div>

      {rel && (
        <div className="card stat-panel" style={{ marginTop: 16 }}>
          <div className="stat-panel-title">人物关系数据（CBDB · 2026-09-05 版）</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", padding: "12px 4px" }}>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
                {rel.stats.kinTotal.toLocaleString()}
              </span>{" "}
              <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条亲属关系（KIN_DATA）</span>
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
                {rel.stats.assocTotal.toLocaleString()}
              </span>{" "}
              <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条社会关系（ASSOC_DATA）</span>
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
                {rel.stats.textTotal.toLocaleString()}
              </span>{" "}
              <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条人物-著作关联</span>
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
                {rel.stats.kinCodeCount}
              </span>{" "}
              <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>种亲属称谓</span>
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
                {rel.stats.assocCodeCount}
              </span>{" "}
              <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>种社会关系类型</span>
            </div>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            关系覆盖 {rel.stats.personTotal.toLocaleString()} 位人物，可在{" "}
            <Link href="/relation" style={{ color: "var(--color-primary)" }}>社会关系溯源</Link> 中按人物查看，
            支持直接关系与 2-3 级中间关系的双人溯源（每层探索宽度受限）。
          </div>
        </div>
      )}

      {offices && (
        <div className="card stat-panel" style={{ marginTop: 16 }}>
          <div className="stat-panel-title">人物任职数据（CBDB POSTED_TO_OFFICE_DATA · 2026-09-05 版）</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", padding: "12px 4px" }}>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
                {offices.stats.officeTotal.toLocaleString()}
              </span>{" "}
              <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条任职记录</span>
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
                {offices.stats.personTotal.toLocaleString()}
              </span>{" "}
              <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>位有任职记载的人物</span>
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
                {offices.stats.officeNameCount.toLocaleString()}
              </span>{" "}
              <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>种官职名</span>
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
                {offices.stats.apptCodeCount}
              </span>{" "}
              <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>种任命类型（正授/權/守/試/攝等）</span>
            </div>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            任职记录（官职、起止年、任命类型）展示于{" "}
            <Link href="/people" style={{ color: "var(--color-primary)" }}>人物库</Link> 详情页「生平任职」区块。
          </div>
        </div>
      )}

      {geo && geoDynasty && (
        <div className="card stat-panel" style={{ marginTop: 16 }}>
          <div className="stat-panel-title">人物籍贯分布（CBDB · 按朝代筛选）</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
            <select
              aria-label="籍贯朝代"
              value={geoDynasty}
              onChange={(e) => setGeoDynasty(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card-bg)", fontSize: 13 }}
            >
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
            title={`${geoDynasty} · 籍贯地区 Top 15（省/道/路）`}
            rows={(geo.byDynasty.find((d) => d.dynasty === geoDynasty)?.topProvinces ?? []).map((p) => ({ name: p.province, count: p.count }))}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            {geo.method}；古代行政区名按原数据呈现（如明「浙江布政司」、宋「福建路」、唐「河北道」），与今省名不可直接等同。
          </div>
        </div>
      )}

      {offDyn && offDynasty && (
        <div className="card stat-panel" style={{ marginTop: 16 }}>
          <div className="stat-panel-title">官职-朝代联动分析（CBDB · 按朝代筛选）</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
            <select
              aria-label="官职朝代"
              value={offDynasty}
              onChange={(e) => setOffDynasty(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card-bg)", fontSize: 13 }}
            >
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
            title={`${offDynasty} · 高频官职 Top 15`}
            rows={(offDyn.byDynasty.find((d) => d.dynasty === offDynasty)?.topOffices ?? []).map((o) => ({ name: o.office, count: o.count }))}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            {offDyn.method}；官职名为 CBDB 原始名称，同一官职在不同朝代可能有不同名称与含义。
          </div>
        </div>
      )}
    </section>
  );
}
