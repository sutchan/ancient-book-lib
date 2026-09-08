# 更新日志

本项目的所有重要变更都会记录在此文件中。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

## [1.2.9] - 2026-09-08

### 修复
- 导航栏改用 next/link，消除全站整页刷新；按路由自动高亮当前页
- 书目索引加载增加 jsDelivr / statically CDN 镜像降级，避免单点失败
- 阅读页去除 dangerouslySetInnerHTML，改用 React 元素渲染生僻字高亮（防 XSS）
- 远程书原文链接增加 http/https 协议校验，阻断 javascript: 等危险协议
- 下载文件名净化，防路径穿越与非法字符
- 子类筛选取全部子类（原仅取首个）
- 搜索「更多」提示仅在结果达到上限时显示

### 文档
- 首页与下载区补充「精选典籍为演示样张、全馆藏按需原文阅读」说明，避免误导

## [1.2.8] - 2026-09-08

### 优化
- 人物功能数据驱动：移除手写 20 位示范人物，`characters` 改为由 `books.author` 字段派生（去重、剔除佚名/集体编撰，自动关联其著作），缺失字段留空不虚构
- `relations` 清理为仅保留两端均在人物集中的 6 条有效考据引用
- `CharacterList` 改进为空字段条件渲染，避免「字 」「朝代  · 」等空标签

## [1.2.7] - 2026-09-08

### 修复
- 移除书目页「原始数据 4.8 GB · 托管于 garychowcmu/daizhigev20 · 本仓库不复制 TXT，阅读时按需加载」说明文本

## [1.2.6] - 2026-09-08

### 修复（线上重大故障）
- **生产站点全站资源 404**：`next.config.mjs` 在 `NODE_ENV=production` 下默认 `basePath = "/ancient-book-lib"`，
  而生产部署在根路径 `https://guji.ewuse.com/`，导致线上 HTML 引用的 CSS / JS chunks / icon / 站内链接
  全部带 `/ancient-book-lib/` 前缀而 404（页面无样式、导航点击 404）。改为默认根路径，
  仅在显式设置 `NEXT_PUBLIC_BASE_PATH` 时才启用子路径（GitHub Pages 场景由 CI 传入）
- **sitemap / robots 域名错误**：`scripts/generate-sitemap.mjs` 默认站点改为 `https://guji.ewuse.com`、
  默认 basePath 为空；`public/robots.txt` 的 Sitemap 行同步改为生产域名（原指向 `sutchan.github.io/ancient-book-lib`）

### 优化
- `app/layout.tsx` 补充 `alternates.canonical` 与 `openGraph.url`，补全规范化链接与分享 URL（修复后页面无 canonical / og:url 元信息）

### 变更
- 版本号升级至 1.2.6

## [1.2.5] - 2026-09-08

### 变更
- **原型页脚改为数据统计**：移除 `prototype.html` 页脚占位文案「解压密码：gujitong · 备用网盘：pan.example.com/gujitong」，改为与线上 `components/Footer.tsx` 同口径的项目统计（馆藏 / 精选典籍 / 全馆藏 15,694 部 / 人物 / 考据关系）
- `prototype/assets/prototype.js` 新增 `renderFooterStats()`，页脚统计由 `data/app-data.js` 实时计算（HTML 内保留静态兜底，未加载 JS 时同样可读）；9 个独立页面 `pages/*.html` 页脚同步补统计行
- UI 与 UX 全局设计规范、Figma 原型建模页面清单中「底部公示区」描述同步为「数据统计概览」，不再列解压密码 / 网盘链接
- 版本号升级至 1.2.5

## [1.2.4] - 2026-09-08

### 变更
- **GitHub Actions 升级至 Node 24 运行时**：`actions/checkout` v4 → v7、`actions/setup-node` v4 → v7、`actions/upload-artifact` v4 → v7、`actions/upload-pages-artifact` v3 → v5、`actions/deploy-pages` v4 → v5，消除
  `Node.js 20 is deprecated ... being forced to run on Node.js 24` 构建告警
- 版本号升级至 1.2.4

### 修复
- 补齐 v1.2.2 / v1.2.3 缺失的 CHANGELOG 版本比较链接

## [1.2.3] - 2026-09-08

### 新增
- **原型接入品牌资料**：新增 `prototype/assets/brand/`（印章图标 64、主屏实心图标 180、OG 分享图、横版反白 logo、`site.webmanifest`），与线上 `public/brand/` 同源
- **原型页面统一注入**：`prototype.html`、`wireframes.html`、`pages/*.html` 共 11 个页面 head 增加 favicon / apple-touch-icon / manifest / `theme-color` / `og:image` / `twitter:card`（相对路径按目录层级取 `./` 或 `../`）
- **原型 logo 主题联动**：`prototype/assets/prototype.js` v2.0 → v2.1，新增 `syncBrandLogo()`，导航栏 logo 按 `data-logo-light` / `data-logo-dark` 切换，深色主题自动使用反白版（与线上 `components/Navbar.tsx` 行为一致）
- `prototype/wireframes.html` 新增「六、品牌资料」章节：横版 logo 双底色演示、图标尺寸梯度（64/32/16/180）、品牌色板（`#A93320` / `#F7F3EA`）、OG 图预览与规格表

### 修复
- 原型 `prototype/assets/images/logo.png` 此前为 JPEG 内容，已替换为与线上同源的透明 PNG

### 变更
- 品牌资料使用规范文档补充「原型接入」章节
- 版本号升级至 1.2.3

## [1.2.2] - 2026-09-08

### 新增
- **品牌资料套件**：新增 `scripts/brand/build-brand-assets.ps1`（Windows GDI+，零第三方依赖），由源图一键生成 `public/brand/` 全套资源——横版 logo（1024/512/256，透明底与深底反白版）、方形印章徽章（1024~16 共 10 档）、iOS/Android 实心图标与 maskable 图标、1200×630 社交分享图 OG 图
- **站点图标接入**：`app/icon.png`（64）、`app/apple-icon.png`（180）、`app/opengraph-image.png`（1200×630）由 Next 文件约定自动注入；根目录 `favicon.ico`（16/24/32/48/64 多尺寸）与 `apple-touch-icon.png` 兜底传统请求
- **PWA 支持**：新增 `public/site.webmanifest`，metadata 补充 `manifest`、`applicationName`、`appleWebApp`、Open Graph / Twitter Card 字段，`viewport.themeColor` 取品牌主色 `#A93320`
- **品牌令牌**：`public/brand/brand-tokens.json` 记录主色 `#A93320`、纸色 `#F7F3EA`、横版比例 2.692 与源图路径
- `metadata.metadataBase` 设为生产域名 `https://guji.ewuse.com`，社交分享图输出绝对 URL（消除构建期 metadataBase 警告）
- 品牌资料使用规范文档：`docs/05-设计规范与原型/品牌资料使用规范.md`

### 修复
- `public/images/logo.png` 此前实为 JPEG 内容（扩展名错误），已替换为真实透明 PNG；原型 `prototype/assets/images/logo.png` 同步更新
- 导航栏深色主题下 logo 黑色文字不可见：深色主题自动切换到 `logo-full-light-512.png` 反白版

### 变更
- 版本号升级至 1.2.2

## [1.2.1] - 2026-09-08

### 修复
- **GitHub Pages 部署改为开关式**：`upload-pages-artifact` 与 `deploy` 任务增加 `vars.ENABLE_PAGES == 'true'` 条件，默认跳过；仓库未启用 Pages 时不再产生 `Failed to create deployment (status: 404)` 误报
- 修复 README 顶部「当前版本」行与社区文档表格粘连、缺失表头与 CONTRIBUTING 行的问题

### 变更
- 构建产物统一用 `actions/upload-artifact@v4` 留存 7 天，便于排查（不再依赖 Pages 产物）
- 部署规范补充「生产站点现状」（EdgeOne Pages + guji.ewuse.com）与 Pages 开关说明
- 版本号升级至 1.2.1

## [1.2.0] - 2026-09-08

### 新增
- **IndexedDB 原文缓存**：远程书原文自动缓存至 IndexedDB（上限 100MB，LRU 淘汰），二次阅读零网络请求
- **大文件加载保护**：>5MB 文件显示警告（含文件大小、Wi-Fi 建议、直接下载选项），加载时显示下载进度条，60s 超时自动中止
- **CDN 镜像降级**：索引增加 jsDelivr + statically 两个 CDN 镜像，raw.githubusercontent.com 加载失败时自动尝试下一个镜像
- **远程书详情页**：新增 `/catalog/book?id=xxx`，展示元数据、章节目录（按需加载）、开始阅读/上游原文/CDN 镜像入口
- **阅读历史**：localStorage 记录最近阅读 10 本书，首页"最近阅读"区块展示
- **阅读进度条**：阅读页顶部显示整体阅读进度百分比
- **SEO**：新增 `robots.txt` + 构建后自动生成 `sitemap.xml`（111 个静态页面 URL）
- **basePath 配置**：`next.config.mjs` 支持 `NEXT_PUBLIC_BASE_PATH` 环境变量，CI 自动根据是否配置自定义域名决定子路径

### 优化
- **搜索防抖**：全馆藏书目搜索输入加 250ms 防抖，避免每次按键全量过滤
- **索引查找 O(1)**：`loadCatalog` 时构建 `Map<string, CatalogEntry>`，`findBookById` 从 O(n) 优化为 O(1)
- **章节解析收紧**：增加长度下限（2-20字）、排除规则（含"见/如/参阅"等词排除）、上下文校验（标题前后至少一侧为空行），减少误识别
- **大文件下载**：>5MB 文件直接提供上游 raw URL 下载链接，避免前端 Blob 内存溢出
- **统一 fetch 工具**：新增 `lib/fetchWithTimeout.ts`，封装 AbortController 超时 + 下载进度回调
- **CI 索引重建**：deploy workflow 增加 `npm run build:catalog` 步骤，确保上游数据更新时索引同步

### 修复
- GitHub Pages 子路径部署资源 404 风险（basePath + assetPrefix）
- 远程书加载无超时、无进度、无大小保护的问题
- 章节标题模式过宽导致正文被误识别为章节的问题

### 变更
- 版本号升级至 1.2.0

## [1.1.1] - 2026-09-08

### 新增
- **Pages 自定义域名支持**：workflow 读取仓库变量 `PAGES_CUSTOM_DOMAIN`，构建后自动写入 `out/CNAME`；未配置该变量则跳过、使用默认域名（避免子路径下资源 404）
- 部署规范新增「绑定自定义域名」章节：DNS 记录、仓库变量配置、Enforce HTTPS 步骤

### 修复
- 补齐 v1.1.0 缺失的 CHANGELOG 版本比较链接

### 变更
- 版本号升级至 1.1.1

## [1.1.0] - 2026-09-08

### 新增（B1 全量数据接入：直接引用上游，本仓库零 TXT 复制）
- **殆知阁 v20 全量书目索引**：新增 `scripts/build-daizhige-catalog.mjs`，调用 GitHub Trees API 递归遍历 [garychowcmu/daizhigev20](https://github.com/garychowcmu/daizhigev20)，生成 `public/index/daizhige-catalog.json`（15,694 部书目元数据，5.7MB）
- **全馆藏书目浏览页**：新增 `/catalog`（支持书名搜索、馆藏筛选、子类筛选、分页，50 部/页）
- **远程书阅读**：新增 `/read/remote?id=xxx`，按需 fetch 上游 raw TXT（CORS `*`，UTF-8），客户端解析章节，支持繁简切换、字号行距、进度缓存、整本下载、划词检索
- **检索页书目匹配**：新增 `CatalogSearchResults`，在检索结果中展示全馆藏书名匹配（前 8 条 + 查看全部）
- **首页升级**：Hero 口径从"45 部演示"升级为"15,694 部全量在线"，新增"浏览全馆藏"和"精选典籍"双入口，十大馆藏卡片链接到全馆藏筛选
- **导航升级**：新增"全馆藏"主导航入口，"馆藏书籍"更名为"精选典籍"

### 架构
- **数据引用模式**：原始 4.9GB TXT 全部托管于上游仓库，本仓库仅存 5.7MB 书目索引；阅读时按需 fetch `raw.githubusercontent.com` 直链，不预加载、不复制、不依赖数据库
- **索引可重建**：`node scripts/build-daizhige-catalog.mjs` 重新拉取上游文件树生成索引（上游更新时运行）

### 变更
- 版本号升级至 1.1.0
- layout metadata、Footer、stats 页、README 同步全量数据口径

## [1.0.4] - 2026-09-08

### 修复
- **GitHub Pages 部署流水线加固**：`pull_request` 仅做构建校验、不再上传产物（避免 PR 产物污染部署）；`concurrency.cancel-in-progress` 改为 `false`，避免并发任务取消进行中的部署
- 补充部署排障说明：Pages 未启用导致的 `Failed to create deployment (status: 404)` 属仓库设置问题，需在 Settings → Pages → Source 选择 GitHub Actions

### 新增
- `public/.nojekyll`：禁用 Jekyll，防止 `_next/` 等下划线目录被忽略导致静态资源 404
- 部署规范新增「GitHub Pages 部署（CI/CD）」章节：首次启用步骤、访问路径约束（推荐绑定自定义域名走根路径）、常见告警说明

### 变更
- 版本号升级至 1.0.4

## [1.0.3] - 2026-09-07

### 新增（评审改进全量落地，B1 数据接入除外）
- **合规下载模块（B2）**：新增 `lib/download.ts` 下载工具（UTF-8 BOM TXT 导出、免责确认）；阅读页「下载本章」、书籍详情页「下载整本（繁体原版/简体对照）」、馆藏页「下载馆藏合集」三级粒度；页脚新增资源下载公示
- **阅读进度与已读缓存（I1/O1）**：阅读页 `localStorage` 持久化 `ab-progress`（退出重进精准定位章节）与 `ab-read-{书}-{章}` 已读片段缓存
- **高级学术检索（I2）**：检索页新增馆藏、朝代多维筛选（PRD §4.3.2）；阅读页划词弹出「检索此句」一键溯源；首页搜索框改为真实表单（GET 传参 q/mode，支持全文/标题双模式）
- **书籍详情页（I4）**：新增 `/book/[id]` 详情页（书目信息、章节目录、下载入口），`/book-list` 与馆藏页书目链接同步升级；新增 `/category` 馆藏总览页（修复导航 404）
- **章节分页（O2）**：阅读页新增章内分页（每页 4 段）
- **人物考据聚合与重名区分（I5）**：新增 `CharacterList` 组件（姓名/字号/别称/籍贯搜索、朝代筛选、唯一人物 ID 多维区分展示、关联典籍一键聚合展开）
- **繁简映射扩展（B3）**：映射库由 376 字扩展至 820 字（覆盖古籍高频字、异体字；新增 `scripts/fix-t2s-dupes.cjs` 去重维护脚本）
- **组件测试（O3）**：新增检索筛选、繁简扩展、下载工具三组测试，总数 12 → 29 项

### 变更
- **对外口径统一（I6）**：全站标注「演示预览版」（首页 Hero 徽标、馆藏页、页脚、README、metadata），消除「45+ 部全文在线」与演示数据的口径偏差；页脚保留数据源实时统计并附下载公示
- 版本号升级至 1.0.3
- 同步更新 README、PRD 注记、任务清单勾选、审查报告落地状态

### 优化
- 页脚新增当前版本号显示（构建时从 package.json 读取）
- 页脚移除「解压密码 / 备用网盘」硬编码占位，改为公示说明（真实值随全量数据发布公布）

## [1.0.2] - 2026-09-07

### 新增
- 接入 Google Analytics 4（GA4），衡量 ID `G-H76XG9L6FZ`
- 新增 `components/Analytics.tsx` 服务端组件，SSG 时直接写入初始 HTML（`next/script` afterInteractive），全站 65 个静态页统一注入
- 开启 IP 匿名化（`anonymize_ip: true`），仅采集匿名聚合访问统计，不采集个人身份信息，与「零隐私收集」定位一致

### 变更
- `app/layout.tsx` 统一引用 Analytics 组件，移除旧版 `app/GoogleAnalytics.tsx` 客户端实现（避免重复埋点）
- 版本号升级至 1.0.2
- 同步更新项目文档（合规声明、架构、目录规范、部署规范、帮助页）

## [1.0.1] - 2026-09-07

### 新增
- `.github/` 社区健康文件：`CONTRIBUTING.md` 贡献指南、`CODE_OF_CONDUCT.md` 行为准则、`SECURITY.md` 安全策略、`SUPPORT.md` 支持与帮助
- Issue 模板：功能缺陷报告、功能建议、古籍内容与考据勘误，并配置 `config.yml` 引导入口
- `PULL_REQUEST_TEMPLATE.md` PR 模板（含架构约束与合规自检清单）
- `CHANGELOG.md` 版本更新日志

### 优化
- 根 README 补充徽章、真实目录结构、完整命令说明与社区协作入口
- 环境搭建手册回填真实仓库地址，并补充社区协作文档入口

### 文档
- 项目简介文档补充「参与共建」章节

## [1.0.0] - 2026-09-07

### 新增
- 古籍通 AncientBook 首个上线版本：Next.js 14 纯静态 SSG 架构
- 十大馆藏分类浏览、典籍书单、毫秒级前端内存全文检索
- 古籍级繁简双语保真阅读、超大文本 Range 分片懒加载
- 人物考据、社会关系、数据统计、帮助与合规页面
- 高保真可交互原型 `prototype/`（三套主题 + 真实模拟数据）
- 全套项目文档 `docs/`（基础说明、架构规范、PRD、任务清单、设计规范、部署迭代、环境手册、技术研究）

[未发布]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.8...HEAD
[1.2.8]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.7...v1.2.8
[1.2.7]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.6...v1.2.7
[1.2.6]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.5...v1.2.6
[1.2.5]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.4...v1.2.5
[1.2.4]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/sutchan/ancient-book-lib/releases/tag/v1.0.0
