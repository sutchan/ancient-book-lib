// app/people/detail/PeopleDetailInner.tsx v1.15.8
"use client";

/**
 * 人物详情（编排层）：数据加载与状态在此，
 * 头部/CV 区块/关系区块拆分于 PersonHead.tsx、PersonCvSections.tsx、PersonRelations.tsx。
 * 行为与拆分前一致。
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PersonTimeline from "@/components/PersonTimeline";
import {
  findPersonById,
  getPersonAltnames,
  getPersonEntries,
  getPersonOffices,
  getPersonRelations,
  getPersonSources,
  getPersonTexts,
  loadCbdbMeta,
  loadRelNames,
  type CbdbMeta,
  type CbdbPerson,
} from "@/lib/cbdb";
import { PersonHead } from "./PersonHead";
import { AltNamesSection, EntriesSection, SourcesSection, OfficesSection } from "./PersonCvSections";
import { PersonRelations } from "./PersonRelations";
import type { RelationItem } from "./personTypes";

export default function PeopleDetailInner() {
  const params = useSearchParams();
  const id = Number(params.get("id") || 0);
  const [person, setPerson] = useState<CbdbPerson | null>(null);
  const [meta, setMeta] = useState<CbdbMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [kin, setKin] = useState<RelationItem[] | null>(null);
  const [assoc, setAssoc] = useState<RelationItem[] | null>(null);
  const [texts, setTexts] = useState<{ title: string; role: string; year: number }[] | null>(null);
  const [offices, setOffices] = useState<{ office: string; firstYear: number; lastYear: number; appt: string }[] | null>(null);
  const [altnames, setAltnames] = useState<{ name: string; type: string }[] | null>(null);
  const [entries, setEntries] = useState<{ entry: string; year: number; rank: string }[] | null>(null);
  const [sources, setSources] = useState<string[] | null>(null);
  const [relError, setRelError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("缺少人物 ID");
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([findPersonById(id), loadCbdbMeta().catch(() => null)])
      .then(([p, m]) => {
        if (cancelled) return;
        setPerson(p);
        setMeta(m);
        if (!p) setError(`未找到 CBDB ID ${id} 对应的人物`);
      })
      .catch((e) => setError(String(e?.message || e)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  // 加载关系与著作（独立于基本信息，失败不影响主信息展示）
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [rel, texts, offices, altnames, entries, sources] = await Promise.all([
          getPersonRelations(id),
          getPersonTexts(id),
          getPersonOffices(id),
          getPersonAltnames(id),
          getPersonEntries(id),
          getPersonSources(id),
        ]);
        if (cancelled) return;
        const names = await loadRelNames();
        const decorate = (list: { id: number; rel: string; year?: number }[]): RelationItem[] =>
          list.map((r) => ({ ...r, name: names.get(r.id) || `人物 ${r.id}` }));
        setKin(decorate(rel.kin));
        setAssoc(decorate(rel.assoc));
        setTexts(texts);
        setOffices(offices);
        setAltnames(altnames);
        setEntries(entries);
        setSources(sources);
      } catch (e) {
        if (!cancelled) setRelError(String((e as Error)?.message || e));
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}>加载人物详情...</div>;

  if (error || !person) return (
    <section style={{ padding: 40 }} id="person-not-found">
      <h3>未找到人物</h3>
      <p style={{ color: "#c00" }}>{error}</p>
      <div style={{ marginTop: 16 }}>
        <Link href="/people" className="btn btn-secondary">返回人物库</Link>
      </div>
    </section>
  );

  const [pid, name, pinyin, birth, death, indexYear, female, dynasty, place] = person;
  const relLoading = kin === null && assoc === null && !relError;
  const cvReady = !relLoading && !relError;

  return (
    <section id="people-detail-main">
      <div className="breadcrumb">
        <Link href="/">首页</Link><span className="sep">/</span>
        <Link href="/people">人物库</Link><span className="sep">/</span>
        <span>{name}</span>
      </div>

      <PersonHead
        name={name}
        pinyin={pinyin}
        dynasty={dynasty}
        female={female}
        place={place}
        birth={birth}
        death={death}
        indexYear={indexYear}
        pid={pid}
      />

      {/* 字/号/别名 */}
      {cvReady && altnames && altnames.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: 28 }}>字/號/別名（CBDB）</h3>
          <AltNamesSection items={altnames} />
        </>
      )}

      {/* 科舉/入仕 */}
      {cvReady && entries && entries.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: 28 }}>科舉/入仕（CBDB）</h3>
          <EntriesSection items={entries} />
        </>
      )}

      {/* 史料來源 */}
      {cvReady && sources && sources.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: 28 }}>史料來源（CBDB 主要来源）</h3>
          <SourcesSection items={sources} />
        </>
      )}

      {/* 生命时间轴（生卒年 + 科举年份 + 任职年份） */}
      {cvReady && (
        <PersonTimeline
          name={name}
          birth={birth}
          death={death}
          entries={(entries ?? []).map((e) => ({ entry: e.entry, year: e.year }))}
          offices={(offices ?? []).map((o) => ({ office: o.office, firstYear: o.firstYear, lastYear: o.lastYear }))}
        />
      )}

      {/* 生平任职 */}
      <h3 className="section-title" style={{ marginTop: 28 }}>生平任职（CBDB）</h3>
      {cvReady && offices && <OfficesSection items={offices} />}

      <PersonRelations
        personName={name}
        relLoading={relLoading}
        relError={relError}
        kin={kin}
        assoc={assoc}
        texts={texts}
      />

      {/* 数据说明 */}
      <div className="card" style={{ marginTop: 24, padding: 16, fontSize: 13, color: "var(--color-text-secondary)" }} id="person-data-note">
        <strong>数据说明</strong>：本页数据来自 {meta?.source.name || "CBDB 中国历代人物传记资料库"}（{meta?.source.release_date || ""} 版，
        {meta?.source.license || ""}），字段含姓名、拼音、生卒年、指数年（CBDB 推算的基准年）、性别、朝代、籍贯/主要活动地。
        指数年为 CBDB 依据人物生平信息推算的编年基准，并非真实出生年。        字/號/別名（163,634 条）、科舉/入仕（26.5 万条，
        登科方式如「進士」「鄉貢舉人」及制舉科目）、史料來源（主要来源书目）、亲属/社会关系、任职与著作等维度均来自 CBDB 原始数据；「在馆藏检索」仅在本站古籍书目中查找同名著作，不代表 CBDB 确认两者为同一版本。
      </div>
    </section>
  );
}
