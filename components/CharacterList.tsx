"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import data from "@/lib/data-generated";
import { toSimplified } from "@/lib/t2s";
import type { Book } from "@/lib/types";

/** 人物考据列表：搜索、朝代筛选、重名区分维度、关联典籍聚合（I5） */
export default function CharacterList() {
  const [kw, setKw] = useState("");
  const [dyn, setDyn] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const dynasties = useMemo(
    () => Array.from(new Set(data.characters.map((c) => c.dynasty))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = kw.trim();
    return data.characters.filter(
      (c) =>
        (!dyn || c.dynasty === dyn) &&
        (!q ||
          c.name.includes(q) ||
          (c.zi ?? "").includes(q) ||
          (c.alias ?? "").includes(q) ||
          (c.native ?? "").includes(q))
    );
  }, [kw, dyn]);

  /** 人物→典籍聚合：优先整书匹配，其次章节匹配 */
  const resolveBook = (bookRef: string) => {
    const direct = data.books.find((b) => b.title === bookRef);
    if (direct) return direct;
    return data.books.find((b) => b.chapters.includes(bookRef));
  };

  return (
    <>
      <div className="filter-panel">
        <input
          className="input-text"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="搜索姓名、字号、别称、籍贯"
          aria-label="人物搜索"
          style={{ maxWidth: 300 }}
        />
        <select aria-label="朝代筛选" value={dyn} onChange={(e) => setDyn(e.target.value)}>
          <option value="">全部朝代</option>
          {dynasties.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          共 {filtered.length} 位
        </span>
      </div>

      <div className="category-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
        {filtered.map((c) => {
          const books = (c.books || [])
            .map(resolveBook)
            .filter((b): b is Book => Boolean(b));
          const isOpen = open === c.id;
          return (
            <div className="character-card" key={c.id}>
              <div className="char-name">
                {c.name}
                {c.zi && <span className="char-zi">字 {c.zi}</span>}
              </div>
              <div className="info-row">
                {c.alias && (
                  <div><label>号</label> {c.alias}</div>
                )}
                {(c.dynasty || c.native) && (
                  <div><label>朝代/籍贯</label> {[c.dynasty, c.native].filter(Boolean).join(" · ")}</div>
                )}
                {(c.birth || c.death) && (
                  <div><label>生卒</label> {[c.birth, c.death].filter(Boolean).join(" — ")}</div>
                )}
                {c.office && <div><label>官职</label> {c.office}</div>}
                <div style={{ marginTop: 8 }}>
                  {(c.tags || []).map((t) => (
                    <span className="tag" key={t} style={{ marginRight: 6 }}>{t}</span>
                  ))}
                </div>
                <div className="char-id">唯一人物ID：{c.id}（朝代+籍贯+官职多维区分）</div>
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 10, fontSize: 13, padding: "5px 12px" }}
                  onClick={() => setOpen(isOpen ? null : c.id)}
                >
                  {isOpen ? "收起关联典籍" : `查看典籍记载（${books.length}）`}
                </button>
                {isOpen && (
                  <div className="char-books" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {books.length === 0 && (
                      <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                        暂无匹配馆藏典籍记录
                      </div>
                    )}
                    {books.map((b, i) => (
                      <Link key={i} href={`/book/${b.id}`} style={{ fontSize: 13, color: "var(--color-primary)" }}>
                        {toSimplified(b.title)}（{b.chapters.length} 卷）›
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <div className="empty-title">未找到匹配人物</div>
          <div>请尝试更换关键词或筛选条件</div>
        </div>
      )}
    </>
  );
}
