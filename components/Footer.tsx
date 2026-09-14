// components/Footer.tsx v1.15.8
import Link from "next/link";
import EasterEgg from "@/components/EasterEgg";
import { BRAND_FULL } from "@/lib/constants";

// 版本号（构建时由 package.json 注入，单一来源）
const APP_VERSION = process.env.npm_package_version || "1.15.8";
// 应用构建更新日期（每次发版同步）
const BUILD_DATE = "2026-09-13";

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
        <p>{BRAND_FULL} · 开源公益古籍阅读与考据平台 | 数据仅供学术参考</p>
        <p
          className="footer-stats"
          title="悄悄说：连续点我几下，有惊喜"
        >
          v{APP_VERSION} · 更新于 {BUILD_DATE}
        </p>
        <EasterEgg />
      </div>
    </footer>
  );
}
