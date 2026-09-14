// app/help/page.tsx v1.15.8
import type { Metadata } from "next";
import Link from "next/link";
import { HELP_SECTIONS } from "./helpContent";
import { BOOK_COUNT_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "帮助与说明｜古籍通 AncientBook",
  description: "古籍通使用帮助：如何检索、浏览与在线阅读古籍，繁简对照、字号主题设置、下载与书单导出、阅读历史，以及常见问题 FAQ。",
};

const HELP_ANCHORS: [string, string][] = [
  ["#search", "检索古籍"],
  ["#catalog", "浏览全馆藏"],
  ["#read", "在线阅读"],
  ["#settings", "繁简与主题"],
  ["#history", "阅读历史与下载"],
  ["#tools", "考据与统计"],
  ["#faq", "常见问题"],
  ["#legal", "相关说明"],
];

export default function HelpPage() {
  return (
    <section id="help-main">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>帮助与说明</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>帮助与说明</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, fontSize: 15 }}>
        本页面向读者，介绍如何检索、浏览与在线阅读古籍，以及主题、繁简、下载等常用功能。
      </p>

      {/* 快速上手 */}
      <div className="card stat-panel" style={{ lineHeight: 1.9, fontSize: 15, marginBottom: 24 }}>
        <strong>三步开始阅读：</strong>
        <ol style={{ paddingLeft: 22, margin: "6px 0 0" }}>
          <li>在首页或 <Link href="/search">检索</Link> 页输入关键词（如「论语」「仁义」）查找古籍；</li>
          <li>在 <Link href="/catalog">全馆藏</Link> 中按馆藏分类浏览 {BOOK_COUNT_LABEL} 部书目；</li>
          <li>点击任意书籍的「阅读」，即可在线阅读，支持繁简对照、字号调节与下载。</li>
        </ol>
      </div>

      {/* 锚点导航 */}
      <div className="card" style={{ padding: "14px 18px", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {HELP_ANCHORS.map(([href, label]) => (
          <a key={href} href={href} className="tag" style={{ textDecoration: "none" }}>{label}</a>
        ))}
      </div>

      {/* 各主题小节（内容见 helpContent.tsx） */}
      {HELP_SECTIONS.map((s) => (
        <section key={s.id}>
          <h3 className="section-title" id={s.id}>{s.title}</h3>
          {s.body}
        </section>
      ))}
    </section>
  );
}
