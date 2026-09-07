/** @type {import('next').NextConfig} */
const nextConfig = {
  // 纯静态 SSG：产物为静态文件，可部署 Vercel / 任意静态托管
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // 生产环境 asset 前缀（如部署在子路径时启用）
  // assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "",
  reactStrictMode: true,
};

export default nextConfig;
