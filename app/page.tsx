import Link from "next/link";
import data from "@/lib/data-generated";

export default function HomePage() {
  return (
    <section>
      <div className="home-hero">
        <h1 className="hero-title">古籍通</h1>
        <p className="hero-sub">
          开源公益古籍检索阅读与考据平台 · 十大馆藏 {data.books.length}+ 典籍全文在线
        </p>
        <div className="search-box hero-search">
          <input
            className="input-text"
            name="q"
            placeholder="检索古籍书名、内容、人物"
            aria-label="检索关键词"
          />
          <Link className="btn btn-primary search-btn" href="/search" prefetch>
            搜索
          </Link>
        </div>
      </div>

      <h2 className="section-title">十大馆藏</h2>
      <div className="category-grid">
        {data.categories.map((c) => (
          <Link key={c.id} href={`/category/${c.id}`} className="card category-card">
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
