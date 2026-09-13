// components/RelationClient.tsx v1.15.8
"use client";

/**
 * 社会关系溯源（编排层）：状态与数据加载在此，
 * 联想输入/溯源结果/关系列表拆分于 components/relation/ 下。行为与拆分前一致。
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  findPersonById,
  findRelationPath,
  getPersonRelations,
  loadRelMeta,
  loadRelNames,
  searchPersons,
  type RelMeta,
  type RelationPathStep,
} from "@/lib/cbdb";
import { usePersonSuggest } from "./relation/usePersonSuggest";
import { SuggestInput } from "./relation/PersonInput";
import { TracePathCard } from "./relation/TraceResult";
import { RelationLists, RelationHint } from "./relation/RelationLists";
import type { RelItem } from "./relation/types";

export default function RelationClient() {
  const sp = useSearchParams();
  const [meta, setMeta] = useState<RelMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [relations, setRelations] = useState<{ kin: RelItem[]; assoc: RelItem[] } | null>(null);
  const [path, setPath] = useState<RelationPathStep[] | null>(null);
  const [pathMsg, setPathMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [depth, setDepth] = useState(2);

  // 人物 A / B（双人溯源可选）
  const a = usePersonSuggest(sp.get("name") || "");
  const b = usePersonSuggest("");

  useEffect(() => {
    loadRelMeta().then(setMeta).catch((e) => setError(String(e)));
  }, []);

  // 初始人物：优先 ?id=（CBDB 权威 ID，人物详情页即由它跳转而来）。
  // 只有当 URL 没有 id 时，才回退到 ?name= 的模糊匹配——且回退时必须显式提示。
  // 原实现只认 ?name= 并直接取首个命中 payload r[0]，而 CBDB 同名者众多
  // （王维 / 李密 / 张衡…），会静默对**另一个人的关系网络**做溯源，用户无从察觉。
  useEffect(() => {
    const initId = Number(sp.get("id") || 0);
    if (initId) {
      findPersonById(initId)
        .then((p) => {
          if (!p) {
            setPathMsg(`未找到 CBDB ID ${initId} 对应的人物`);
            return;
          }
          a.setSelected({ id: p[0], name: p[1] });
          a.setInput(p[1]);
        })
        .catch((e) => setPathMsg(`人物加载失败：${String((e as Error)?.message || e)}`));
      return;
    }
    const init = sp.get("name");
    if (!init) return;
    searchPersons(init, 5)
      .then((r) => {
        if (!r.length) {
          setPathMsg(`未找到与「${init}」匹配的人物`);
          return;
        }
        a.setSelected({ id: r[0].id, name: r[0].name });
        a.setInput(r[0].name);
        if (r.length > 1) {
          setPathMsg(
            `按姓名「${init}」匹配到 ${r[0].name}（CBDB ID ${r[0].id}），共 ${r.length} 个同名/近似结果；若其人非本人，请改用上方输入框选择。`
          );
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A 选中后加载其关系
  useEffect(() => {
    if (!a.selected) {
      setRelations(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [rel, names] = await Promise.all([getPersonRelations(a.selected!.id), loadRelNames()]);
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
  }, [a.selected]);

  // 双人溯源
  const runTrace = async () => {
    if (!a.selected || !b.selected) return;
    setLoading(true);
    setPathMsg(null);
    setPath(null);
    try {
      const { steps, explored } = await findRelationPath(a.selected.id, b.selected.id, {
        maxDepth: depth,
      });
      if (steps.length) {
        setPath(steps);
        setPathMsg(`共展开 ${explored} 位中间人物。`);
      } else {
        setPathMsg(
          `在 ${depth} 级范围内未找到「${a.selected.name}」与「${b.selected.name}」的关系（展开 ${explored} 位人物）。可尝试更深探索或更换人物。`
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
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8, position: "relative" }} id="relation-input-row">
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 300 }}>
          <SuggestInput
            value={a.input}
            suggestions={a.suggestions}
            placeholder="人物 A（如：朱熹）"
            ariaLabel="人物 A"
            onInput={(v) => { a.setInput(v); a.setSelected(null); setPath(null); }}
            onPick={a.pick}
          />
        </div>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 300 }}>
          <SuggestInput
            value={b.input}
            suggestions={b.suggestions}
            placeholder="人物 B（可选，双人溯源）"
            ariaLabel="人物 B"
            onInput={(v) => { b.setInput(v); b.setSelected(null); setPath(null); }}
            onPick={b.pick}
          />
        </div>
        <button className="btn btn-primary" disabled={!a.selected || !b.selected || loading} onClick={runTrace} style={{ fontSize: 14 }}>
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
      <div style={{ marginBottom: 16, fontSize: 13, color: "var(--color-text-secondary)" }} id="relation-selected">
        {a.selected ? <>已选 A：<strong>{a.selected.name}</strong>（CBDB {a.selected.id}）</> : "输入并选择人物 A 查看其关系网络"}
        {b.selected && <>　已选 B：<strong>{b.selected.name}</strong>（CBDB {b.selected.id}）</>}
      </div>

      {/* 溯源结果 */}
      {path && path.length > 0 && <TracePathCard path={path} />}
      {pathMsg && (
        <div className="card" style={{ padding: 14, marginBottom: 20, color: "var(--color-text-secondary)", fontSize: 14 }} id="relation-path-msg">{pathMsg}</div>
      )}

      {/* 单人关系网络 */}
      {a.selected ? (
        <RelationLists person={a.selected} relations={relations} loading={loading} />
      ) : (
        <RelationHint />
      )}

      <div className="card" style={{ marginTop: 24, padding: 14, fontSize: 13, color: "var(--color-text-secondary)" }} id="relation-data-note">
        <strong>数据说明</strong>：关系数据来自 CBDB（2026-09-05 版）的亲属与社会关系，关系描述为 CBDB 原始口径（如「友」「為Y之門人」等），方向以 CBDB 记录为准；双人溯源为分层广度优先搜索，
        支持直接关系与 2-3 级中间关系（每层探索宽度受限，3 级可能较慢且不一定覆盖全部路径）。
      </div>
    </section>
  );
}
