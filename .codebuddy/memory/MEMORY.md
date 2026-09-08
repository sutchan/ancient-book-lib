# ancient-book-lib（古籍通 AncientBook）长期记忆

- **仓库**：`https://github.com/sutchan/ancient-book-lib.git`，owner = sutchan；当前分支 main。
- **技术栈**：Next.js 14 + React 18 + TypeScript，纯静态 SSG（`output: "export"`，产物 `out/`）。无数据库、无后端接口、无 ESLint 配置、无测试框架；类型检查门禁为 `npx tsc --noEmit`；`next start` 不适用于 export 模式，预览用 `npx serve out`。
- **目录（实际）**：根级 `app/ components/ lib/ scripts/ prototype/ docs/ public/` 与 `.github/`。注意 `docs/02-架构与开发规范/项目目录结构规范.md` 仍写 `src/app` 旧结构，与实际不符。
- **数据单一源**：`prototype/data/app-data.js` → `npm run build:index` 生成 `lib/data-generated.ts`（禁止手改生成文件）。
- **架构红线**：禁数据库、禁后端检索、禁动态 SSR、禁直读超大原文（必须 Range 分片）、禁服务端存用户数据、禁广告/付费/注册/埋点、古籍原文保真。
- **文档体系**：`docs/` 八大分类（01 基础说明 / 02 架构与开发规范 / 03 PRD / 04 任务清单 / 05 设计规范与原型 / 06 部署与迭代 / 07 环境搭建手册 / 08 技术方案研究）+ 根 `README.md` + `CHANGELOG.md`。
- **社区健康文件**：位于 `.github/`（CONTRIBUTING / CODE_OF_CONDUCT / SECURITY / SUPPORT / PR 模板 / Issue 模板）。禁止创建 `.github/readme.md`。
- **生产站点**：https://guji.ewuse.com/ ，托管于腾讯云 **EdgeOne Pages**（响应头 `server: edgeone makers`，DNS 多 A 记录智能解析；由 EdgeOne 从 Git 拉取并构建 `out/`）。GitHub Pages 仅为可选备用，非生产链路——不启用 Pages 时 `actions/deploy-pages@v4` 会持续报 `Failed to create deployment (status: 404)`，属预期。
- **仓库可见性**：2026-09-08 由私有转为**公开**（`GET /repos/sutchan/ancient-book-lib` → 200 / `private:false`）。此前 Pages 无法启用的根因即仓库私有（免费计划不支持私有库 Pages）。
- **GitHub Actions 策略（v1.2.1 起）**：`.github/workflows/deploy.yml` 默认只做 CI（build:index → build:catalog → next build → 单测 → `upload-artifact@v4` 留存 out/ 7 天）；Pages 部署由仓库变量 `ENABLE_PAGES=true` 开关控制，默认关闭。仓库未启用 Pages 时 `deploy-pages@v4` 必报 `Failed to create deployment (status: 404)`，属预期误报。
- **品牌资料（v1.2.2 起）**：源图为 `public/brand/logo-source.jpg`（2048×2048，米色纸底 + 朱红方印 + 黑色「古籍通 / AncientBook」横版，比例 2.692:1；原 `public/images/logo.png` 实为 JPEG，已修正为透明 PNG）。生成脚本 `scripts/brand/*.ps1`（Windows GDI+，零第三方依赖，`powershell -File scripts/brand/build-brand-assets.ps1`），产物在 `public/brand/`，接入位为 `app/icon.png`、`app/apple-icon.png`、`app/opengraph-image.png`、根 `favicon.ico` / `apple-touch-icon.png` / `site.webmanifest`；**生成产物禁止手改**。品牌主色 `#A93320`、纸色 `#F7F3EA`（与 UI `--color-primary:#8C3130` 不互相覆盖）。规范见 `docs/05-设计规范与原型/品牌资料使用规范.md`。
- **环境与工具链坑**：无 sharp/pngjs/PIL；PowerShell 脚本必须 UTF-8 BOM 否则中文乱码；IDE 的 safe-delete shim 会让 `fs.rmSync('.next')` 报 trash 错误，重跑 build 即可。
- **Actions 版本基线（2026-09，v1.2.4）**：Node 24 运行时要求 `checkout@v7` / `setup-node@v7` / `upload-artifact@v7` / `upload-pages-artifact@v5` / `deploy-pages@v5`；旧版（v4/v3）会被强制以 Node 24 运行并产生 `Node.js 20 is deprecated` 告警。坑：`upload-pages-artifact` v4+ 默认不上传隐藏文件，需 `include-hidden-files: true` 才能带上 `.nojekyll`。
- **构建环境变量红线（v1.2.6 起）**：生产（EdgeOne / guji.ewuse.com）为**根路径**部署，构建环境**禁止**设置 `NEXT_PUBLIC_BASE_PATH`——该变量仅 GitHub Pages 子路径部署使用。误设会使产物内 CSS/JS/icon/站内链接全部带 `/ancient-book-lib` 前缀而 404（v1.2.6 前 `next.config.mjs` 在生产环境默认就带此前缀，已修）。注意 Next export 不会把页面输出到 `out/ancient-book-lib/`，因此页面 URL 仍 200、只有资源 404，极易误判。
- **待办**：仓库缺 LICENSE 文件，许可证选择待用户确认（尚未创建）。
