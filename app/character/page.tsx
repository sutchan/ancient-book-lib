import type { Metadata } from "next";
import Link from "next/link";
import data from "@/lib/data-generated";

export const metadata: Metadata = {
  title: "人物考据｜古籍通 AncientBook",
  description: "古籍通历史人物考据档案：字、号、籍贯、生卒、官职、著作与史料出处。",
};

export default function CharacterPage() {
  const dynasties = Array.from(new Set(data.characters.map((c) => c.dynasty)));

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>人物考据</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>人物考据档案</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        共收录 {data.characters.length} 位历史人物 · 朝代筛选 · 史料溯源
      </p>

      <div className="filter-panel">
        <Link className="tag tag-active" href="/character">全部</Link>
        {dynasties.map((d) => (
          <Link key={d} className="tag" href={`/character?dynasty=${encodeURIComponent(d)}`}>
            {d}
          </Link>
        ))}
      </div>

      <div className="category-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
        {data.characters.map((c) => (
          <div className="character-card" key={c.id}>
            <div className="char-name">
              {c.name}
              <span className="char-zi">字 {c.zi}</span>
            </div>
            <div className="info-row">
              {c.alias && (
                <div><label>号</label> {c.alias}</div>
              )}
              <div><label>朝代</label> {c.dynasty} · {c.native}</div>
              <div><label>生卒</label> {c.birth} — {c.death}</div>
              {c.office && <div><label>官职</label> {c.office}</div>}
              <div><label>著作</label> {c.books.join("、")}</div>
              <div style={{ marginTop: 8 }}>
                {(c.tags || []).map((t) => (
                  <span className="tag" key={t} style={{ marginRight: 6 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
