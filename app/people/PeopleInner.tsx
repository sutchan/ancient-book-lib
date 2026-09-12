"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  loadCbdbMeta,
  loadSurnamePersons,
  searchPersons,
  formatLife,
  type CbdbMeta,
  type CbdbPerson,
} from "@/lib/cbdb";

const PAGE_SIZE = 50;
const SEARCH_LIMIT = 100; // 人名搜索单次取数上限，超出时提示细化关键词

export default function PeopleInner() {
  const params = useSearchParams();
  const [meta, setMeta] = useState<CbdbMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [surname, setSurname] = useState(params.get("surname") || "");
  const [dynasty, setDynasty] = useState(params.get("dynasty") || "");
  const [inputKw, setInputKw] = useState(params.get("q") || "");
  const [kw, setKw] = useState(params.get("q") || "");
  const [persons, setPersons] = useState<CbdbPerson[]>([]);
  const [searchResults, setSearchResults] = useState<{ id: number; name: string; matched?: "name" | "alias"; alias?: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadCbdbMeta().then(setMeta).catch((e) => setError(String(e)));
  }, []);

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
        const filtered = dynasty ? list.filter((p) => p[7] === dynasty) : list;
        setPersons(filtered);
        setPage(1);
      })
      .catch((e) => setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [meta, surname, dynasty, kw]);

  const paged = useMemo(() => {
    const list = searchResults
      ? searchResults
      : persons.map((p) => ({ id: p[0], name: p[1], person: p }));
    return list;
  }, [searchResults, persons]);

  const totalPages = Math.ceil(paged.length / PAGE_SIZE);
  const pageItems = paged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (error) return <div style={{ padding: 40, color: "#c00" }}>加载失败：{error}</div>;
  if (!meta) return <div style={{ padding: 60, textAlign: "center" }}>正在加载 661,350 位人物索引...</div>;

  const topDynasties = meta.dynasty.slice(0, 12);

  return (
    <section>
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

      {/* 搜索框 */}
      <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="input-text"
          value={inputKw}
          onChange={(e) => setInputKw(e.target.value)}
          placeholder="搜索人名，如：苏轼、李白、朱熹"
          style={{ maxWidth: 360 }}
        />
        {kw && (
          <button className="btn btn-secondary" onClick={() => { setInputKw(""); setKw(""); }}>
            清除
          </button>
        )}
      </div>

      {/* 朝代筛选（仅浏览模式生效：搜索结果来自人名索引，不携带朝代字段） */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8 }}>
          {kw
            ? "搜索结果不支持朝代筛选（结果来自人名索引，不含朝代字段）；清除关键词后可按朝代浏览"
            : `按朝代筛选（前 12 个朝代 · 共 ${meta.dynasty.length} 个）`}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, opacity: kw ? 0.5 : 1 }}>
          <button
            className={`btn ${!dynasty ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 13, padding: "4px 10px" }}
            disabled={!!kw}
            onClick={() => setDynasty("")}
          >全部</button>
          {topDynasties.map((d) => (
            <button
              key={d.dynasty}
              className={`btn ${dynasty === d.dynasty ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: 13, padding: "4px 10px" }}
              disabled={!!kw}
              onClick={() => { setDynasty(d.dynasty); setSurname(params.get("surname") || surname); }}
            >
              {d.dynasty}（{d.count.toLocaleString()}）
            </button>
          ))}
        </div>
      </div>

      {/* 姓氏选择（仅浏览模式） */}
      {!kw && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8 }}>
            按姓氏浏览（前 60 个 · 共 {meta.surnameTotal} 个）
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {meta.surnames.slice(0, 60).map((s) => (
              <button
                key={s.surname}
                className={`btn ${surname === s.surname ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: 13, padding: "4px 10px" }}
                onClick={() => { setSurname(s.surname); }}
              >
                {s.surname}（{s.count.toLocaleString()}）
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 结果统计 */}
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 12 }}>
        {kw
          ? `“${kw}” 共匹配 ${searchResults ? searchResults.length : "..."} 位人物${
              searchResults && searchResults.length >= SEARCH_LIMIT
                ? `（仅显示前 ${SEARCH_LIMIT} 位，请细化关键词）`
                : ""
            }`
          : surname
            ? `${surname}姓${dynasty ? `（${dynasty}）` : ""}共 ${persons.length.toLocaleString()} 位人物`
            : "请选择姓氏或输入人名搜索"}
      </div>

      {/* 人物列表 */}
      {loading && <div style={{ padding: 40, textAlign: "center" }}>加载中...</div>}
      {!loading && pageItems.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>
          {kw ? "未找到匹配人物，可尝试输入姓名中的任意字" : "请选择姓氏开始浏览"}
        </div>
      )}

      {!loading && pageItems.length > 0 && (
        <>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {pageItems.map((item, i) => {
              const person = (item as any).person as CbdbPerson | undefined;
              const id = item.id;
              const name = item.name;
              return (
                <Link
                  key={id}
                  href={`/people/detail?id=${id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 16px",
                    borderBottom: i < pageItems.length - 1 ? "1px solid var(--color-border)" : "none",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span style={{ fontWeight: 600, width: 132, fontSize: 15 }}>
                    {name}
                    {(item as any).matched === "alias" && (item as any).alias && (
                      <span
                        style={{
                          fontWeight: 400,
                          fontSize: 12,
                          color: "var(--color-text-secondary)",
                          marginLeft: 4,
                        }}
                      >
                        （{(item as any).alias}）
                      </span>
                    )}
                  </span>
                  {person && (
                    <>
                      <span className="tag">{person[7] || "朝代未詳"}</span>
                      {person[6] === 1 && <span className="tag">女</span>}
                      <span style={{ flex: 1, fontSize: 13, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {person[8] ? `籍贯：${person[8]}` : ""}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                        {person[3] || person[4] ? formatLife(person[3], person[4]) : person[5] ? `指数年 ${person[5]}` : ""}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20 }}>
              <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)} style={{ fontSize: 13 }}>上一页</button>
              <span style={{ fontSize: 13 }}>第 {page} / {totalPages} 页</span>
              <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ fontSize: 13 }}>下一页</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
