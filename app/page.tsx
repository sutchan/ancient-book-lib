// app/page.tsx v1.4.3
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { toSimplified } from "@/lib/t2s";
import RecentBooks from "@/components/RecentBooks";
import RandomBook from "@/components/RandomBook";
import RandomCharacter from "@/components/RandomCharacter";

export default function HomePage() {
  return (
    <section>
      <div className="home-hero">
        <h1 className="hero-title">古籍通</h1>
        <p className="hero-sub">
          开源公益古籍检索阅读与考据平台 · 殆知阁 v20 全量 <strong>15,694</strong> 部古籍在线
        </p>
        <p className="hero-badge">原始数据 4.9GB 托管于上游仓库 · 本仓库零复制 · 阅读时按需加载</p>
        <p style={{ marginTop: 6, fontSize: 13, color: "var(--color-text-secondary)" }}>
          全馆藏 15,694 部支持书目检索与原文按需阅读
        </p>
        <form className="search-box hero-search" action="/search" method="get">
          <input
            className="input-text"
            name="q"
            placeholder="检索古籍书名、内容、人物"
            aria-label="检索关键词"
            defaultValue=""
          />
          <span className="search-mode-group" role="radiogroup" aria-label="检索模式">
            <label className="btn-toggle">
              <input type="radio" name="mode" value="full" defaultChecked />
              <span>{toSimplified("全文")}</span>
            </label>
            <label className="btn-toggle">
              <input type="radio" name="mode" value="title" />
              <span>{toSimplified("标题")}</span>
            </label>
          </span>
          <button className="btn btn-primary search-btn" type="submit">
            搜索
          </button>
        </form>
        <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/catalog" className="btn btn-secondary" style={{ fontSize: 14 }}>
            📚 浏览全馆藏（15,694 部）
          </Link>
          <Link href="/people" className="btn btn-secondary" style={{ fontSize: 14 }}>
            🧑 人物库（661,350 人）
          </Link>
        </div>
      </div>

      <RecentBooks />

      <section id="fun-explore">
        <h2 className="section-title">趣味探索</h2>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginTop: -8, marginBottom: 16 }}>
          不知道读什么？随手翻开一卷，遇见一位古人。
        </p>
        <div className="fun-grid">
          <RandomBook />
          <RandomCharacter />
        </div>
      </section>

      <h2 className="section-title">十大馆藏</h2>
      <div className="category-grid">
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={`/catalog?category=${encodeURIComponent(c.name)}`} className="card category-card">
            <div className="cat-icon">{c.icon}</div>
            <div className="cat-name">{c.name}</div>
            <div className="cat-desc">{c.desc}</div>
          </Link>
        ))}
      </div>

      <h2 className="section-title">学术工具</h2>
      <div className="category-grid">
        <Link href="/people" className="card category-card">
          <div className="cat-icon">人</div>
          <div className="cat-name">人物库</div>
          <div className="cat-desc">CBDB 历代人物传记：661,350 人按姓氏/朝代检索</div>
        </Link>
        <Link href="/character" className="card category-card">
          <div className="cat-icon">考</div>
          <div className="cat-name">人物考据</div>
          <div className="cat-desc">精选人物档案与史料聚合</div>
        </Link>
        <Link href="/relation" className="card category-card">
          <div className="cat-icon">系</div>
          <div className="cat-name">社会关系溯源</div>
          <div className="cat-desc">人物多维关系与双人溯源（数据待接入）</div>
        </Link>
        <Link href="/stats" className="card category-card">
          <div className="cat-icon">统</div>
          <div className="cat-name">数据统计</div>
          <div className="cat-desc">馆藏规模与学术价值分析</div>
        </Link>
      </div>
    </section>
  );
}
