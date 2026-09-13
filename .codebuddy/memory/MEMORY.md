# ancient-book-lib（古籍通 AncientBook）长期记忆

## 仓库与部署
- 仓库 `https://github.com/sutchan/ancient-book-lib.git`（owner=sutchan，分支 main，2026-09-08 转公开）。
- 生产站 https://guji.ewuse.com/，腾讯云 **EdgeOne Pages**（从 Git 拉取构建 `out/`）。GitHub Pages 仅备用，非生产链路。
- 技术栈：Next.js 14 + React 18 + TS，纯静态 SSG（`output:"export"`，产物 `out/`）。无 DB / 后端 / ESLint。**门禁**：`npx tsc --noEmit` + `npm test`（node:test via tsx）。预览 `npx serve out`。
- 架构红线：禁 DB、禁后端检索、禁动态 SSR、禁直读超大原文（必须 Range 分片）、禁服务端存用户数据、古籍原文保真。
- 生产为**根路径**部署，**禁止**设 `NEXT_PUBLIC_BASE_PATH`（仅 GitHub Pages 子路径用，误设会让产物资源全带 `/ancient-book-lib` 前缀 404）。
- 构建坑：前台偶发 SIGTERM 或卡 `Collecting build traces`，重跑通常 ~145s 正常 exit 0；`npm run build:fulltext` 需 4.9GB 上游下载，生产 EdgeOne 构建命令须 `build:fulltext && build`。

## 数据单一源
- 书目：`garychowcmu/daizhige-catalog`（殆知阁 v20）。`npm run build:catalog` → `public/index/daizhige-catalog.json`（15,694 部，rawUrl + 镜像），阅读按需 fetch，零 TXT 复制。旧 `lib/data-generated.ts`/45 部 demo 已删。
- 人物：`app/people` 用 **CBDB 全量索引**（661,350 位，索引产物在 `public/index/cbdb*`）。`public/index/characters.json` = 28 位精选（CC BY-NC-SA 4.0 须署名），由 `scripts/build-characters.mjs` 从已校验 CBDB ID 生成；`app/character` 引导页与首页 `RandomCharacter` 复用。
- 关系：`lib/cbdb.ts` 真实 CBDB 接口（亲属 56.1 万 / 社会 19 万）。旧 `public/index/relations.json` 已在 v1.13.1 删除（空种子）。
- 全文/章节：`npm run build:fulltext` 一次性生成 `public/index/fulltext-index.json` + `public/index/chapters.json`（章节 UTF-8 字节偏移，供 Range 分片），体积大已 gitignore，部署期生成。
- CBDB 坑：`?name=` 检索非确定性，必须 `?id=` + 权威 ID；`searchPersons` 多级命中（姓名前缀>子串>别名前缀>别名子串），移除 `qNorm!==q` 守卫（否则简体打不中繁体）。
- 章节识别 `lib/chapterParse.ts`：标题正则须含「品第X / 第X品」，上下文校验放宽（标题后接缩进正文/空行或上行为空行）。

## 人物考据并入人物库（v1.14.0→v1.14.1，2026-09-12，已完成）
- `/character` 改为**引导页**（读 `characters.json`，列 28 精选跳 `/people/detail?id=<CBDB数字ID>`，去 `cbdb-` 前缀）；导航只留「人物库」。
- 考据工作台（`Character{Dossier,ProfileView,List,Card}.tsx`、`character{Profile,Validate,Filter}.ts`、两个 test、`docs/02-架构与开发规范/人物考据模块规格.md`）**v1.14.1 已彻底删除**，对 `app/components/lib` 零引用，单测 63→39。
- 数据单一源 = CBDB 全量（合并时丢失 2 条手工朝代，已确认可接受）。`sitemap.xml` 仍收录 `/character/`（与 `/category`、`/book-list` 一致，无单页排除机制，非阻塞）。

## 书签功能（v1.14.3，2026-09-13，已实现）
- 存储：`lib/bookmarks.ts`（书籍收藏 `ab-bookmarks` + 阅读位置书签 `ab-pos-${bookId}`）+ `lib/useBookmarks.ts`（pub/sub + `storage` 事件跨标签页同步），仅 `localStorage`、零后端、无新依赖。
- 入口：`components/Navbar.tsx` 顶部导航 **7 项**（首页/全馆藏/检索/人物库/社会关系/**书签**/帮助）+ 收藏数角标 `id="nav-bookmarks"`；`app/bookmarks/page.tsx` 支持打开/移除/清空 + 导出/导入 JSON。
- 触点：`app/catalog/CatalogInner.tsx` 星标、`app/catalog/book/CatalogBookInner.tsx` 按钮、`components/RemoteReader.tsx` 工具栏收藏 + 阅读位置书签（保存当前位置 + 面板 `goChapter` 跳回）。
- 单测 `test/bookmarks.test.ts`（+8 → 全站 **47** 用例）。
- ✅ 原型 `prototype/` 导航已补为 **7 项**（含「书签」），与正式 `Navbar.tsx` 一致；`pages/bookmarks.html` 已存在（R25 在 v1.15.1 完成）。

## 版本与提交（严格用户规则）
- **每次修改 bump 最小版本**（patch 起步）；仅更新**被改文件**头注释 `// path vX.Y.Z`，禁止全仓批量刷写。
- 全局单一来源：`package.json` `version` + `CHANGELOG.md` 新增对应小节（`scripts/sync-changelog-links.mjs` 同步底部比较链接）。当前 HEAD = **v1.15.1**（v1.14.3 书签功能实现 / v1.14.4 文档全量同步 / v1.15.0 阅读体验补强 R1–R4 / v1.15.1 全站文案精简含原型页脚）。
- 多会话并行：其他会话会中途 `git add -A && commit`；临时脚本用完即删、勿留被 `-A` 扫到的目录；每次动手先 `git status`+`git log -1` 确认真实状态。

## 工程环境坑（跨会话）
- PowerShell：PATH 常被污染，命令前置 `export PATH="/usr/bin:/bin:$PATH"` 后 ls/grep/head/tail/npm/npx 可用；`node -e` 中 `$` 被吞 → 改用 `.mjs` 脚本；CLIXML 噪声干扰 stdout；`delete_file` 偶超时 → 改 `node -e unlinkSync`。
- 无 sharp/pngjs/PIL；PS 脚本须 UTF-8 BOM。
- safe-delete shim 让 `fs.rmSync('.next')` 报 trash 错误，重跑 build 即可。

## 原型 prototype/（v1.3.0 起非运行站点，仅对齐演示）
- 12 脚本（t2s-map→core→view-*→boot，其中 `view-character.js` 已删、`view-people.js` 为人物库）共享 `window.AB`；`#main-view`/`#page-body` 必须 `getMain()` 取。导航 **7 项**（与正式 `Navbar.tsx` 一致，含「书签」`pages/bookmarks.html`）：首页 / 全馆藏 / 检索 / 人物库 / 社会关系 / 书签 / 帮助（`/character` 为「已并入人物库」引导页、`/category`/`/book-list` 为全馆藏引导页，均不在 nav；数据统计仅作页脚链接）。页脚仅 6 链接（v1.15.1 去除统计摘要行与品牌描述行）。正文为 demo 样张，与正式零复制不同源。
- 本地记忆目录（2026-09-13 纠偏）：`.workbuddy/` 真实（含 memory），`.codebuddy/` 为指向它的 **junction**；二者均 `.gitignore`、不入库。所有记忆写 `.workbuddy/memory/`。

## 文档与社区
- `docs/` 八大类 + README + CHANGELOG。社区健康文件在 `.github/`，**禁止创建 `.github/readme.md`**。
- **文档单一来源（v1.15.1 去冗余后）**：项目门面/功能/快速开始 = 根 `README.md`；代码规范 = `docs/02-架构与开发规范/代码开发规范.md`；版本日志 = 根 `CHANGELOG.md`；完成度状态 = `docs/04-开发任务清单/开发进度清单.md`；剩余任务 = `剩余开发任务清单.md`（只列未完成）。冗余处已改为指引，**勿再复制这些内容**。
- ⚠️ 并行会话高频产生**同版本号重复 CHANGELOG 小节**（已发生 1.14.4、1.15.1 两次）；每次写 CHANGELOG 前先搜 `^## \[` 检查去重。
- 分析埋点：GA4（`G-H76XG9L6FZ`）已获 owner 授权，覆盖原「禁埋点」约束（`app/GoogleAnalytics.tsx` + `app/layout.tsx`）。
- 品牌：源 `public/brand/logo-source.jpg`，生成产物禁手改；主色 `#A93320` / 纸色 `#F7F3EA`（与 UI `--color-primary:#8C3130` 不互相覆盖）。

## 待办
- LICENSE 2026-09-08 创建（MIT，默认待确认是否改协议）。
- 剩余开发任务清单：`docs/04-开发任务清单/剩余开发任务清单.md`（R1–R27，27 项）为当前剩余任务权威源。`docs/02-架构与开发规范/项目目录结构规范.md` 的旧 `src/app` 文档债已于 v1.14.2 修正；`.github/` 陈旧引用与 `/help` 页「待接入」文案已于 v1.14.4 校正。
- Git 标签止于 `v1.14.0`，`v1.14.1`–`v1.15.1` 未打标签（R24）；原型导航「书签」第 7 项已在 v1.15.1 补（R25 完成）。
