// components/Footer.tsx v1.4.4
import Link from "next/link";
import EasterEgg from "@/components/EasterEgg";


// 真实馆藏总数（与 daizhige-catalog.json 同步；上游 garychowcmu/daizhigev20 15,694 部）
const TOTAL_BOOKS = 15694;
// 真实人物总数（与 cbdb meta.json 同步；CBDB 2026-09-05 版 661,350 人）
const TOTAL_PEOPLE = 661350;

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
          <Link href="/people">人物库</Link>
        </div>
        <p>
          资源下载公示：全站古籍均可在书籍页/馆藏页按章、按本、按馆藏下载；统一解压密码与备用网盘链接将于全量数据发布时公示。
        </p>
        <p>古籍通 AncientBook · 开源公益古籍阅读与考据平台 | 数据仅供学术参考</p>
        <p
          className="footer-stats"
          title="悄悄说：连续点我几下，有惊喜"
        >
          馆藏 10 类 · 全馆藏 {TOTAL_BOOKS.toLocaleString()} 部（殆知阁 v20）· 人物 {TOTAL_PEOPLE.toLocaleString()} 人（CBDB）
        </p>
        <EasterEgg />
      </div>
    </footer>
  );
}
