// components/CharacterCard.tsx v1.4.3
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Character } from "@/lib/types";

/**
 * 单个人物考据卡片（展示组件）。
 * 复用 globals.css 既有 .character-card / .char-name / .info-row / .tag 类。
 * 标题行展示姓名+字+朝代；可展开查看简介与关联典籍。
 */
export default function CharacterCard({ c }: { c: Character }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!c.desc || (c.books?.length ?? 0) > 0;

  return (
    <div className="character-card" id={`character-${c.id}`}>
      <div className="char-name">
        <span>{c.name}</span>
        {c.zi && <span className="char-zi">字 {c.zi}</span>}
        {c.dynasty && <span className="char-zi">{c.dynasty}</span>}
      </div>

      {(c.alias || c.native || c.office || c.birth || c.death) && (
        <div style={{ marginTop: 8, fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
          {c.alias && <span style={{ marginRight: 12 }}>号 {c.alias}</span>}
          {c.native && <span style={{ marginRight: 12 }}>籍贯 {c.native}</span>}
          {c.office && <span style={{ marginRight: 12 }}>官职 {c.office}</span>}
          {(c.birth || c.death) && (
            <span>生卒 {[c.birth, c.death].filter(Boolean).join("–")}</span>
          )}
        </div>
      )}

      {c.tags && c.tags.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {c.tags.map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
      )}

      {hasDetail && (
        <button
          className="btn-toggle btn-sm"
          style={{ marginTop: 12 }}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "收起详情" : "展开详情"}
        </button>
      )}

      {open && (
        <div style={{ marginTop: 12, borderTop: "1px dashed var(--color-border)", paddingTop: 12 }}>
          {c.desc && <p style={{ fontSize: 14, lineHeight: 1.8 }}>{c.desc}</p>}
          {c.books && c.books.length > 0 ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                相关典籍（{c.books.length}）· 点击书名可在馆藏中检索其版本
              </div>
              <div id={`character-${c.id}-books`} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {c.books.map((b, i) => (
                  <Link
                    key={i}
                    className="tag character-book-link"
                    href={`/search?q=${encodeURIComponent(b)}&mode=title`}
                    title="在馆藏中检索该书"
                  >
                    {b}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--color-text-secondary)" }}>
              暂无关联典籍著录。
              <Link
                className="character-book-link"
                style={{ marginLeft: 6 }}
                href={`/search?q=${encodeURIComponent(c.name)}&mode=title`}
              >
                在馆藏中检索「{c.name}」的著作 →
              </Link>
            </div>
          )}
        </div>
      )}

      {c.id && <div className="char-id">考据编号：{c.id}</div>}
    </div>
  );
}
