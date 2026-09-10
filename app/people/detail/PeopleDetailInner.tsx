"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  findPersonById,
  formatLife,
  getPersonOffices,
  getPersonRelations,
  getPersonTexts,
  loadCbdbMeta,
  loadRelNames,
  type CbdbMeta,
  type CbdbPerson,
} from "@/lib/cbdb";

interface RelationItem {
  id: number;
  name: string;
  rel: string;
  year?: number;
}

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
        const [rel, texts, offices] = await Promise.all([
          getPersonRelations(id),
          getPersonTexts(id),
          getPersonOffices(id),
        ]);
        if (cancelled) return;
        const names = await loadRelNames();
        const decorate = (list: { id: number; rel: string; year?: number }[]): RelationItem[] =>
          list.map((r) => ({ ...r, name: names.get(r.id) || `人物 ${r.id}` }));
        setKin(decorate(rel.kin));
        setAssoc(decorate(rel.assoc));
        setTexts(texts);
        setOffices(offices);
      } catch (e) {
        if (!cancelled) setRelError(String((e as Error)?.message || e));
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}>加载人物详情...</div>;

  if (error || !person) return (
    <section style={{ padding: 40 }}>
      <h3>未找到人物</h3>
      <p style={{ color: "#c00" }}>{error}</p>
      <div style={{ marginTop: 16 }}>
        <Link href="/people" className="btn btn-secondary">返回人物库</Link>
      </div>
    </section>
  );

  const [pid, name, pinyin, birth, death, indexYear, female, dynasty, place] = person;
  const cbdbUrl = `https://cbdb.hsites.harvard.edu/cbdbapi/person.php?id=${pid}`;
  const relLoading = kin === null && assoc === null && !relError;

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link><span className="sep">/</span>
        <Link href="/people">人物库</Link><span className="sep">/</span>
        <span>{name}</span>
      </div>

      <div className="book-detail">
        <h1 className="book-detail-title">{name}</h1>
        {pinyin && <div style={{ color: "var(--color-text-secondary)", marginBottom: 8 }}>{pinyin}</div>}
        <div className="book-detail-meta">
          <span className="tag">{dynasty || "朝代未詳"}</span>
          {female === 1 && <span className="tag">女性</span>}
          {place && <span className="tag">籍贯：{place}</span>}
          <span className="tag">CBDB ID：{pid}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, margin: "20px 0" }}>
          {[
            { label: "生卒年", value: formatLife(birth, death) },
            { label: "出生年", value: birth ? (birth < 0 ? `公元前 ${-birth} 年` : `${birth} 年`) : "不详" },
            { label: "卒年", value: death ? (death < 0 ? `公元前 ${-death} 年` : `${death} 年`) : "不详" },
            { label: "指数年", value: indexYear ? `${indexYear} 年` : "不详" },
          ].map((it) => (
            <div key={it.label} className="card" style={{ padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{it.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{it.value}</div>
            </div>
          ))}
        </div>

        <div className="book-actions" style={{ marginTop: 4 }}>
          <Link href={`/search?q=${encodeURIComponent(name)}&mode=full`} className="btn btn-primary">
            在古籍中检索「{name}」
          </Link>
          <Link href={`/relation?name=${encodeURIComponent(name)}`} className="btn btn-secondary">
            关系溯源
          </Link>
          <Link href={`/search?q=${encodeURIComponent(name)}`} className="btn btn-secondary">
            检索书目
          </Link>
          <a href={cbdbUrl} target="_blank" rel="noopener" className="btn btn-secondary">
            CBDB 官方档案
          </a>
          <Link href="/people" className="btn btn-secondary">返回人物库</Link>
        </div>
      </div>

      {/* 人物关系 */}
      <h3 className="section-title" style={{ marginTop: 28 }}>生平任职（CBDB）</h3>
      {!relLoading && !relError && offices && offices.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {offices.slice(0, 60).map((o, i) => (
              <span key={i} className="tag" style={{ fontSize: 13, padding: "5px 10px" }}>
                {o.office}
                {o.appt && <span style={{ color: "var(--color-primary)" }}>（{o.appt}）</span>}
                {o.firstYear || o.lastYear ? (
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {" "}{o.firstYear ? o.firstYear : "?"}{o.lastYear && o.lastYear !== o.firstYear ? `-${o.lastYear}` : ""} 年
                  </span>
                ) : null}
              </span>
            ))}
            {offices.length > 60 && (
              <span className="tag" style={{ fontSize: 13 }}>另有 {offices.length - 60} 条，详见 CBDB</span>
            )}
          </div>
        </div>
      )}
      {!relLoading && !relError && offices && offices.length === 0 && (
        <div className="card" style={{ padding: 14, marginBottom: 20, color: "var(--color-text-secondary)", fontSize: 13 }}>
          CBDB 暂无此人任职记录
        </div>
      )}

      <h3 className="section-title">人物关系（CBDB）</h3>
      {relLoading && <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--color-text-secondary)" }}>加载关系中...</div>}
      {relError && <div className="card" style={{ padding: 16, color: "#c00", fontSize: 14 }}>关系加载失败：{relError}</div>}
      {!relLoading && !relError && (kin?.length === 0) && (assoc?.length === 0) && (texts?.length === 0) && (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--color-text-secondary)" }}>
          CBDB 暂无此人的亲属/社会关系与著作记录
        </div>
      )}

      <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
        {kin && kin.length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ margin: "0 0 10px" }}>亲属关系（{kin.length}）</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {kin.slice(0, 60).map((r) => (
                <Link
                  key={`k-${r.id}`}
                  href={`/people/detail?id=${r.id}`}
                  className="tag"
                  style={{ textDecoration: "none", padding: "5px 10px", fontSize: 13 }}
                >
                  {r.name}（{r.rel}）
                </Link>
              ))}
              {kin.length > 60 && (
                <span className="tag" style={{ fontSize: 13 }}>另有 {kin.length - 60} 位，详见 CBDB</span>
              )}
            </div>
          </div>
        )}

        {assoc && assoc.length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ margin: "0 0 10px" }}>社会关系（{assoc.length}）</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {assoc.slice(0, 60).map((r) => (
                <Link
                  key={`a-${r.id}`}
                  href={`/people/detail?id=${r.id}`}
                  className="tag"
                  style={{ textDecoration: "none", padding: "5px 10px", fontSize: 13 }}
                >
                  {r.name}（{r.rel}{r.year ? `，${r.year} 年` : ""}）
                </Link>
              ))}
              {assoc.length > 60 && (
                <span className="tag" style={{ fontSize: 13 }}>另有 {assoc.length - 60} 条，详见 CBDB</span>
              )}
            </div>
          </div>
        )}

        {texts && texts.length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ margin: "0 0 10px" }}>著作与文献（{texts.length}）</h4>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.9 }}>
              {texts.slice(0, 40).map((t, i) => (
                <li key={i}>
                  {t.title}
                  {t.role && <span className="tag" style={{ marginLeft: 8, fontSize: 12 }}>{t.role}</span>}
                  {t.year ? <span style={{ color: "var(--color-text-secondary)", marginLeft: 6, fontSize: 13 }}>{t.year} 年</span> : null}
                  {" "}
                  <Link
                    href={`/search?q=${encodeURIComponent(t.title.split(":")[0].trim())}&mode=title`}
                    style={{ fontSize: 12, color: "var(--color-primary)", textDecoration: "none" }}
                  >
                    在馆藏检索
                  </Link>
                </li>
              ))}
              {texts.length > 40 && <li style={{ color: "var(--color-text-secondary)" }}>另有 {texts.length - 40} 条，详见 CBDB</li>}
            </ul>
          </div>
        )}
      </div>

      {/* 数据说明 */}
      <div className="card" style={{ marginTop: 24, padding: 16, fontSize: 13, color: "var(--color-text-secondary)" }}>
        <strong>数据说明</strong>：本页数据来自 {meta?.source.name || "CBDB 中国历代人物传记资料库"}（{meta?.source.release_date || ""} 版，
        {meta?.source.license || ""}），字段含姓名、拼音、生卒年、指数年（CBDB 推算的基准年）、性别、朝代、籍贯/主要活动地。
        指数年为 CBDB 依据人物生平信息推算的编年基准，并非真实出生年。亲属/社会关系、任职与著作分别来自 CBDB 的
        KIN_DATA、ASSOC_DATA、POSTED_TO_OFFICE_DATA、BIOG_TEXT_DATA 表，均为 CBDB 原始口径；「在馆藏检索」仅在
        本站古籍书目中查找同名著作，不代表 CBDB 确认两者为同一版本。
      </div>
    </section>
  );
}
