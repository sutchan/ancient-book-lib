# 更新日志

本项目的所有重要变更都会记录在此文件中。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

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

[未发布]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.4...HEAD
[1.0.4]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/sutchan/ancient-book-lib/releases/tag/v1.0.0
