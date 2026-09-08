/** @type {import('next').NextConfig} */
// 生产站点部署在根路径（https://guji.ewuse.com/），默认不加子路径前缀
// 仅当需要 GitHub Pages 子路径部署时，由 CI/环境显式传入 NEXT_PUBLIC_BASE_PATH=/ancient-book-lib
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  // 纯静态 SSG：产物为静态文件，可部署 Vercel / 任意静态托管
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  reactStrictMode: true,
};

export default nextConfig;
