// components/Footer.tsx v1.4.3
import Link from "next/link";

// 应用版本单一来源为 package.json，构建时由 Next.js 内联该环境变量。
const APP_VERSION = process.env.npm_package_version || "1.4.3";

// 真实馆藏总数（与 daizhige-catalog.json 同步；上游 garychowcmu/daizhigev20 15,694 部）
const TOTAL_BOOKS = 15694;

export default function Footer() {
  return (
    <footer className="footer" id="site-footer">
      <div className="footer-inner">
        <div className="foot-links">
          <Link href="/license">开源协议</Link>
          <Link href="/data-source">数据来源</Link>
          <Link href="/disclaimer">免责声明</Link>
          <Link href="/feedback">反馈渠道</Link>
          <Link href="/stats">数据统计</Link>
        </div>
        <p>
          资源下载公示：全站古籍均可在书籍页/馆藏页按章、按本、按馆藏下载；统一解压密码与备用网盘链接将于全量数据发布时公示。
        </p>
        <p>古籍通 AncientBook · 开源公益古籍阅读与考据平台 | 数据仅供学术参考</p>
        <p className="footer-stats">
          馆藏 10 类 · 全馆藏 {TOTAL_BOOKS.toLocaleString()} 部（殆知阁 v20）· 人物/关系 待接入
        </p>
        <p className="footer-version">
          当前版本 v{APP_VERSION}
        </p>
      </div>
    </footer>
  );
}
