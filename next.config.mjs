/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
// GitHub Pages 默认部署在 /ancient-book-lib/ 子路径；配置自定义域名时通过 CI 置空
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (isProd ? "/ancient-book-lib" : "");

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
