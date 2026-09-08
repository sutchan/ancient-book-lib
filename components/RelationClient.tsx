"use client";

import Link from "next/link";

export default function RelationClient() {
  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>社会关系溯源</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>社会关系溯源</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        基于史料建立人物多维关系网络 · 支持双人关系溯源（数据待接入）
      </p>
      <div className="empty-state">
        <div className="empty-icon">🔗</div>
        <div className="empty-title">关系数据待接入</div>
        <div>关系溯源将在导入 CBDB 等权威元数据后开放，支持师生、君臣、思想传承等关系网络与双人溯源。</div>
      </div>
    </section>
  );
}
