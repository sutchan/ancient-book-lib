// app/stats/page.tsx v1.4.3
import type { Metadata } from "next";
import StatsClient from "@/components/StatsClient";

export const metadata: Metadata = {
  title: "数据统计｜古籍通 AncientBook",
  description: "古籍通馆藏数据统计与分析：馆藏分布、朝代分布、人物身份标签、关系网络密度等量化指标。",
};

export default function StatsPage() {
  return <StatsClient />;
}
