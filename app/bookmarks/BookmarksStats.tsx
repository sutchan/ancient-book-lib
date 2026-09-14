// app/bookmarks/BookmarksStats.tsx v1.18.1
"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Bookmark } from "@/lib/bookmarks";

const CHART_COLORS = ["#8C3130", "#CEA76A", "#704030", "#B89A68", "#4A6B5D", "#5A6152", "#9E6B55", "#C9605E"];

interface BookmarksStatsProps {
  bookmarks: Bookmark[];
  categoryCounts: Record<string, number>;
  mostActiveCategory: string;
  recentBookmarks: Bookmark[];
  fmtTime: (ts: number) => string;
}

export default function BookmarksStats({
  bookmarks,
  categoryCounts,
  mostActiveCategory,
  recentBookmarks,
  fmtTime,
}: BookmarksStatsProps) {
  if (bookmarks.length === 0) return null;

  const chartData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  return (
    <div id="bookmarks-stats-card" className="card" style={{ padding: 20, marginBottom: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, alignItems: "center" }}>
      <div id="bookmarks-overview">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--color-text)" }}>书架数据概览</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "var(--color-text-secondary)" }}>
          <div>收藏总数：<strong style={{ color: "var(--color-primary)", fontSize: 16 }}>{bookmarks.length}</strong> 部</div>
          <div>涉及分类数：<strong style={{ color: "var(--color-text)" }}>{Object.keys(categoryCounts).length}</strong> 个</div>
          <div>最活跃类别：<strong style={{ color: "var(--color-primary)" }}>{mostActiveCategory}</strong></div>
        </div>
      </div>
      <div id="bookmarks-chart-wrap" style={{ height: 180, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={65}
              innerRadius={30}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card-bg)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
                borderRadius: 6,
                fontSize: 13,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
              itemStyle={{ color: "var(--color-text)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div id="bookmarks-recent-list" style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "var(--color-text)" }}>最近收藏</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 150, overflowY: "auto" }}>
          {recentBookmarks.map((rb) => (
            <div key={rb.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, gap: 8 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-text)", fontWeight: 500 }} title={rb.title}>
                {rb.title}
              </span>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", flexShrink: 0 }}>
                {fmtTime(rb.time)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
