# ancient-book-lib（古籍通 AncientBook）长期记忆

- **仓库**：`https://github.com/sutchan/ancient-book-lib.git`，owner = sutchan；当前分支 main。
- **技术栈**：Next.js 14 + React 18 + TypeScript，纯静态 SSG（`output: "export"`，产物 `out/`）。无数据库、无后端接口、无 ESLint 配置、无测试框架；类型检查门禁为 `npx tsc --noEmit`；`next start` 不适用于 export 模式，预览用 `npx serve out`。
- **目录（实际）**：根级 `app/ components/ lib/ scripts/ prototype/ docs/ public/` 与 `.github/`。注意 `docs/02-架构与开发规范/项目目录结构规范.md` 仍写 `src/app` 旧结构，与实际不符。
- **数据单一源**：`prototype/data/app-data.js` → `npm run build:index` 生成 `lib/data-generated.ts`（禁止手改生成文件）。
- **架构红线**：禁数据库、禁后端检索、禁动态 SSR、禁直读超大原文（必须 Range 分片）、禁服务端存用户数据、禁广告/付费/注册/埋点、古籍原文保真。
- **文档体系**：`docs/` 八大分类（01 基础说明 / 02 架构与开发规范 / 03 PRD / 04 任务清单 / 05 设计规范与原型 / 06 部署与迭代 / 07 环境搭建手册 / 08 技术方案研究）+ 根 `README.md` + `CHANGELOG.md`。
- **社区健康文件**：位于 `.github/`（CONTRIBUTING / CODE_OF_CONDUCT / SECURITY / SUPPORT / PR 模板 / Issue 模板）。禁止创建 `.github/readme.md`。
- **待办**：仓库缺 LICENSE 文件，许可证选择待用户确认（尚未创建）。
