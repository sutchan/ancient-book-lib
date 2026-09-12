// app/robots.ts —— robots.txt 生成（Next.js App Router 元数据路由）
// 允许搜索引擎收录站内页面；禁止抓取 /index/ 数据分片（107MB 索引无需被索引，节省抓取配额）
import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL || "https://guji.ewuse.com";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/index/", "/tmp/"],
    },
    sitemap: `${SITE_URL}${BASE_PATH}/sitemap.xml`,
    host: SITE_URL,
  };
}
