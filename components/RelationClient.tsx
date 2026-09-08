"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Relation } from "@/lib/types";

/**
 * 社会关系溯源（数据驱动）。
 * 数据来源：public/index/relations.json（由 CBDB 等元数据 ingest 脚本生成）。
 * 数据为空时回退「待接入」空态，接入后自动渲染，并支持双人关系检索。
 */
export default function RelationClient() {
  const [relations, setRelations] = useState<Relation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/index/relations.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Relation[]) => {
        if (!cancelled) setRelations(Array.isArray(d) ? d : []);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const matched = useMemo(() => {
    if (!relations) return [];
    const ka = a.trim();
    const kb = b.trim();
    if (!ka && !kb) return relations;
    return relations.filter(
      (r) =>
        (!ka || r.a.includes(ka) || r.b.includes(ka)) &&
        (!kb || r.a.includes(kb) || r.b.includes(kb))
    );
  }, [relations, a, b]);

  if (error) return <div style={{ padding: 40, color: "#c00" }}>关系数据加载失败：{error}</div>;
  if (relations === null) return <div style={{ padding: 40 }}>加载关系数据…</div>;

  if (relations.length === 0) {
    return (
      <section id="relation-client-main">
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

  return (
    <section id="relation-client-main">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>社会关系溯源</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>社会关系溯源</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
        共 {relations.length} 条关系 · 支持双人检索（师生 / 君臣 / 思想传承等）
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input
          className="input-text"
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="人物 A（如：孔子）"
          style={{ maxWidth: 240 }}
          aria-label="人物 A"
        />
        <input
          className="input-text"
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder="人物 B（可选）"
          style={{ maxWidth: 240 }}
          aria-label="人物 B"
        />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {matched.map((r, i) => (
          <div
            key={i}
            style={{
              padding: "12px 14px",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              background: "var(--color-card-bg)",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {r.a} <span style={{ color: "var(--color-primary)", fontWeight: 400 }}>— {r.type} —</span> {r.b}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4, lineHeight: 1.7 }}>
              {r.dynasty && <span>{r.dynasty}　</span>}
              {r.detail && <span>{r.detail}</span>}
              {r.source && <span>　出处：{r.source}</span>}
            </div>
          </div>
        ))}
        {matched.length === 0 && (
          <div className="empty-state">
            <div className="empty-title">未找到匹配的关系</div>
            <div>请调整检索人物名称。</div>
          </div>
        )}
      </div>
    </section>
  );
}
