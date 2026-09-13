// app/people/detail/PersonHead.tsx v1.15.8
import Link from "next/link";
import { formatLife } from "@/lib/cbdb";

/** 人物详情头部：姓名/标签/生卒年卡片/操作按钮，从 PeopleDetailInner.tsx 拆出 */
export function PersonHead({
  name,
  pinyin,
  dynasty,
  female,
  place,
  birth,
  death,
  indexYear,
  pid,
}: {
  name: string;
  pinyin: string;
  dynasty: string;
  female: 0 | 1;
  place: string;
  birth: number;
  death: number;
  indexYear: number;
  pid: number;
}) {
  const cbdbUrl = `https://cbdb.hsites.harvard.edu/cbdbapi/person.php?id=${pid}`;
  return (
    <div className="book-detail" id="person-head">
      <h1 className="book-detail-title">{name}</h1>
      {pinyin && <div style={{ color: "var(--color-text-secondary)", marginBottom: 8 }}>{pinyin}</div>}
      <div className="book-detail-meta">
        <span className="tag">{dynasty || "朝代未詳"}</span>
        {female === 1 && <span className="tag">女性</span>}
        {place && <span className="tag">籍贯：{place}</span>}
        <span className="tag">CBDB ID：{pid}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, margin: "20px 0" }} id="person-year-grid">
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

      <div className="book-actions" style={{ marginTop: 4 }} id="person-actions">
        <Link href={`/search?q=${encodeURIComponent(name)}&mode=full`} className="btn btn-primary">
          在古籍中检索「{name}」
        </Link>
        {/* 传 CBDB 权威 ID 而非姓名：CBDB 同名者众多，按姓名回流会被解析成「首个命中」 */}
        <Link href={`/relation?id=${pid}`} className="btn btn-secondary">
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
  );
}
