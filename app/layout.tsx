// app/layout.tsx v1.0.2
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  title: "古籍通 AncientBook｜开源古籍文献检索阅读平台",
  description:
    "古籍通 AncientBook：开源公益古籍检索阅读与考据平台。十大馆藏、45 部核心典籍在线（演示预览版），繁简保真阅读，毫秒级全文检索，CBDB 人文考据；5GB 全量古籍接入推进中。",
  keywords: ["古籍", "古文", "国学", "四库全书", "繁体字", "古籍检索", "AncientBook"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-theme="light">
      <body>
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
