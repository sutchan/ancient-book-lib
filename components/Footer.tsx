// components/Footer.tsx v1.0.3
import Link from "next/link";
import data from "@/lib/data-generated";

// 应用版本单一来源为 package.json，构建时由 Next.js 内联该环境变量。
const APP_VERSION = process.env.npm_package_version || "1.0.3";

// 构建时由数据源实时统计，避免硬编码。
const stats = {
  categories: data.categories.length,
  books: data.books.length,
  characters: data.characters.length,
  relations: data.relations.length,
};

export default function Footer() {
  return (
    <footer className="footer" id="site-footer">
      <div className="footer-inner">
        <div className="foot-links">
          <Link href="/help">开源协议</Link>
          <Link href="/help">数据来源</Link>
          <Link href="/help">免责声明</Link>
          <Link href="/help">反馈渠道</Link>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 8 }}>
          资源下载公示：全站古籍均可在书籍页/馆藏页按章、按本、按馆藏下载；统一解压密码与备用网盘链接将于全量数据发布时公示。
        </p>
        <p>古籍通 AncientBook · 开源公益古籍阅读与考据平台 | 数据仅供学术参考</p>
        <p className="footer-stats" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 8 }}>
          馆藏 {stats.categories} 类 · 精选典籍 {stats.books} 部 · 全馆藏 15,694 部（殆知阁 v20）· 人物 {stats.characters} 位 · 考据关系 {stats.relations} 条
        </p>
        <p className="footer-version" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
          当前版本 v{APP_VERSION}
        </p>
      </div>
    </footer>
  );
}
