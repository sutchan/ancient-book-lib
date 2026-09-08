"use client";

import { useEffect, useState } from "react";
import type { Character } from "@/lib/types";

/**
 * 人物考据列表（数据驱动）。
 * 数据来源：public/index/characters.json（由 CBDB 等元数据 ingest 脚本生成）。
 * 数据为空时回退「待接入」空态，接入后自动渲染。
 */
export default function CharacterList() {
  const [chars, setChars] = useState<Character[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/index/characters.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Character[]) => {
        if (!cancelled) setChars(Array.isArray(d) ? d : []);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div style={{ padding: 40, color: "#c00" }}>人物数据加载失败：{error}</div>;
  if (chars === null) return <div style={{ padding: 40 }}>加载人物考据数据…</div>;

  if (chars.length === 0) {
    return (
      <div id="character-list-main" className="empty-state">
        <div className="empty-icon">👤</div>
        <div className="empty-title">人物考据数据待接入</div>
        <div>
          本站已直连殆知阁 v20 全量古籍原文，人物与关系考据将在导入 CBDB 等权威元数据后开放，
          届时可按朝代、籍贯、官职区分重名人物并聚合其典籍记载。
        </div>
      </div>
    );
  }

  return (
    <div id="character-list-main" style={{ display: "grid", gap: 12 }}>
      {chars.map((c) => (
        <div
          key={c.id}
          style={{
            padding: "14px 16px",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            background: "var(--color-card-bg)",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {c.name}
            {c.zi && <span style={{ color: "var(--color-text-secondary)", fontWeight: 400, marginLeft: 8 }}>字 {c.zi}</span>}
            {c.dynasty && <span style={{ color: "var(--color-text-secondary)", fontWeight: 400, marginLeft: 8 }}>{c.dynasty}</span>}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 6, lineHeight: 1.7 }}>
            {c.native && <span>籍贯：{c.native}　</span>}
            {c.office && <span>官职：{c.office}　</span>}
            {c.alias && <span>别名：{c.alias}</span>}
          </div>
          {c.desc && <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.7 }}>{c.desc}</p>}
          {c.books?.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 6 }}>
              相关典籍：{c.books.length} 部
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
