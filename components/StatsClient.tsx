"use client";

import { useMemo } from "react";
import Link from "next/link";
import data from "@/lib/data-generated";
import {
  statsByCategory,
  statsByDynasty,
  statsByTag,
  statsByRelationType,
} from "@/lib/search";

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
            <div className="stat-bar-value">{r.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsClient() {
  const byCat = useMemo(() => statsByCategory(), []);
  const byDynasty = useMemo(() => statsByDynasty(), []);
  const byTag = useMemo(() => statsByTag(), []);
  const byRel = useMemo(() => statsByRelationType(), []);

  const totalChapters = data.books.reduce((s, b) => s + b.chapters.length, 0);
  const totalChars = data.characters.length;
  const totalRels = data.relations.length;
  const avgChapters = (totalChapters / data.books.length).toFixed(1);
  const tagMax = byTag[0];

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>数据统计</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>馆藏数据统计与分析</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        基于当前考据库 {data.version} 的馆藏规模、学术分布与关系网络量化分析
      </p>

      <div className="stat-kpis">
        <div className="stat-kpi">
          <div className="kpi-num">{data.categories.length}</div>
          <div className="kpi-label">馆藏分类</div>
        </div>
        <div className="stat-kpi">
          <div className="kpi-num">{data.books.length}</div>
          <div className="kpi-label">收录典籍</div>
        </div>
        <div className="stat-kpi">
          <div className="kpi-num">{totalChapters}</div>
          <div className="kpi-label">章节卷次</div>
        </div>
        <div className="stat-kpi">
          <div className="kpi-num">{totalChars}</div>
          <div className="kpi-label">考据人物</div>
        </div>
        <div className="stat-kpi">
          <div className="kpi-num">{totalRels}</div>
          <div className="kpi-label">关系条目</div>
        </div>
        <div className="stat-kpi">
          <div className="kpi-num">{avgChapters}</div>
          <div className="kpi-label">均卷数/部</div>
        </div>
      </div>

      <div className="stat-grid">
        <BarChart title="馆藏分布（按十大藏库）" rows={byCat} />
        <BarChart title="典籍朝代分布" rows={byDynasty} />
      </div>
      <div className="stat-grid" style={{ marginTop: 16 }}>
        <BarChart title="人物身份标签分布" rows={byTag.slice(0, 8)} />
        <BarChart title="关系类型分布" rows={byRel} />
      </div>

      <div className="card stat-panel" style={{ marginTop: 24 }}>
        <div className="stat-panel-title">考据洞察</div>
        <ul style={{ lineHeight: 2, fontSize: 15, paddingLeft: 20, color: "var(--color-text)" }}>
          <li>
            馆藏均衡度：十大藏库平均每库 {((data.books.length / data.categories.length).toFixed(1))} 部典籍，
            最高为{" "}{byCat[0]?.name}（{byCat[0]?.count} 部）{byCat[byCat.length - 1]?.count === byCat[0]?.count ? "" : `，最低为 ${byCat[byCat.length - 1]?.name}（${byCat[byCat.length - 1]?.count} 部）`}，
            馆藏结构较为均衡。
          </li>
          <li>
            朝代纵贯：典籍覆盖从「{byDynasty[byDynasty.length - 1]?.name}」到「{byDynasty[0]?.name}」的{" "}
            {byDynasty.length} 个历史阶段，其中 {byDynasty[0]?.name} 部目最多（{byDynasty[0]?.count} 部），
            体现以先秦经典与唐宋典籍为双核心的收藏脉络。
          </li>
          <li>
            人物谱系：{tagMax ? <>最高频身份标签为「{tagMax.name}」（{tagMax.count} 位），</> : ""}
            思想家与文学家构成考据人物主体；人物著作与馆藏典籍互链率{" "}
            {((data.characters.filter((c) => c.books.some((bk) => data.books.some((b) => b.title === bk || bk.includes(b.title)))).length / totalChars) * 100).toFixed(0)}%。
          </li>
          <li>
            关系网络：{totalRels} 条关系覆盖 {new Set(data.relations.flatMap((r) => [r.a, r.b])).size} 位人物，
            网络密度 {((totalRels * 2) / (totalChars * (totalChars - 1)) * 100).toFixed(1)}%；
            最高频关系类型为「{byRel[0]?.name}」（{byRel[0]?.count} 条）。
          </li>
          <li>
            数据说明：以上指标基于演示考据库实时计算，上线后随 5GB 古籍全文库索引同步刷新，支持按时间维度归档对比。
          </li>
        </ul>
      </div>
    </section>
  );
}
