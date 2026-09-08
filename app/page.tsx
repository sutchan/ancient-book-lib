import Link from "next/link";
import data from "@/lib/data-generated";
import { toSimplified } from "@/lib/t2s";
import RecentBooks from "@/components/RecentBooks";

export default function HomePage() {
  return (
    <section>
      <div className="home-hero">
        <h1 className="hero-title">古籍通</h1>
        <p className="hero-sub">
          开源公益古籍检索阅读与考据平台 · 殆知阁 v20 全量 <strong>15,694</strong> 部古籍在线
        </p>
        <p className="hero-badge">原始数据 4.9GB 托管于上游仓库 · 本仓库零复制 · 阅读时按需加载</p>
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
          <Link href="/book-list" className="btn btn-secondary" style={{ fontSize: 14 }}>
            ⭐ 精选典籍（45 部核心）
          </Link>
        </div>
      </div>

      <RecentBooks />

      <h2 className="section-title">十大馆藏</h2>
      <div className="category-grid">
        {data.categories.map((c) => (
          <Link key={c.id} href={`/catalog?category=${encodeURIComponent(c.name)}`} className="card category-card">
            <div className="cat-icon">{c.icon}</div>
            <div className="cat-name">{c.name}</div>
            <div className="cat-desc">{c.desc}</div>
          </Link>
        ))}
      </div>

      <h2 className="section-title">学术工具</h2>
      <div className="category-grid">
        <Link href="/character" className="card category-card">
          <div className="cat-icon">考</div>
          <div className="cat-name">人物考据</div>
          <div className="cat-desc">历史人物档案与史料聚合</div>
        </Link>
        <Link href="/relation" className="card category-card">
          <div className="cat-icon">系</div>
          <div className="cat-name">社会关系溯源</div>
          <div className="cat-desc">人物多维关系与双人溯源</div>
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
