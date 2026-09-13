// app/people/PeopleInner.tsx v1.15.8
"use client";

/**
 * 人物库（编排层）：状态、URL 同步与数据加载在此，
 * 筛选区/结果区拆分于 peopleFilters.tsx 与 peopleList.tsx。行为与拆分前一致。
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loadCbdbMeta,
  loadSurnamePersons,
  searchPersons,
  type CbdbMeta,
  type CbdbPerson,
} from "@/lib/cbdb";
import {
  PeopleSearchBox,
  DynastyFilter,
  GenderFilter,
  SurnameFilter,
} from "./peopleFilters";
import {
  PeopleResultSummary,
  PersonList,
  PeoplePagination,
  type PersonListItem,
} from "./peopleList";

const PAGE_SIZE = 50;
const SEARCH_LIMIT = 100; // 人名搜索单次取数上限，超出时提示细化关键词

export default function PeopleInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [meta, setMeta] = useState<CbdbMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [surname, setSurname] = useState(params.get("surname") || "");
  const [dynasty, setDynasty] = useState(params.get("dynasty") || "");
  const [femaleOnly, setFemaleOnly] = useState(params.get("female") === "1");
  const [surnameKw, setSurnameKw] = useState("");
  const [showAllSurnames, setShowAllSurnames] = useState(false);
  const [inputKw, setInputKw] = useState(params.get("q") || "");
  const [kw, setKw] = useState(params.get("q") || "");
  const [persons, setPersons] = useState<CbdbPerson[]>([]);
  const [searchResults, setSearchResults] = useState<PersonListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(() => {
    const p = Number(params.get("page"));
    return Number.isFinite(p) && p >= 1 ? Math.floor(p) : 1;
  });

  useEffect(() => {
    loadCbdbMeta().then(setMeta).catch((e) => setError(String(e)));
  }, []);

  // 浏览器前进/后退时：URL → state 同步（与下面的 state → URL 互相幂等，不会循环）
  useEffect(() => {
    const s = params.get("surname") || "";
    const d = params.get("dynasty") || "";
    const f = params.get("female") === "1";
    const q = params.get("q") || "";
    const p = Math.max(1, Math.floor(Number(params.get("page")) || 1));
    if (s !== surname) setSurname(s);
    if (d !== dynasty) setDynasty(d);
    if (f !== femaleOnly) setFemaleOnly(f);
    if (q !== kw) {
      setInputKw(q);
      setKw(q);
    }
    if (p !== page) setPage(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // 浏览/搜索状态同步到 URL（支持分享链接与浏览器前进后退）
  useEffect(() => {
    const qs = new URLSearchParams();
    if (surname) qs.set("surname", surname);
    if (dynasty) qs.set("dynasty", dynasty);
    if (femaleOnly) qs.set("female", "1");
    if (kw) qs.set("q", kw);
    if (page > 1) qs.set("page", String(page));
    const s = qs.toString();
    router.replace(s ? `/people?${s}` : "/people", { scroll: false });
  }, [surname, dynasty, femaleOnly, kw, page, router]);

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setKw(inputKw), 300);
    return () => clearTimeout(t);
  }, [inputKw]);

  // 搜索模式：输入关键词时走姓名索引，否则按姓氏浏览
  useEffect(() => {
    if (!kw.trim()) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    searchPersons(kw.trim(), SEARCH_LIMIT).then((r) => {
      if (!cancelled) {
        setSearchResults(r);
        setPage(1);
      }
    });
    return () => { cancelled = true; };
  }, [kw]);

  // 按姓氏浏览
  useEffect(() => {
    if (!meta || kw.trim()) return;
    if (!surname) {
      setPersons([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadSurnamePersons(meta, surname)
      .then((list) => {
        if (cancelled) return;
        let filtered = dynasty ? list.filter((p) => p[7] === dynasty) : list;
        if (femaleOnly) filtered = filtered.filter((p) => p[6] === 1);
        setPersons(filtered);
        setPage(1);
      })
      .catch((e) => setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [meta, surname, dynasty, femaleOnly, kw]);

  const paged = useMemo<PersonListItem[]>(
    () => (searchResults ? searchResults : persons.map((p) => ({ id: p[0], name: p[1], person: p }))),
    [searchResults, persons]
  );

  const totalPages = Math.ceil(paged.length / PAGE_SIZE);
  const pageItems = paged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (error) return <div style={{ padding: 40, color: "#c00" }}>加载失败：{error}</div>;
  if (!meta) return <div style={{ padding: 60, textAlign: "center" }}>正在加载 661,350 位人物索引...</div>;

  const summaryText = kw
    ? `“${kw}” 共匹配 ${searchResults ? searchResults.length : "..."} 位人物${
        searchResults && searchResults.length >= SEARCH_LIMIT
          ? `（仅显示前 ${SEARCH_LIMIT} 位，请细化关键词）`
          : ""
      }`
    : surname
      ? `${surname}姓${dynasty ? `（${dynasty}）` : ""}共 ${persons.length.toLocaleString()} 位人物`
      : "请选择姓氏或输入人名搜索";

  return (
    <section id="people-main">
      <div className="breadcrumb">
        <Link href="/">首页</Link><span className="sep">/</span><span>人物库</span>
      </div>

      <h2 style={{ marginBottom: 4 }}>人物库（CBDB 中国历代人物传记）</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 16, fontSize: 14 }}>
        共 <strong>{meta.total.toLocaleString()}</strong> 位历史人物 · 女性 {meta.female.toLocaleString()} 位 ·
        {meta.surnameTotal.toLocaleString()} 个姓氏 ·
        数据来源 <a href={meta.source.url} target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>{meta.source.name}</a>
        （{meta.source.release_date} 版）· {meta.source.license}
      </p>

      <PeopleSearchBox
        value={inputKw}
        active={!!kw}
        onChange={setInputKw}
        onClear={() => { setInputKw(""); setKw(""); }}
      />

      {/* 朝代筛选（仅浏览模式生效：搜索结果来自人名索引，不携带朝代字段） */}
      <DynastyFilter
        dynasties={meta.dynasty.slice(0, 12)}
        value={dynasty}
        totalCount={meta.dynasty.length}
        active={!!kw}
        onSelect={(d) => { setDynasty(d); setSurname(params.get("surname") || surname); }}
      />

      {/* 性别筛选（仅浏览模式） */}
      {!kw && (
        <GenderFilter checked={femaleOnly} onChange={setFemaleOnly} femaleTotal={meta.female} />
      )}

      {/* 姓氏选择（仅浏览模式） */}
      {!kw && (
        <SurnameFilter
          meta={meta}
          surname={surname}
          onSurname={setSurname}
          surnameKw={surnameKw}
          onSurnameKw={setSurnameKw}
          showAll={showAllSurnames}
          onToggleShowAll={() => setShowAllSurnames(!showAllSurnames)}
        />
      )}

      <PeopleResultSummary text={summaryText} />

      {loading && <div style={{ padding: 40, textAlign: "center" }}>加载中...</div>}
      {!loading && pageItems.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>
          {kw ? "未找到匹配人物，可尝试输入姓名中的任意字" : "请选择姓氏开始浏览"}
        </div>
      )}

      {!loading && pageItems.length > 0 && (
        <>
          <PersonList items={pageItems} />
          <PeoplePagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </section>
  );
}
