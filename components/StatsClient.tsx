"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadCatalog, formatSize, type DaizhigeCatalog } from "@/lib/catalog";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog()
      .then(setCatalog)
      .catch((e) => setError(String(e)));
  }, []);

  const byCat = useMemo(() => {
    if (!catalog) return [];
    return Object.entries(catalog.stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [catalog]);

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

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>数据统计</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>馆藏数据统计与分析</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        基于殆知阁 v20 全量 {total.toLocaleString()} 部古籍（上游托管，本仓库零复制）的馆藏规模与分布分析
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
          <div className="kpi-num">待接入</div>
          <div className="kpi-label">考据人物</div>
        </div>
        <div className="stat-kpi">
          <div className="kpi-num">待接入</div>
          <div className="kpi-label">关系条目</div>
        </div>
      </div>

      <div className="card stat-panel" style={{ marginTop: 20, padding: "16px 20px" }}>
        <div className="stat-panel-title">全量数据概览（殆知阁 v20 · 原始数据上游托管 · 本仓库零复制）</div>
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
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>10</span>{" "}
            <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>大馆藏</span>
          </div>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>5.7</span>{" "}
            <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>MB 书目索引（本仓库）</span>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-text-secondary)" }}>
          数据源：
          <a href="https://github.com/garychowcmu/daizhigev20" target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>
            garychowcmu/daizhigev20
          </a>{" "}
          · 阅读时按需 fetch raw URL，不预加载全量数据
        </div>
      </div>

      <div className="stat-grid" style={{ marginTop: 16 }}>
        <BarChart title="馆藏分布（按十大藏库）" rows={byCat} />
        <div className="card stat-panel">
          <div className="stat-panel-title">人物 / 关系考据</div>
          <div style={{ padding: 16, color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
            人物考据与关系溯源数据待接入，将随 CBDB 等权威元数据导入后开放，
            届时可展示身份标签分布、关系类型分布与考据洞察。
          </div>
        </div>
      </div>
    </section>
  );
}
