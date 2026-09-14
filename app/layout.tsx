// app/layout.tsx v1.15.9
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";

const SITE_TITLE = "古籍通 AncientBook｜开源古籍文献检索阅读平台";
const SITE_DESC =
  "古籍通 AncientBook：开源公益古籍检索阅读与考据平台。殆知阁 v20 全量 15,694 部古籍在线（原始数据托管于上游，阅读按需加载），繁简保真阅读，毫秒级检索，CBDB 人文考据。";

export const metadata: Metadata = {
  metadataBase: new URL("https://guji.ewuse.com"),
  title: SITE_TITLE,
  description: SITE_DESC,
  keywords: ["古籍", "古文", "国学", "四库全书", "繁体字", "古籍检索", "AncientBook", "殆知阁"],
  applicationName: "古籍通 AncientBook",
  manifest: "/site.webmanifest",
  // 绝对地址：相对 "/" 在部分爬虫/社会化分享下会解析为当前页 URL，导致 canonical 失效
  alternates: { canonical: "https://guji.ewuse.com/" },
  appleWebApp: {
    capable: true,
    title: "古籍通",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    url: "https://guji.ewuse.com/",
    locale: "zh-CN",
    siteName: "古籍通 AncientBook",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#A93320",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        {/* 首帧同步恢复用户主题，避免深色/护眼主题 FOUC 闪烁（CSS 变量挂在 html[data-theme]） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("ab-theme");if(t==="light"||t==="paper"||t==="dark"){document.documentElement.dataset.theme=t;}}catch(e){}})();`,
          }}
        />
        <div className="app-container">
          <Navbar />
          <main className="main-content">{children}</main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
