"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import data from "@/lib/data-generated";
import { toSimplified } from "@/lib/t2s";

export default function RelationClient() {
  const allNames = useMemo(() => data.characters.map((c) => c.name), []);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [filterType, setFilterType] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const types = useMemo(
    () => Array.from(new Set(data.relations.map((r) => r.type))),
    []
  );

  const filtered = useMemo(
    () => data.relations.filter((r) => !filterType || r.type === filterType),
    [filterType]
  );

  const searchPeople = (q: string) =>
    allNames.filter((n) => n.includes(q)).slice(0, 8);

  const trace = () => {
    if (!a.trim() || !b.trim()) {
      setResult("请输入两位人物的名字");
      return;
    }
    const direct = data.relations.find(
      (r) =>
        (r.a === a.trim() && r.b === b.trim()) ||
        (r.a === b.trim() && r.b === a.trim())
    );
    if (direct) {
      setResult(
        `已建立直接关系「${direct.type}」：${direct.detail}（出处：${direct.source}）`
      );
      return;
    }
    // 一度间接关系
    const oneHop = data.relations.filter(
      (r) => r.a === a.trim() || r.b === a.trim()
    );
    const mid = oneHop
      .map((r) => (r.a === a.trim() ? r.b : r.a))
      .find((m) =>
        data.relations.some(
          (r) => (r.a === m && r.b === b.trim()) || (r.b === m && r.a === b.trim())
        )
      );
    if (mid) {
      setResult(`未发现直接关系，存在一度间接关联：${a.trim()} — ${mid} — ${b.trim()}（经由「${mid}」串联）`);
      return;
    }
    setResult(`当前考据库中未发现「${a.trim()}」与「${b.trim()}」的直接或一度关系，可提交考据线索扩充。`);
  };

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>社会关系溯源</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>社会关系溯源</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        基于史料建立人物多维关系网络 · 支持双人关系溯源
      </p>

      <div className="relation-form">
        <input className="input-text" list="people" placeholder="人物一（如 孔子）" value={a} onChange={(e) => setA(e.target.value)} aria-label="人物一" />
        <input className="input-text" list="people" placeholder="人物二（如 颜回）" value={b} onChange={(e) => setB(e.target.value)} aria-label="人物二" />
        <datalist id="people">
          {allNames.map((n) => <option key={n} value={n} />)}
        </datalist>
        <button className="btn btn-primary" onClick={trace}>关系溯源</button>
      </div>

      {result && (
        <div className="relation-item" style={{ borderLeftColor: "var(--color-highlight)" }}>
          {toSimplified(result)}
        </div>
      )}

      <h3 className="section-title">全部关系 · {filtered.length} 条</h3>
      <div className="relation-type">
        <button className={`btn-toggle ${!filterType ? "on" : ""}`} onClick={() => setFilterType("")}>
          全部
        </button>
        {types.map((t) => (
          <button key={t} className={`btn-toggle ${filterType === t ? "on" : ""}`} onClick={() => setFilterType(t)}>
            {toSimplified(t)}
          </button>
        ))}
      </div>

      {filtered.map((r, i) => (
        <div className="relation-item" key={i}>
          <div>
            <span className="rel-a">{toSimplified(r.a)}</span>
            <span className="rel-type">{toSimplified(r.type)}</span>
            <span className="rel-a" style={{ marginLeft: 10 }}>{toSimplified(r.b)}</span>
            <span style={{ marginLeft: 8, fontSize: 13, color: "var(--color-text-secondary)" }}>· {toSimplified(r.dynasty)}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.7 }}>{toSimplified(r.detail)}</div>
          <div className="rel-source">史料出处：{toSimplified(r.source)}</div>
        </div>
      ))}
    </section>
  );
}
