// components/CharacterProfileView.tsx v1.13.2
/**
 * 单份人物「考据档案」的展示组件（纯渲染 + 局部折叠交互，不负责取数）。
 * 为什么单独拆出来：CharacterDossier 负责检索/消歧/编排，档案渲染本身没有副作用，
 * 拆开后既能被 Dossier 复用，将来也能直接嵌进 /people 详情或分享卡片里。
 *
 * 设计原则：
 * 1. 所有 CBDB 分面都可能出现「空」或「加载失败」，必须显式区分——空是史料失载，
 *    失败是本次请求没拿到，两者对用户意义不同，不能混成一句「暂无数据」。
 * 2. 颜色一律走 globals.css 的 CSS 变量（--color-primary / --color-highlight / ...），
 *    行内 style 只写布局，保证三套主题（light/paper/dark）下都能看。
 * 3. 引用 CBDB 数据的页面必须署名 CC BY-NC-SA 4.0，这是许可证的硬性要求。
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  groupIssuesBySeverity,
  summarizeValidation,
  validateCharacterProfile,
  type IssueSeverity,
  type ValidationIssue,
} from "@/lib/characterValidate";
import type {
  AltnameEntry,
  CharacterProfile,
  FacetKey,
} from "@/lib/characterProfile";
import { formatLife, formatYear } from "@/lib/cbdb";
import PersonTimeline from "./PersonTimeline";
import RelationGraph, { type GraphNode } from "./RelationGraph";

/** 校验码 → 单字图标：让用户扫一眼就知道是哪一类问题；未收录的 code 走默认「·」 */
const ISSUE_ICON: Record<string, string> = {
  NAME_MISSING: "名",
  LIFE_MISSING: "年",
  BIRTH_DEATH_INVERTED: "⇄",
  LIFESPAN_IMPLAUSIBLE: "壽",
  YEAR_OUT_OF_RANGE: "年",
  ENTRY_AFTER_DEATH: "科",
  ENTRY_BEFORE_BIRTH: "科",
  OFFICE_YEAR_OUT_OF_LIFE: "職",
  INDEX_YEAR_MISSING: "指",
  INDEX_YEAR_OUT_OF_LIFE: "指",
  DYNASTY_MISSING: "朝",
  NATIVE_PLACE_MISSING: "籍",
  ALTNAME_MISSING: "字",
  FACET_FAILED: "缺",
};

/** 严重级别 → 配色（error 用朱红主色，warn 用高亮金，info 用次要灰） */
const SEVERITY_STYLE: Record<
  IssueSeverity,
  { color: string; border: string; label: string }
> = {
  error: { color: "var(--color-primary)", border: "var(--color-primary)", label: "数据存疑" },
  warn: { color: "var(--color-text)", border: "var(--color-highlight)", label: "需要留意" },
  info: { color: "var(--color-text-secondary)", border: "var(--color-border)", label: "补充说明" },
};

const SEVERITY_ORDER: IssueSeverity[] = ["error", "warn", "info"];

const GENDER_LABEL: Record<CharacterProfile["identity"]["gender"], string> = {
  male: "男",
  female: "女",
  unknown: "性别未註",
};

/** 任职列表折叠阈值：CBDB 个别高官有数百条任职，全量渲染会淹没页面 */
const OFFICE_COLLAPSE_LIMIT = 60;

/** 完整度评分环（SVG 自绘，零依赖；描边颜色走 CSS 变量以适配主题） */
function CompletenessRing({ score, grade }: { score: number; grade: string }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div style={{ position: "relative", width: 64, height: 64, flex: "0 0 64px" }}>
      <svg viewBox="0 0 64 64" width={64} height={64} role="img" aria-label={`完整度 ${score} 分，等级 ${grade}`}>
        <circle cx={32} cy={32} r={R} fill="none" strokeWidth={6} style={{ stroke: "var(--color-border)" }} />
        <circle
          cx={32}
          cy={32}
          r={R}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${(C * pct).toFixed(2)} ${C.toFixed(2)}`}
          transform="rotate(-90 32 32)"
          style={{ stroke: "var(--color-primary)" }}
        />
        <text x={32} y={37} textAnchor="middle" fontSize={15} fontWeight={700} style={{ fill: "var(--color-text)" }}>
          {score}
        </text>
      </svg>
      <span className="score-badge" style={{ position: "absolute", right: -8, bottom: -4 }}>
        {grade}
      </span>
    </div>
  );
}

/**
 * 分面降级提示：facets 里 status === "error" 说明该维度本次请求失败，
 * 数据已被降级为空数组，必须如实告知用户，否则「查无此人的字號」会被误读成史料失载。
 */
function FacetError({ profile, facet }: { profile: CharacterProfile; facet: FacetKey }) {
  const st = profile.facets ? profile.facets[facet] : undefined;
  if (!st || st.status !== "error") return null;
  return (
    <div style={{ fontSize: 12, color: "var(--color-primary)", marginBottom: 8 }}>
      该维度数据加载失败，已降级为空{st.error ? `：${st.error}` : ""}
    </div>
  );
}

function IssueItem({ issue }: { issue: ValidationIssue }) {
  const s = SEVERITY_STYLE[issue.severity];
  return (
    <li style={{ marginBottom: 6, borderLeft: `3px solid ${s.border}`, paddingLeft: 8 }}>
      <span
        style={{
          display: "inline-block",
          minWidth: 18,
          marginRight: 6,
          fontSize: 11,
          color: s.color,
          border: `1px solid ${s.border}`,
          borderRadius: 3,
          textAlign: "center",
        }}
        title={issue.code}
      >
        {ISSUE_ICON[issue.code] || "·"}
      </span>
      <span style={{ fontSize: 13 }}>{issue.message}</span>
      {issue.hint && (
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginLeft: 6 }}>
          （{issue.hint}）
        </span>
      )}
    </li>
  );
}

export default function CharacterProfileView({
  profile,
  onBack,
}: {
  profile: CharacterProfile;
  onBack?: () => void;
}) {
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [officesOpen, setOfficesOpen] = useState(false);

  const identity = profile.identity;
  const name = identity?.name || `人物 ${profile.id}`;
  const nameSimplified = identity?.nameSimplified || "";

  // 校验是纯函数，输入不变结果就不变，用 useMemo 避免每次折叠切换都重算
  const validation = useMemo(() => validateCharacterProfile(profile), [profile]);
  const summary = useMemo(() => summarizeValidation(validation), [validation]);
  const grouped = useMemo(() => groupIssuesBySeverity(validation), [validation]);

  const altnameGroups = useMemo(() => {
    const m = new Map<string, AltnameEntry[]>();
    for (const a of profile.altnames || []) {
      const key = (a.type || "其他别称").trim() || "其他别称";
      const list = m.get(key);
      if (list) list.push(a);
      else m.set(key, [a]);
    }
    return Array.from(m.entries());
  }, [profile.altnames]);

  const life = profile.life || { birthYear: null, deathYear: null, lifespan: null };
  const birth = life.birthYear ?? 0;
  const death = life.deathYear ?? 0;

  const cbdbUrl = `https://cbdb.hsites.harvard.edu/cbdbapi/person.php?id=${profile.id}`;
  const searchName = encodeURIComponent(name);

  const graphKin: GraphNode[] = (profile.kin || []).map((k) => ({
    id: k.id,
    name: k.name,
    rel: k.rel,
    kind: "kin" as const,
  }));
  const graphAssoc: GraphNode[] = (profile.assoc || []).map((a) => ({
    id: a.id,
    name: a.name,
    rel: a.rel,
    kind: "assoc" as const,
  }));

  const offices = profile.offices || [];
  const shownOffices = officesOpen ? offices : offices.slice(0, OFFICE_COLLAPSE_LIMIT);

  // 指数年说明：只要给出了指数年、或校验提示指数年缺失，就该解释这个字段的含义，
  // 否则用户很容易把「指数年」当成真实生年去做年代判断。
  const hasIndexNote =
    identity?.indexYear != null ||
    validation.issues.some((i) => i.code === "INDEX_YEAR_MISSING" || i.code === "INDEX_YEAR_OUT_OF_LIFE");

  return (
    <div id="character-dossier-profile">
      {/* ---------- 1. 头部身份区 ---------- */}
      <div className="book-detail">
        <h1 className="book-detail-title">
          {name}
          {nameSimplified && nameSimplified !== name && (
            <span className="char-zi" style={{ marginLeft: 10, fontSize: 16 }}>
              （{nameSimplified}）
            </span>
          )}
        </h1>
        {identity?.pinyin && (
          <div style={{ color: "var(--color-text-secondary)", marginBottom: 8, fontSize: 14 }}>
            {identity.pinyin}
          </div>
        )}
        <div className="book-detail-meta">
          <span className="tag">{identity?.dynasty || "朝代未註"}</span>
          <span className="tag">{GENDER_LABEL[identity?.gender ?? "unknown"]}</span>
          {profile.nativePlace ? (
            <span className="tag">籍贯/活动地：{profile.nativePlace}</span>
          ) : (
            <span className="tag">籍贯未註</span>
          )}
          <span className="tag">CBDB ID：{profile.id}</span>
        </div>

      </div>

      {/* ---------- 2. 校验摘要条（放在档案头之外，作为整份档案的体检横幅） ---------- */}
      <div
          className="card"
          style={{
            padding: 14,
            marginTop: 16,
            borderColor: validation.hasError ? "var(--color-primary)" : "var(--color-border)",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <CompletenessRing
              score={validation.completeness.score}
              grade={validation.completeness.grade}
            />
            <div style={{ flex: "1 1 240px", minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>考据校验：{summary}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                完整度 {validation.completeness.score} / 100（等级{" "}
                {validation.completeness.grade}）· 命中{" "}
                {validation.completeness.dimensions.filter((d) => d.hit).length} /{" "}
                {validation.completeness.dimensions.length} 个维度
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {validation.completeness.dimensions.map((d) => (
                  <span
                    key={d.key}
                    className="tag"
                    style={{
                      fontSize: 12,
                      borderColor: d.hit ? "var(--color-primary)" : "var(--color-border)",
                      color: d.hit ? "var(--color-primary)" : "var(--color-text-secondary)",
                    }}
                  >
                    {d.hit ? "✓ " : "○ "}
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
            <button
              className="btn-toggle btn-sm"
              onClick={() => setIssuesOpen((v) => !v)}
              aria-expanded={issuesOpen}
            >
              {issuesOpen ? "收起校验明细" : `展开校验明细（${validation.issues.length}）`}
            </button>
          </div>

          {issuesOpen && (
            <div
              style={{
                marginTop: 12,
                borderTop: "1px dashed var(--color-border)",
                paddingTop: 12,
              }}
            >
              {validation.issues.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  该档案未检出明显的数据冲突，但仍建议结合原始史料复核。
                </div>
              ) : (
                SEVERITY_ORDER.map((sev) =>
                  grouped[sev].length > 0 ? (
                    <div key={sev} style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: SEVERITY_STYLE[sev].color,
                          borderLeft: `3px solid ${SEVERITY_STYLE[sev].border}`,
                          paddingLeft: 8,
                          marginBottom: 6,
                        }}
                      >
                        {SEVERITY_STYLE[sev].label}（{grouped[sev].length}）
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, listStyle: "none" }}>
                        {grouped[sev].map((issue, i) => (
                          <IssueItem key={`${issue.code}-${i}`} issue={issue} />
                        ))}
                      </ul>
                    </div>
                  ) : null
                )
              )}
            </div>
          )}
        </div>

        {/* ---------- 3. 生卒信息与操作按钮（另起一张档案卡，校验横幅夹在身份与细节之间） ---------- */}
        <div className="book-detail" style={{ marginTop: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 12,
            margin: "20px 0",
          }}
        >
          {[
            { label: "生卒年", value: formatLife(birth, death) },
            { label: "出生年", value: formatYear(birth) },
            { label: "卒年", value: formatYear(death) },
            { label: "指数年", value: identity?.indexYear ? `${identity.indexYear} 年` : "不详" },
            { label: "享年", value: life.lifespan ? `${life.lifespan} 岁` : "不详" },
          ].map((it) => (
            <div key={it.label} className="card" style={{ padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{it.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{it.value}</div>
            </div>
          ))}
        </div>

        {hasIndexNote && (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
            指数年为 CBDB 依据人物生平信息推算的编年基准（约当人物 30 岁时的年份），
            并非真实生年，请勿直接当作出生年使用。
          </div>
        )}

        {/* ---------- 底部操作按钮 ---------- */}
        <div className="book-actions" style={{ marginTop: 4 }}>
          <Link href={`/search?q=${searchName}&mode=full`} className="btn btn-primary">
            在古籍全文检索「{name}」
          </Link>
          <Link href={`/relation?name=${searchName}`} className="btn btn-secondary">
            关系溯源
          </Link>
          <Link href={`/search?q=${searchName}&mode=title`} className="btn btn-secondary">
            在馆藏检索其著作
          </Link>
          <a href={cbdbUrl} target="_blank" rel="noopener" className="btn btn-secondary">
            CBDB 官方档案
          </a>
          <Link href="/people" className="btn btn-secondary">
            返回人物库
          </Link>
          {onBack && (
            <button className="btn btn-secondary" onClick={onBack}>
              返回搜索结果
            </button>
          )}
        </div>
      </div>

      {/* ---------- 4. 生命时间轴（复用既有组件，无事件时自身返回 null） ---------- */}
      <PersonTimeline
        name={name}
        birth={birth || undefined}
        death={death || undefined}
        entries={(profile.entries || []).map((e) => ({ entry: e.entry, year: e.year }))}
        offices={offices.map((o) => ({
          office: o.office,
          firstYear: o.firstYear,
          lastYear: o.lastYear,
        }))}
      />

      {/* ---------- 5. 字號別名 ---------- */}
      <h3 className="section-title">字號別名</h3>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <FacetError profile={profile} facet="altnames" />
        {altnameGroups.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            CBDB 未收录此人的字、號、諡號等别名；古籍原文常以字号称呼人物，
            检索时可改用字号或谥号直接搜索。
          </div>
        ) : (
          altnameGroups.map(([type, list]) => (
            <div key={type} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", minWidth: 56 }}>
                {type}
              </span>
              {list.map((a, i) => (
                <span key={`${a.name}-${i}`} className="tag" style={{ fontSize: 13, padding: "5px 10px" }}>
                  {a.name}
                </span>
              ))}
            </div>
          ))
        )}
      </div>

      {/* ---------- 6. 科舉/入仕 ---------- */}
      <h3 className="section-title">科舉 / 入仕</h3>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <FacetError profile={profile} facet="entries" />
        {(profile.entries || []).length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            CBDB 未收录此人的科举或入仕记录：可能未经科举而由荫补、荐举等途径入仕，亦可能史料失载。
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 2 }}>
            {profile.entries.map((e, i) => (
              <li key={i}>
                {e.entry}
                {e.year ? (
                  <span style={{ color: "var(--color-text-secondary)", marginLeft: 6 }}>
                    {formatYear(e.year)}
                  </span>
                ) : null}
                {e.rank ? (
                  <span className="tag" style={{ marginLeft: 8, fontSize: 12 }}>
                    名次 {e.rank}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------- 7. 生平任职 ---------- */}
      <h3 className="section-title">生平任職（{offices.length}）</h3>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <FacetError profile={profile} facet="offices" />
        {offices.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            CBDB 未收录此人的任职记录。
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {shownOffices.map((o, i) => (
                <span key={i} className="tag" style={{ fontSize: 13, padding: "5px 10px" }}>
                  {o.office}
                  {o.appt ? (
                    <span style={{ color: "var(--color-primary)" }}>（{o.appt}）</span>
                  ) : null}
                  {o.firstYear || o.lastYear ? (
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {" "}
                      {o.firstYear ? o.firstYear : "?"}
                      {o.lastYear && o.lastYear !== o.firstYear ? `-${o.lastYear}` : ""} 年
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
            {offices.length > OFFICE_COLLAPSE_LIMIT && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  另有 {offices.length - OFFICE_COLLAPSE_LIMIT} 条任职记录未显示
                </span>
                <button className="btn-toggle btn-sm" onClick={() => setOfficesOpen((v) => !v)} aria-expanded={officesOpen}>
                  {officesOpen ? "收起任职列表" : `展开全部 ${offices.length} 条`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ---------- 8. 著作與文獻 ---------- */}
      <h3 className="section-title">著作與文獻</h3>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <FacetError profile={profile} facet="texts" />
        {(profile.texts || []).length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            CBDB 未著录此人的著作；
            <Link
              className="character-book-link"
              style={{ marginLeft: 6, color: "var(--color-primary)" }}
              href={`/search?q=${searchName}&mode=title`}
            >
              可在本站馆藏中按「{name}」检索书名 →
            </Link>
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.9 }}>
            {profile.texts.map((t, i) => {
              // CBDB 的标题常带卷次/篇章后缀（如「XX:卷一」），检索馆藏时只取冒号前主标题
              const mainTitle = t.title.split(":")[0].trim() || t.title;
              return (
                <li key={i}>
                  {t.title}
                  {t.role ? (
                    <span className="tag" style={{ marginLeft: 8, fontSize: 12 }}>
                      {t.role}
                    </span>
                  ) : null}
                  {t.year ? (
                    <span style={{ color: "var(--color-text-secondary)", marginLeft: 6, fontSize: 13 }}>
                      {formatYear(t.year)}
                    </span>
                  ) : null}{" "}
                  <Link
                    className="character-book-link"
                    href={`/search?q=${encodeURIComponent(mainTitle)}&mode=title`}
                    style={{ fontSize: 12, color: "var(--color-primary)" }}
                    title={`在馆藏中检索《${mainTitle}》`}
                  >
                    在馆藏检索
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ---------- 9. 关系：网络图 + 亲属 / 社会关系 ---------- */}
      {(graphKin.length > 0 || graphAssoc.length > 0) && (
        <RelationGraph personName={name} kin={graphKin} assoc={graphAssoc} />
      )}

      <h3 className="section-title">親屬關係 / 社會關係</h3>
      <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h4 style={{ margin: "0 0 10px" }}>親屬關係（{(profile.kin || []).length}）</h4>
          <FacetError profile={profile} facet="relations" />
          {(profile.kin || []).length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
              CBDB 未收录此人的亲属关系记录。
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(profile.kin || []).map((r) => (
                <Link
                  key={`k-${r.id}`}
                  href={`/people/detail?id=${r.id}`}
                  className="tag character-book-link"
                  style={{ padding: "5px 10px", fontSize: 13 }}
                  title={`查看 ${r.name} 的人物库档案`}
                >
                  {r.name}（{r.rel}）
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h4 style={{ margin: "0 0 10px" }}>社會關係（{(profile.assoc || []).length}）</h4>
          {/* 关系族共用一个 relations 分面，失败提示已在上方親屬關係卡里给出，这里不重复 */}
          {(profile.assoc || []).length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
              CBDB 未收录此人的社会关系（师友、同僚、荐举等）记录。
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(profile.assoc || []).map((r, i) => (
                <Link
                  key={`a-${r.id}-${i}`}
                  href={`/people/detail?id=${r.id}`}
                  className="tag character-book-link"
                  style={{ padding: "5px 10px", fontSize: 13 }}
                  title={`查看 ${r.name} 的人物库档案`}
                >
                  {r.name}（{r.rel}
                  {r.year ? `，${formatYear(r.year)}` : ""}）
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- 10. 史料來源 ---------- */}
      <h3 className="section-title">史料來源</h3>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <FacetError profile={profile} facet="sources" />
        {(profile.sources || []).length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            CBDB 未标注此人的主要史料来源，引用时建议回溯原始文献。
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {profile.sources.map((s, i) => (
                <span key={i} className="tag" style={{ fontSize: 13, padding: "5px 10px" }}>
                  {s}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)" }}>
              以上为 CBDB 标注的主要文献来源（原始书目），不代表本站已收录其全文。
            </div>
          </>
        )}
      </div>

      {/* ---------- 11. 数据出处与免责声明（CC BY-NC-SA 4.0 署名是许可证硬性要求） ---------- */}
      <div
        className="card"
        style={{ marginTop: 24, padding: 16, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.9 }}
      >
        <strong>数据出处</strong>：本档案来自{" "}
        {profile.source?.name || "CBDB 中国历代人物传记资料库"}
        {profile.source?.releaseDate ? `（${profile.source.releaseDate} 版）` : ""}
        {profile.source?.url ? (
          <>
            {" · "}
            <a href={profile.source.url} target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>
              官方站点
            </a>
          </>
        ) : null}
        。
        <br />
        授权协议：
        <strong style={{ color: "var(--color-text)" }}>
          {profile.source?.license || "CC BY-NC-SA 4.0"}
        </strong>
        （署名-非商业性使用-相同方式共享 4.0 国际）。本站人物档案由 CBDB 原始数据归一化生成，
        存在生卒失载、同名录入冲突、朝代归属争议等情况，已在上文校验提示中标注，请结合史料自行研判。
        {profile.generatedAt ? (
          <>
            <br />
            档案生成时间：{profile.generatedAt}
          </>
        ) : null}
      </div>
    </div>
  );
}
