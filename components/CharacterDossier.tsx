// components/CharacterDossier.tsx v1.13.2
/**
 * 人物考据工作台：检索 → 重名候选消歧 → 单份考据档案。
 *
 * 为什么要把状态机写在这一个组件里：
 * 1. URL 是唯一的真相来源（?q=&id= 可分享/可刷新还原），state 与 URL 双向同步必须放在同一处，
 *    否则「前进后退」与「输入防抖」会互相打断，出现死循环或旧结果覆盖新输入。
 * 2. CBDB 索引是运行时 fetch 的静态资源，任何一步都可能失败；这里用 Promise.allSettled +
 *    cancelled 守卫做容错，并在索引整体不可用时整页降级到遗留精选人物列表，
 *    保证 /character 在任何部署形态下都有内容而不是白屏。
 *
 * 注意：本组件使用 useSearchParams，静态导出（output: "export"）下必须由调用方用 <Suspense> 包裹。
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  findPersonById,
  loadCbdbMeta,
  searchPersons,
  type CbdbMeta,
} from "@/lib/cbdb";
import {
  loadCharacterProfile,
  pickDistinguishers,
  type CandidateHit,
  type CharacterProfile,
  type Distinguisher,
} from "@/lib/characterProfile";
import CharacterList from "./CharacterList";
import CharacterProfileView from "./CharacterProfileView";

/** 单次检索取数上限：再多既不必要也会拖慢同名候选的 enrichment */
const SEARCH_LIMIT = 20;
/** 输入防抖时长（ms）：CBDB 搜索索引是客户端全量扫描，必须防抖 */
const DEBOUNCE_MS = 300;
/** 超长输入截断阈值：超过 50 字基本不可能是人名，截断避免无谓的全表扫描 */
const MAX_QUERY_LEN = 50;
/** 同名候选 enrichment 上限：每个候选都要回查一次人物分片，太多会拖慢首屏 */
const MAX_ENRICH = 12;

type SearchRawHit = {
  id: number;
  name: string;
  matched?: "name" | "alias";
  alias?: string;
};

/**
 * 标点/符号集合（含中英文全角）：检索前一律剥离。
 * 用 \u 转义写而不是 \p{P}——后者需要 u 标志，而 tsc 在默认 target 下会拒绝 u 标志。
 */
const PUNCT_RE =
  /[\s\u00b7\u2022\u2027\u3001\u3002\u3003\uff0c\uff01\uff1f\uff1b\uff1a\u201c\u201d\u2018\u2019\uff08\uff09\u300a\u300b\u3008\u3009\u3010\u3011\u3014\u3015\u005b\u005d\u007b\u007d\u0028\u0029\u003c\u003e\u007e\u0021\u0040\u0023\u0024\u0025\u005e\u0026\u002a\u005f\u002d\u003d\u002b\u007c\u005c\u002f\u0027\u0022\u003b\u003a\u002c\u002e\u003f\u0060]/g;

/**
 * 关键词归一化：剥离标点与空白、截断。
 * 为什么必须处理「全是标点」：searchPersons 会在客户端对 66 万人名索引做全表扫描，
 * 输入「，，，」不该触发这次昂贵查询，更不该显示「未找到匹配人物」这种误导性空态。
 */
function normalizeQuery(raw: string): string {
  const stripped = raw.replace(PUNCT_RE, "");
  if (!stripped) return "";
  return stripped.slice(0, MAX_QUERY_LEN);
}

/** 解析 URL 上的 id 参数：非法（空/NaN/负数/超大/非整数）一律视为「未选中」 */
function parseId(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const id = Math.floor(n);
  if (id <= 0 || id > 1_000_000_000) return null;
  return id;
}

/** 去重：CBDB 姓名索引与别名索引可能同时命中同一人 */
function dedupeById(hits: SearchRawHit[]): SearchRawHit[] {
  const seen = new Set<number>();
  const out: SearchRawHit[] = [];
  for (const h of hits) {
    if (!h || !Number.isFinite(h.id) || seen.has(h.id)) continue;
    seen.add(h.id);
    out.push(h);
  }
  return out;
}

function distinguisherValue(field: Distinguisher["field"], c: CandidateHit): string {
  if (field === "dynasty") return c.dynasty || "朝代未載";
  if (field === "indexYear") return c.indexYear ? `${c.indexYear} 年` : "活動時段未載";
  return c.nativePlace || "籍貫未載";
}

export default function CharacterDossier() {
  const params = useSearchParams();
  const router = useRouter();

  // ---------- CBDB 索引可用性探测 ----------
  const [meta, setMeta] = useState<CbdbMeta | null>(null);
  const [probe, setProbe] = useState<"pending" | "ready" | "fallback">("pending");

  // ---------- 检索状态 ----------
  const [inputKw, setInputKw] = useState(() => params.get("q") || "");
  const [kw, setKw] = useState(() => params.get("q") || "");
  const [rawHits, setRawHits] = useState<SearchRawHit[]>([]);
  const [candidates, setCandidates] = useState<CandidateHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ---------- 档案状态 ----------
  const [selectedId, setSelectedId] = useState<number | null>(() => parseId(params.get("id")));
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // 竞态守卫：搜索与档案加载各用一份序号，只有最后一次请求的结果允许落到 state
  const searchReqRef = useRef(0);
  const profileReqRef = useRef(0);
  // 记录「已为哪个关键词做过单命中自动选中」，避免用户手动返回候选后又被自动选中弹回去
  const autoPickedFor = useRef<string>("");

  // ---------- 初次挂载：探测 CBDB 全量索引 ----------
  useEffect(() => {
    let cancelled = false;
    loadCbdbMeta()
      .then((m) => {
        if (cancelled) return;
        setMeta(m);
        setProbe("ready");
      })
      .catch(() => {
        if (!cancelled) setProbe("fallback");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- URL → state（浏览器前进/后退、直接进入分享链接） ----------
  // 只在「URL 的值与当前 state 不同」时才写回，保证与下面的 state → URL 互相幂等，不会死循环。
  useEffect(() => {
    const q = params.get("q") || "";
    const id = parseId(params.get("id"));
    if (q !== kw) {
      setInputKw(q);
      setKw(q);
    }
    if (id !== selectedId) {
      setSelectedId(id);
      // URL 已明确指定人物时，禁止「单命中自动选中」把它顶掉
      if (id !== null) autoPickedFor.current = q;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // ---------- state → URL ----------
  // 与当前 query string 相同就不调用 replace，避免与上面那个 effect 互相触发。
  useEffect(() => {
    const qs = new URLSearchParams();
    if (kw) qs.set("q", kw);
    if (selectedId) qs.set("id", String(selectedId));
    const target = qs.toString();
    if (target === params.toString()) return;
    router.replace(target ? `/character?${target}` : "/character", { scroll: false });
  }, [kw, selectedId, params, router]);

  // ---------- 输入防抖 ----------
  useEffect(() => {
    const next = normalizeQuery(inputKw);
    // 关键词退化为空（清空或纯标点）时立刻生效，不必等防抖，避免空态滞后一拍
    const delay = next === "" ? 0 : DEBOUNCE_MS;
    const t = setTimeout(() => {
      setKw((prev) => (prev === next ? prev : next));
    }, delay);
    return () => clearTimeout(t);
  }, [inputKw]);

  // ---------- 检索 ----------
  useEffect(() => {
    if (!kw) {
      searchReqRef.current++;
      setRawHits([]);
      setSearching(false);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    const myReq = ++searchReqRef.current;
    setSearching(true);
    searchPersons(kw, SEARCH_LIMIT)
      .then((r) => {
        // 双保险：cancelled 兜住卸载，reqId 兜住「后发先至」的旧响应
        if (cancelled || myReq !== searchReqRef.current) return;
        setRawHits(dedupeById(r || []));
        setSearchError(null);
        setSearching(false);
      })
      .catch((e: unknown) => {
        if (cancelled || myReq !== searchReqRef.current) return;
        setRawHits([]);
        setSearchError(String((e as Error)?.message || e));
        setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kw]);

  // ---------- 同名候选 enrichment：补朝代/指数年/籍贯，供消歧展示 ----------
  // 用独立的 candidates state 承接结果（而不是原地改 rawHits），避免 setHits 触发自身 effect 成环。
  useEffect(() => {
    if (rawHits.length === 0) {
      setCandidates([]);
      return;
    }
    if (rawHits.length === 1) {
      setCandidates([{ ...rawHits[0], matched: rawHits[0].matched ?? "name" }]);
      return;
    }
    let cancelled = false;
    const targets = rawHits.slice(0, MAX_ENRICH);
    const rest = rawHits.slice(MAX_ENRICH);
    Promise.allSettled(targets.map((h) => findPersonById(h.id))).then((rs) => {
      if (cancelled) return;
      const list: CandidateHit[] = targets.map((h, i) => {
        const r = rs[i];
        const p = r.status === "fulfilled" ? r.value : null;
        return {
          id: h.id,
          name: h.name,
          matched: h.matched ?? "name",
          alias: h.alias,
          dynasty: p && p[7] ? p[7] : undefined,
          indexYear: p && p[5] ? p[5] : null,
          nativePlace: p && p[8] ? p[8] : undefined,
        };
      });
      for (const h of rest) {
        list.push({ id: h.id, name: h.name, matched: h.matched ?? "name", alias: h.alias });
      }
      setCandidates(list);
    });
    return () => {
      cancelled = true;
    };
  }, [rawHits]);

  // ---------- 单命中自动选中 ----------
  useEffect(() => {
    if (selectedId !== null) return;
    if (rawHits.length !== 1) return;
    if (autoPickedFor.current === kw) return;
    autoPickedFor.current = kw;
    setSelectedId(rawHits[0].id);
  }, [rawHits, kw, selectedId]);

  // ---------- 档案加载 ----------
  useEffect(() => {
    if (selectedId === null) {
      profileReqRef.current++;
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    const myReq = ++profileReqRef.current;
    // 先清空旧档案：否则切换人物时会短暂出现「上一位人物的档案 + 新的 ID」
    setProfile(null);
    setProfileError(null);
    setProfileLoading(true);
    loadCharacterProfile(selectedId)
      .then((p) => {
        if (cancelled || myReq !== profileReqRef.current) return;
        setProfile(p);
        setProfileError(null);
        setProfileLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled || myReq !== profileReqRef.current) return;
        setProfile(null);
        setProfileError(String((e as Error)?.message || e));
        setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const distinguishers = useMemo(
    () => (candidates.length > 1 ? pickDistinguishers(candidates) : []),
    [candidates]
  );

  const handleInput = useCallback((value: string) => {
    setInputKw(value);
    // 编辑关键词即视为重新检索：立刻回到候选视图，
    // 否则会出现「上方换了词、下方还挂着上一位人物」的错乱观感
    setSelectedId(null);
  }, []);

  const backToSearch = useCallback(() => {
    autoPickedFor.current = kw;
    setSelectedId(null);
    setProfile(null);
    setProfileError(null);
  }, [kw]);

  // ---------- 降级：CBDB 全量索引不可用 ----------
  if (probe === "fallback") {
    return (
      <div id="character-dossier">
        <div
          className="card"
          style={{
            padding: 12,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--color-text-secondary)",
            borderColor: "var(--color-primary)",
          }}
        >
          CBDB 全量索引不可用，当前展示精选人物档案。全量检索、重名消歧与考据校验需要
          <code style={{ margin: "0 4px" }}>/index/cbdb</code>索引产物，部署后即可自动启用。
        </div>
        <CharacterList />
      </div>
    );
  }

  if (probe === "pending") {
    return (
      <div id="character-dossier" style={{ padding: 60, textAlign: "center", color: "var(--color-text-secondary)" }}>
        正在初始化考据工作台…
      </div>
    );
  }

  // ---------- 检索框：候选阶段与档案阶段共用 ----------
  // 选中人物后仍要保留检索框，否则想换一个人考据必须先点「返回搜索」再找输入框。
  const searchBox = (
    <div className="card" style={{ padding: 16, marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="input-text"
          value={inputKw}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="输入姓名/字号，如：蘇軾、東坡"
          aria-label="检索人物"
          style={{ maxWidth: 380, flex: "1 1 240px" }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            // 手动点检索：立即生效，不等防抖
            autoPickedFor.current = "";
            setKw(normalizeQuery(inputKw));
          }}
        >
          检索
        </button>
        {inputKw && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setInputKw("");
              setKw("");
              setSelectedId(null);
            }}
          >
            清除
          </button>
        )}
      </div>
      {meta && (
        <div className="search-stat" style={{ marginTop: 10, marginBottom: 0 }}>
          已接入 CBDB {meta.total.toLocaleString()} 位人物 · 女性 {meta.female.toLocaleString()} 位 ·{" "}
          {meta.surnameTotal.toLocaleString()} 个姓氏 · {meta.source.release_date} 版 ·{" "}
          {meta.source.license}
        </div>
      )}
    </div>
  );

  // ---------- 已选中：加载中 / 失败 / 档案 ----------
  if (selectedId !== null) {
    return (
      <div id="character-dossier">
        {searchBox}
        {profileLoading && !profile && (
          <div style={{ padding: 60, textAlign: "center", color: "var(--color-text-secondary)" }}>
            正在汇编考据档案（CBDB ID {selectedId}）…
          </div>
        )}
        {profileError && (
          <>
            <div
              className="card"
              style={{ padding: 20, marginBottom: 16, borderColor: "var(--color-primary)" }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-primary)", marginBottom: 6 }}>
                考据档案加载失败
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{profileError}</div>
            </div>
            <button className="btn btn-primary" onClick={backToSearch}>
              返回搜索
            </button>
          </>
        )}
        {profile && <CharacterProfileView profile={profile} onBack={backToSearch} />}
      </div>
    );
  }

  // ---------- 选择阶段：候选消歧 ----------
  const enriching = rawHits.length > 1 && candidates.length === 0;

  return (
    <div id="character-dossier">
      {searchBox}

      {searchError && (
        <div
          className="card"
          style={{ padding: 16, marginBottom: 16, borderColor: "var(--color-primary)", fontSize: 13 }}
        >
          <span style={{ color: "var(--color-primary)" }}>检索失败：</span>
          {searchError}
        </div>
      )}

      {searching && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>
          正在检索「{kw}」…
        </div>
      )}

      {!searching && !searchError && kw && rawHits.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">未找到匹配人物</div>
          <div>可尝试输入字号、諡號或别名（如「東坡」「六一居士」），或换用姓名的其他写法。</div>
        </div>
      )}

      {!searching && !searchError && !kw && (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <div className="empty-title">输入姓名开始考据</div>
          <div>
            支持繁简与字号检索；命中多位同名人物时，系统会按朝代、活動時段、籍贯给出区分线索。
          </div>
          <div className="empty-suggest">
            <Link href="/people">按姓氏/朝代浏览人物库</Link>
            <Link href="/relation">社会关系溯源</Link>
          </div>
        </div>
      )}

      {!searching && !searchError && enriching && (
        <div style={{ padding: 30, textAlign: "center", color: "var(--color-text-secondary)" }}>
          正在核对 {rawHits.length} 位候选的区分信息…
        </div>
      )}

      {!searching && !searchError && candidates.length > 1 && (
        <>
          <h3 className="section-title" style={{ marginTop: 0 }}>
            重名候选消歧（{candidates.length}）
          </h3>
          <div
            className="card"
            style={{ padding: 12, marginBottom: 16, fontSize: 13, color: "var(--color-text-secondary)" }}
          >
            检测到 {candidates.length} 位同名/相关人物
            {distinguishers.length > 0 ? (
              <>
                ，可按
                {distinguishers.map((d, i) => (
                  <span key={d.field}>
                    {i > 0 ? "、" : ""}
                    <strong style={{ color: "var(--color-primary)" }}>「{d.label}」</strong>
                  </span>
                ))}
                区分
              </>
            ) : null}
            ；请点击目标人物查看完整考据档案。CBDB 中重名人物极多，选错人会导致生卒、任职全盘错位。
          </div>
          <div className="character-grid">
            {candidates.map((c) => (
              <div key={c.id} className="character-card">
                <div className="char-name">
                  <span>{c.name}</span>
                  {c.matched === "alias" && c.alias && (
                    <span className="char-zi">（{c.alias}）</span>
                  )}
                </div>
                <div className="info-row" style={{ fontSize: 13 }}>
                  {distinguishers.length > 0 ? (
                    distinguishers.map((d) => (
                      <span key={d.field} className="tag" style={{ marginRight: 6, marginTop: 4 }}>
                        {d.label}：{distinguisherValue(d.field, c)}
                      </span>
                    ))
                  ) : (
                    <span className="tag">CBDB ID：{c.id}</span>
                  )}
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedId(c.id)}
                  >
                    查看考据档案
                  </button>
                  <Link className="btn btn-secondary btn-sm" href={`/people/detail?id=${c.id}`}>
                    人物库详情
                  </Link>
                </div>
                <div className="char-id">CBDB ID：{c.id}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
