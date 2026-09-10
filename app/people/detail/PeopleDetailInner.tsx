"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { findPersonById, formatLife, type CbdbMeta, type CbdbPerson } from "@/lib/cbdb";
import { loadCbdbMeta } from "@/lib/cbdb";

export default function PeopleDetailInner() {
  const params = useSearchParams();
  const id = Number(params.get("id") || 0);
  const [person, setPerson] = useState<CbdbPerson | null>(null);
  const [meta, setMeta] = useState<CbdbMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
          <Link href={`/search?q=${encodeURIComponent(name)}`} className="btn btn-secondary">
            检索书目
          </Link>
          <a href={cbdbUrl} target="_blank" rel="noopener" className="btn btn-secondary">
            CBDB 官方档案
          </a>
          <Link href="/people" className="btn btn-secondary">返回人物库</Link>
        </div>
      </div>

      {/* 数据说明 */}
      <div className="card" style={{ marginTop: 24, padding: 16, fontSize: 13, color: "var(--color-text-secondary)" }}>
        <strong>数据说明</strong>：本页数据来自 {meta?.source.name || "CBDB 中国历代人物传记资料库"}（{meta?.source.release_date || ""} 版，
        {meta?.source.license || ""}），字段含姓名、拼音、生卒年、指数年（CBDB 推算的基准年）、性别、朝代、籍贯/主要活动地。
        指数年为 CBDB 依据人物生平信息推算的编年基准，并非真实出生年。
      </div>
    </section>
  );
}
