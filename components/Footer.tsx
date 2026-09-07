import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="foot-links">
          <Link href="/help">开源协议</Link>
          <Link href="/help">数据来源</Link>
          <Link href="/help">免责声明</Link>
          <Link href="/help">反馈渠道</Link>
        </div>
        <p>古籍通 AncientBook · 开源公益古籍阅读与考据平台 | 数据仅供学术参考</p>
        <p style={{ fontSize: 12 }}>解压密码：gujitong · 备用网盘：pan.example.com/gujitong</p>
      </div>
    </footer>
  );
}
