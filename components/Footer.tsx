// components/Footer.tsx v1.0.3
import Link from "next/link";

// 应用版本单一来源为 package.json，构建时由 Next.js 内联该环境变量。
const APP_VERSION = process.env.npm_package_version || "1.0.3";

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
        <p>古籍通 AncientBook · 开源公益古籍阅读与考据平台 | 数据仅供学术参考</p>
        <p style={{ fontSize: 12 }}>解压密码：gujitong · 备用网盘：pan.example.com/gujitong</p>
        <p className="footer-version" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 8 }}>
          当前版本 v{APP_VERSION}
        </p>
      </div>
    </footer>
  );
}
