"use client";

import { useEffect, useMemo, useState } from "react";
import type { Character } from "@/lib/types";
import { filterCharacters, uniqueDynasties, uniqueTags } from "@/lib/characterFilter";
import CharacterCard from "./CharacterCard";

/**
 * 人物考据列表（数据驱动 + 检索/筛选）。
 * 数据来源：public/index/characters.json（由 CBDB 等元数据 ingest 脚本生成）。
 * 数据为空时回退「待接入」空态，接入后自动渲染并支持检索。
 */
export default function CharacterList() {
  const [chars, setChars] = useState<Character[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dynasty, setDynasty] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<"name" | "dynasty">("name");

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

  const dynasties = useMemo(() => (chars ? uniqueDynasties(chars) : []), [chars]);
  const tags = useMemo(() => (chars ? uniqueTags(chars) : []), [chars]);
  const filtered = useMemo(
    () => (chars ? filterCharacters(chars, { query, dynasty, tag, sort }) : []),
    [chars, query, dynasty, tag, sort]
  );

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
    <div id="character-list-main">
      <div className="filter-panel">
        <input
          className="input-text"
          style={{ maxWidth: 320 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="检索姓名 / 字 / 号 / 籍贯 / 官职"
          aria-label="检索人物"
        />
        <select
          value={dynasty}
          onChange={(e) => setDynasty(e.target.value)}
          aria-label="按朝代筛选"
        >
          <option value="">全部朝代</option>
          {dynasties.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          aria-label="按标签筛选"
        >
          <option value="">全部标签</option>
          {tags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "name" | "dynasty")}
          aria-label="排序方式"
        >
          <option value="name">按姓名</option>
          <option value="dynasty">按朝代</option>
        </select>
      </div>

      <div className="search-stat">
        共 {chars.length} 位人物
        {filtered.length !== chars.length && `，匹配 ${filtered.length} 位`}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">未找到匹配的人物</div>
          <div>请调整检索词或筛选条件。</div>
        </div>
      ) : (
        <div className="character-grid">
          {filtered.map((c) => (
            <CharacterCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
