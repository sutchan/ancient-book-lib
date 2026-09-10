// components/RelationClient.tsx v1.5.0
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  findRelationPath,
  getPersonRelations,
  loadRelMeta,
  loadRelNames,
  searchPersons,
  type RelMeta,
  type RelationPathStep,
} from "@/lib/cbdb";

interface SelectedPerson {
  id: number;
  name: string;
}

interface RelItem {
  id: number;
  name: string;
  rel: string;
  year?: number;
}

export default function RelationClient() {
  const sp = useSearchParams();
  const [meta, setMeta] = useState<RelMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 人物 A
  const [aInput, setAInput] = useState(sp.get("name") || "");
  const [aSuggestions, setASuggestions] = useState<SelectedPerson[]>([]);
  const [aSelected, setASelected] = useState<SelectedPerson | null>(null);
  // 人物 B（双人溯源可选）
  const [bInput, setBInput] = useState("");
  const [bSuggestions, setBSuggestions] = useState<SelectedPerson[]>([]);
  const [bSelected, setBSelected] = useState<SelectedPerson | null>(null);

  const [relations, setRelations] = useState<{ kin: RelItem[]; assoc: RelItem[] } | null>(null);
  const [path, setPath] = useState<RelationPathStep[] | null>(null);
  const [pathMsg, setPathMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [depth, setDepth] = useState(2);

  useEffect(() => {
    loadRelMeta().then(setMeta).catch((e) => setError(String(e)));
  }, []);

  // 初始 ?name= 参数：自动选中第一个匹配人物
  useEffect(() => {
    const init = sp.get("name");
    if (init) {
      searchPersons(init, 5)
        .then((r) => {
          if (r.length) {
            setASelected({ id: r[0].id, name: r[0].name });
            setAInput(r[0].name);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A 搜索联想（防抖）
  useEffect(() => {
    const q = aInput.trim();
    if (!q || aSelected?.name === aInput.trim()) {
      setASuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      searchPersons(q, 8)
        .then((r) => setASuggestions(r))
        .catch(() => setASuggestions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [aInput, aSelected]);

  // B 搜索联想（防抖）
  useEffect(() => {
    const q = bInput.trim();
    if (!q || bSelected?.name === bInput.trim()) {
      setBSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      searchPersons(q, 8)
        .then((r) => setBSuggestions(r))
        .catch(() => setBSuggestions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [bInput, bSelected]);

  // A 选中后加载其关系
  useEffect(() => {
    if (!aSelected) {
      setRelations(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [rel, names] = await Promise.all([getPersonRelations(aSelected.id), loadRelNames()]);
        if (cancelled) return;
        const deco = (list: { id: number; rel: string; year?: number }[]): RelItem[] =>
          list.map((r) => ({ ...r, name: names.get(r.id) || `人物 ${r.id}` }));
        setRelations({ kin: deco(rel.kin), assoc: deco(rel.assoc) });
      } catch (e) {
        if (!cancelled) setError(String((e as Error)?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [aSelected]);

  // 双人溯源
  const runTrace = async () => {
    if (!aSelected || !bSelected) return;
    setLoading(true);
    setPathMsg(null);
    setPath(null);
    try {
      const { steps, explored } = await findRelationPath(aSelected.id, bSelected.id, {
        maxDepth: depth,
      });
      if (steps.length) {
        setPath(steps);
        setPathMsg(`共展开 ${explored} 位中间人物。`);
      } else {
        setPathMsg(
          `在 ${depth} 级范围内未找到「${aSelected.name}」与「${bSelected.name}」的关系（展开 ${explored} 位人物）。可尝试更深探索或更换人物。`
        );
      }
    } catch (e) {
      setPathMsg(`溯源失败：${String((e as Error)?.message || e)}`);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <div style={{ padding: 40, color: "#c00" }}>关系数据加载失败：{error}</div>;
  if (!meta) return <div style={{ padding: 60, textAlign: "center" }}>加载关系网络...</div>;

  return (
    <section id="relation-client-main">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>社会关系溯源</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>社会关系溯源</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 16, fontSize: 14 }}>
        CBDB 真实数据 · 亲属 {meta.stats.kinTotal.toLocaleString()} 条 / 社会关系{" "}
        {meta.stats.assocTotal.toLocaleString()} 条 / 著作 {meta.stats.textTotal.toLocaleString()} 条 ·
        涉及 {meta.stats.personTotal.toLocaleString()} 人
      </p>

      {/* 输入区 */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8, position: "relative" }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 300 }}>
          <input
            className="input-text"
            value={aInput}
            onChange={(e) => { setAInput(e.target.value); setASelected(null); setPath(null); }}
            placeholder="人物 A（如：朱熹）"
            style={{ width: "100%" }}
            aria-label="人物 A"
          />
          {aSuggestions.length > 0 && (
            <div className="rel-suggest">
              {aSuggestions.map((s) => (
                <button key={s.id} className="rel-suggest-item" onClick={() => { setASelected(s); setAInput(s.name); setASuggestions([]); }}>
                  {s.name} <span style={{ opacity: 0.6, fontSize: 12 }}>CBDB {s.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 300 }}>
          <input
            className="input-text"
            value={bInput}
            onChange={(e) => { setBInput(e.target.value); setBSelected(null); setPath(null); }}
            placeholder="人物 B（可选，双人溯源）"
            style={{ width: "100%" }}
            aria-label="人物 B"
          />
          {bSuggestions.length > 0 && (
            <div className="rel-suggest">
              {bSuggestions.map((s) => (
                <button key={s.id} className="rel-suggest-item" onClick={() => { setBSelected(s); setBInput(s.name); setBSuggestions([]); }}>
                  {s.name} <span style={{ opacity: 0.6, fontSize: 12 }}>CBDB {s.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-primary" disabled={!aSelected || !bSelected || loading} onClick={runTrace} style={{ fontSize: 14 }}>
          双人溯源
        </button>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <span style={{ color: "var(--color-text-secondary)" }}>深度</span>
          <select
            aria-label="溯源深度"
            value={depth}
            onChange={(e) => setDepth(parseInt(e.target.value, 10))}
            style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card-bg)", fontSize: 13 }}
          >
            <option value={1}>1 级（直接）</option>
            <option value={2}>2 级</option>
            <option value={3}>3 级（较慢）</option>
          </select>
        </div>
      </div>

      {/* 已选人物 */}
      <div style={{ marginBottom: 16, fontSize: 13, color: "var(--color-text-secondary)" }}>
        {aSelected ? <>已选 A：<strong>{aSelected.name}</strong>（CBDB {aSelected.id}）</> : "输入并选择人物 A 查看其关系网络"}
        {bSelected && <>　已选 B：<strong>{bSelected.name}</strong>（CBDB {bSelected.id}）</>}
      </div>

      {/* 溯源结果 */}
      {path && path.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <h4 style={{ margin: "0 0 12px" }}>关系路径</h4>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 14 }}>
            <PathNode id={path[0].from} />
            {path.map((step, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: "var(--color-primary)", fontSize: 13 }}>— {step.rel} —</span>
                <PathNode id={step.to} />
              </span>
            ))}
          </div>
        </div>
      )}
      {pathMsg && (
        <div className="card" style={{ padding: 14, marginBottom: 20, color: "var(--color-text-secondary)", fontSize: 14 }}>{pathMsg}</div>
      )}

      {/* 单人关系网络 */}
      {loading && <div style={{ padding: 40, textAlign: "center" }}>加载关系网络...</div>}
      {!loading && aSelected && relations && (relations.kin.length === 0 && relations.assoc.length === 0) && (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--color-text-secondary)" }}>
          CBDB 暂无「{aSelected.name}」的亲属/社会关系记录
        </div>
      )}
      {!loading && aSelected && relations && relations.kin.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 10px" }}>亲属关系（{relations.kin.length}）</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {relations.kin.slice(0, 80).map((r) => (
              <Link
                key={`k-${r.id}`}
                href={`/people/detail?id=${r.id}`}
                className="tag"
                style={{ textDecoration: "none", padding: "5px 10px", fontSize: 13 }}
              >
                {r.name}（{r.rel}）
              </Link>
            ))}
            {relations.kin.length > 80 && (
              <span className="tag" style={{ fontSize: 13 }}>另有 {relations.kin.length - 80} 位，详见 CBDB</span>
            )}
          </div>
        </div>
      )}
      {!loading && aSelected && relations && relations.assoc.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 10px" }}>社会关系（{relations.assoc.length}）</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {relations.assoc.slice(0, 80).map((r) => (
              <Link
                key={`a-${r.id}`}
                href={`/people/detail?id=${r.id}`}
                className="tag"
                style={{ textDecoration: "none", padding: "5px 10px", fontSize: 13 }}
              >
                {r.name}（{r.rel}{r.year ? `，${r.year}` : ""}）
              </Link>
            ))}
            {relations.assoc.length > 80 && (
              <span className="tag" style={{ fontSize: 13 }}>另有 {relations.assoc.length - 80} 条，详见 CBDB</span>
            )}
          </div>
        </div>
      )}

      {!aSelected && (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)" }}>
          <div style={{ fontSize: 15, marginBottom: 8 }}>输入人物姓名，查看其亲属与社会关系网络</div>
          <div style={{ fontSize: 13 }}>支持双人溯源：输入人物 B 可查找两人之间的直接关系或二级中间关系</div>
        </div>
      )}

      <div className="card" style={{ marginTop: 24, padding: 14, fontSize: 13, color: "var(--color-text-secondary)" }}>
        <strong>数据说明</strong>：关系数据来自 CBDB（2026-09-05 版）KIN_DATA（亲属）与 ASSOC_DATA（社会关系）
        表，关系描述为 CBDB 原始口径（如「友」「為Y之門人」等），方向以 CBDB 记录为准；双人溯源为分层广度优先搜索，
        支持直接关系与 2-3 级中间关系（每层探索宽度受限，3 级可能较慢且不一定覆盖全部路径）。
      </div>
    </section>
  );
}

function PathNode({ id }: { id: number }) {
  const [name, setName] = useState("");
  useEffect(() => {
    loadRelNames().then((m) => setName(m.get(id) || `人物 ${id}`)).catch(() => setName(`人物 ${id}`));
  }, [id]);
  return (
    <Link href={`/people/detail?id=${id}`} style={{ fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
      {name}
    </Link>
  );
}
