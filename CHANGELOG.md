# 更新日志

本项目的所有重要变更都会记录在此文件中。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.4.3] - 2026-09-09

### 优化（人物考据档案页卡片式布局）
- `app/globals.css`：新增 `.character-grid` 响应式卡片网格（多列 `auto-fill minmax(280px,1fr)`、等高等距），替换原单列堆叠
- `components/CharacterList.tsx`：人物考据列表容器由单列 `grid` 改用 `.character-grid`，实现真正的卡片式排布，窄屏自动回落单列

### 新增（合规说明拆分为独立页面）
- `app/license/page.tsx`：新增「开源协议」独立页（代码 MIT、古籍公有领域与上游授权、CBDB 署名 CC BY-NC-SA 4.0、非商用定位）
- `app/data-source/page.tsx`：新增「数据来源」独立页（殆知阁 v20 书目原文、哈佛 CBDB 人物考据溯源与零复制架构）
- `app/disclaimer/page.tsx`：新增「免责声明」独立页（非商用、内容仅供参考、版权与责任、下载附言）
- `app/feedback/page.tsx`：新增「反馈渠道」独立页（GitHub Issues 主渠道与使用说明）
- `components/Footer.tsx`：页脚四项链接由统一 `/help` 改为分别指向上述四个独立页面
- `app/help/page.tsx`：原聚合的「数据来源与版权」小节重构为「相关说明」卡片，引导至四个独立页

## [1.4.2] - 2026-09-08

### 修复与增强（人物考据页）
- 修正 `app/character/page.tsx` 过时的「数据待接入」占位文案：CBDB 考据数据（v1.3.8 起）早已导入，现改为真实介绍（检索/筛选/关联典籍聚合与 CC BY-NC-SA 4.0 来源）
- `components/CharacterCard.tsx`：「相关典籍」由纯文本标签升级为可点击链接，跳转 `/search?q=<书名>&mode=title` 在馆藏中检索该书版本；无关联典籍时回退为「在馆藏中检索该作者著作」链接，打通考据↔阅读路径
- `app/globals.css`：新增 `.character-book-link` 跳转 hover 反馈样式

## [1.4.1] - 2026-09-08

### 修复
- 页脚区字体与字号规范化：移除内联 style 硬编码，统一由 CSS 管理（链接 14px、说明文字 13px，字体继承全局衬线栈）

## [1.4.0] - 2026-09-08

### 新增（首页趣味探索模块）
- 首页新增「趣味探索」区块，含「随机一书」与「随机一人」两个模块：分别从轻量书目样本与 CBDB 人物数据中随机抽选，提供「🎲 换一本 / 换一位」按钮即时重抽（不重复上一条），提升浏览趣味性
- 新增 `scripts/build-book-samples.mjs`（npm `build:book-samples`）：从殆知阁全量书目索引随机抽取 400 部生成轻量样本 `public/index/book-samples.json`，避免首页加载 11MB 全量目录
- 新增 `components/RandomBook.tsx` / `components/RandomCharacter.tsx`（客户端组件，挂载后按需 fetch 样本/人物 JSON 并渲染）

## [1.3.8] - 2026-09-08

### 新增（从 CBDB 导入人物考据数据）
- 新增 `scripts/build-characters.mjs`：以已校验的 CBDB 人物 ID 为种子，调用 CBDB REST API（`cbdb.fas.harvard.edu/cbdbapi/person`，授权 CC BY-NC-SA 4.0）拉取姓名/字/号/籍贯/生卒/官职，并按作者角色从 `PersonTexts` 提取著述作为「关联书籍」，生成 `public/index/characters.json`（28 位历史名人：孔子/老子/李白/杜甫/蘇軾/朱熹/司馬遷/王維等）
- 导入以「校验后 ID」为准（CBDB 姓名检索非确定性且常命中同名 obscure 人物），并对返回 PersonId 二次核验；少数人物（司馬遷/老子）因 CBDB 朝代字段缺失或误标，在种子中覆盖为西漢/春秋
- `CharacterList` 人物考据页现可渲染真实数据，支持检索/朝代·标签筛选/排序/详情展开

## [1.3.7] - 2026-09-08

### 新增（人物考据页功能完善）
- 人物考据页检索：支持姓名/字/号/籍贯/官职关键词检索，并派生朝代、标签筛选维度与按姓名/朝代排序
- 人物卡片详情展开：展示生卒、籍贯、官职、字号、标签与关联典籍，复用既有 .character-card 样式体系
- 配套纯函数过滤层 lib/characterFilter.ts（可单测）与单测 test/characterFilter.test.ts

## [1.3.6] - 2026-09-08

### 重构（原型设计对齐正式站点现状）
- **导航精简对齐**：原型导航由 8 项（含过时的「十大馆藏」「馆藏书籍」）改为与正式站点 `components/Navbar.tsx` 完全一致的 **7 项**：首页 / 全馆藏 / 检索 / 人物考据 / 社会关系 / 数据统计 / 帮助；11 个 HTML（综合页 + 9 个独立页）导航同步更新
- **馆藏页合并**：正式站点已将 `/category`、`/book-list` 合并为单一「全馆藏」书目页（`/catalog`），原型同步：① `category` 页改为「已合并至全馆藏」引导页（按钮跳全馆藏）；② `book-list` 页升级为「全馆藏」书目浏览页（保留 10 大类筛选 chips + 45 部演示书目）；③ 首页「十大馆藏」分类卡片点击直接进入全馆藏并预筛选对应馆藏（对齐正式 `/catalog?category=`）

### 优化（原型首页与文案对齐）
- 首页 Hero 文案对齐正式 `app/page.tsx`：改为「殆知阁 v20 全量 15,694 部古籍在线」+ 徽标「原始数据 4.9GB 托管于上游仓库 · 本仓库零复制 · 阅读时按需加载」
- 首页检索框新增「全文 / 标题」模式单选（与正式站点首页一致），提交时携模式跳检索页
- 「学术工具」区块补齐「数据统计」卡片，人物考据 / 社会关系卡片描述加注「（数据待接入）」，与正式站点空态口径一致

## [1.3.5] - 2026-09-08

> 说明：以下改动已随 v1.3.4 发布提交一并入库，此处补记；本版本仅同步文档与版本号。

### 新增（原型演示标识，避免演示数据被误读为正式原文）
- 顶部常驻「原型」提示条（`core.renderPrototypeNotice()`，JS 动态注入，11 个页面无需逐个改 HTML）：明示书目/人物/正文均为演示数据，正式站点直连殆知阁 v20 全量 15,694 部原文
- 阅读页样张提示：仅《论语》《心经》有贴合原书的样张，其余书目复用通用样本，现对非真实样张章节显示「本章为原型演示样张」提示条

### 修复
- `localStorage` 在 `file://` 直开或浏览器隐私模式下会抛异常，导致偏好读写整体失效；新增 `AB.lsGet/lsSet` 统一 try/catch 兜底，state 初始化、`save()`、阅读进度、检索偏好全部改走该封装
- 移动端菜单高度溢出：8 个菜单项约 392px，而 `.mobile-menu.open` 的 `max-height` 仅 320px，末尾两项被裁切；改为 480px 并允许滚动

### 其他
- `prototype/wireframes.html` 组件库页版本标注 V2.0 → V2.2，与脚本模块版本对齐

## [1.3.4] - 2026-09-08

### 重构（原型样式模块化）
- `prototype/assets/prototype.css`（316 行）按职责拆分为 `prototype/assets/css/` 下 6 个文件：`base`（重置/布局/导航/页脚/动效）、`components`（按钮/输入/卡片/列表/骨架屏）、`home`（首页 Hero 与组件库页）、`reader`（阅读页与影像对照）、`pages`（关系/检索筛选/数据统计）、`responsive`（响应式 + 无障碍，必须最后加载）；11 个 HTML（含 `wireframes.html`）样式引用同步更新，单文件均 ≤200 行
- Hero 背景图相对路径随目录迁移调整为 `../images/hero.png`

### 优化（原型无障碍与体验）
- 新增统一 `:focus-visible` 焦点环（链接/按钮/下拉/可聚焦生僻字），新增 `.sr-only` 读屏专用隐藏类
- 新增 `prefers-reduced-motion: reduce` 支持，尊重系统「减少动态效果」偏好
- 书单项、检索结果项补齐 `cursor:pointer`；关系类型标签选中态 `.tag.on` 补齐样式（此前仅 `.tag-active` 生效，筛选高亮缺失）
- 换书时重置章节进度：此前从 A 书第 30 章切到章节更少的 B 书会沿用旧下标，现切换书籍自动归零

### 清理
- 删除 3 份从未被引用的失效演示数据 `prototype/data/book-data.json` / `search-data.json` / `character-data.json`（原型唯一数据源为 `data/app-data.js`；git 历史可追溯）
- `prototype/data/app-data.js` 数据版本 `2.0` → `2.2`，与脚本模块版本对齐

## [1.3.3] - 2026-09-08

### 清理（去除演示数据收尾）
- 运行代码残留"演示"措辞清理：馆藏批量 TXT 导出头部"演示预览版导出"改为"馆藏藏书清单导出"；`lib/types.ts` 类型 `SearchDemoResult` 重命名为 `SearchTitleResult`
- 删除 v1.3.0 移除 demo 阅读器后残留的空目录 `app/read/[title]/`、`app/book/[id]/`
- 真实书目链路确认就绪：15,694 部古籍来自 `garychowcmu/daizhigev20`（`public/index/daizhige-catalog.json` 由 `npm run build:catalog` 生成），阅读页按需 fetch 上游 raw URL，全仓库零 TXT 复制

## [1.3.2] - 2026-09-08

### 修复（原型二次审查）
- **原型全站崩溃（致命回归）**：`getMain()` 原实现为 `return getMain();`，无限递归导致任何重渲染（繁简切换、翻章、检索、影像对照）直接 `RangeError`；改为 `$("#main-view") || $("#page-body")`
- **书单点击报错**：书籍项内联 `onclick` 引用 IIFE 内私有变量 `state`，浏览器端 `ReferenceError`；改为 `AB.openBook(id)`，并自动重置章节进度
- **人物卡片显示 `undefined`**：派生人物仅有姓名与关联著作，原模板无条件渲染朝代/籍贯/生卒/官职；改为按字段存在性渲染，缺失字段不显示
- **检索页筛选无效**：馆藏/朝代下拉仅写入 state 未参与过滤，且每页条数默认 12 不在 10/20/50 选项中；现筛选真实生效，默认值改为 20，朝代选项由书目动态派生
- **统计页硬编码**：繁简映射字原写死 429（实际 235），改为 `Object.keys(T2S_MAP).length` 实时统计；移除未使用的 `era` 死变量；空维度显示「待接入」提示

### 优化
- 双人关系查询由 `alert` 弹窗改为页面内 `aria-live` 结果区，无结果时给出引导；新增关系类型标签筛选
- 命中高亮改为对转义后的关键词切片，避免含 `<`/`&` 关键词高亮失效；零命中回退示例结果时明确标注「未命中，以下为常见检索样例」
- 无障碍：导航高亮同步 `aria-current="page"`，汉堡菜单补 `aria-label/aria-expanded/aria-controls`，设备预览与模式切换按钮补 `aria-pressed`，检索框补 `aria-label`，生僻字支持键盘 Enter 触发与 Esc 关闭释义弹层
- 帮助页合规声明对齐线上口径：「无隐私收集」改为「仅匿名访问统计」

### 重构
- `prototype/assets/prototype.js`（821 行）按职责拆分为 `prototype/assets/js/` 下 10 个模块：`t2s-map` / `core` / `view-home` / `view-read` / `view-search` / `view-character` / `view-relation` / `view-help` / `view-stats` / `boot`，单文件均 ≤200 行；11 个 HTML 页脚本引用同步更新，对外交互契约（`AB.openBook` 等）保持不变

## [1.3.1] - 2026-09-08

### 新增（四项高优功能落地）
- **超大书 HTTP Range 分片懒加载（P0，红线合规）**：`lib/fetchWithTimeout.ts` 新增 `range` 支持与 `fetchRangeText`；新增 `lib/remoteBook.ts` 按构建期生成的章节字节偏移清单（`public/index/chapters.json`）按需拉取章节，彻底解决整本 fetch 导致的超时/OOM；不支持分片的书目自动回退整本下载 + IndexedDB 缓存
- **馆藏/批量下载入口（P1）**：`lib/download.ts` 新增 `exportBooklistCsv`，catalog 页新增「导出书单（含原文直链）」按钮，零复制导出当前筛选结果（书名/馆藏/子类/大小/原文直链），符合架构约束
- **人物/关系数据驱动接线（P1，待 CBDB 数据）**：`components/CharacterList.tsx` / `RelationClient.tsx` 改为读取 `public/index/characters.json` / `relations.json`，数据为空时回退「待接入」空态，接入 CBDB 等元数据后自动渲染；新增数据契约种子文件
- **全文检索构建整合（P0）**：`scripts/build-fulltext-index.mjs` 在同一次 4.9GB 下载 pass 中顺带生成章节字节偏移清单（单文件 `chapters.json`），并写入 `.github/workflows/deploy.yml` 构建流程；`fulltext-index.json` / `chapters.json` 加 `.gitignore`（体积大，部署期生成，不入库）
- **章节识别增强**：`lib/chapterParse.ts` 补「品第X / 第X品」模式，并放宽上下文校验（标题后接缩进正文即可），修复佛经/子书章节漏检

### 重构
- `components/RemoteReader.tsx` 拆分为 `RemoteReader` + `ReaderToc`（章节导航）+ `ReaderToolbar`（工具栏），单文件体积受控
- 章节解析逻辑统一抽离至 `lib/chapterParse.ts`，客户端与构建脚本共用

## [1.3.0] - 2026-09-08

### 变更（核心数据架构迁移：去除演示数据，直连上游全量 txt）
- **唯一数据源切换**：移除 `lib/data-generated.ts`（45 部手写 demo）与 `scripts/build-index.mjs`，全站改以 `public/index/daizhige-catalog.json`（15,694 部，由 `npm run build:catalog` 调 GitHub Trees API 生成）为唯一书目数据源；阅读时按需 fetch `raw.githubusercontent.com` 直链（含 jsDelivr / statically 镜像降级），本仓库零 TXT 复制
- **浏览/阅读统一真实链路**：书目、书籍详情、阅读统一走 `/catalog` → `/catalog/book` → `/read/remote`；删除 `/book/[id]`、`/read/[title]` 等 demo 路由，以及 `ReaderClient` / `BookActions` / `CategoryDownload` 等 demo 专用组件
- **检索重构**：`lib/search.ts` 重写为「标题检索（始终可用）+ 全量倒排索引全文检索」；新增 `npm run build:fulltext` 下载上游 TXT 生成 `public/index/fulltext-index.json`，索引缺失时自动回退标题检索
- **人物 / 关系 / 统计**：人物考据、社会关系溯源保留入口，无元数据（CBDB 待接入）时显示「数据待接入」空态；数据统计页改为基于真实目录动态计算馆藏分布与体量
- **脚本调整**：移除 `prebuild:index`（依赖 demo 构建，会阻断 `next build`），新增 `build:fulltext`；版本 1.2.10 → 1.3.0

## [1.2.10] - 2026-09-08

### 修复（原型审查）
- **独立页面二次渲染崩溃**：`prototype/assets/prototype.js` 新增 `getMain()` 兼容综合页 `#main-view` 与独立页 `#page-body`；搜索页/人物页二次渲染、繁简切换重渲染此前在 `pages/*.html` 拿到 `null` 而崩溃或失效，现已修复
- **统计数字硬编码与真实数据矛盾**：数据统计页洞察文案与页脚静态兜底原写死「21 位 / 20 条 / 139 章节」，但 `app-data.js` 人物驱动派生后为 38 位人物 / 6 条关系，改为动态读取 `DATA` 计算值（与页脚 `renderFooterStats` 口径一致）
- **人物考据页仅显示前 8 位**：`renderCharacter` 原 `list.slice(0,8)`，38 位人物中仅 8 位可见，改为全量展示
- 导航「十大藏库」统一为全站一致的「十大馆藏」

### 说明
- 人物卡片字段（字号/籍贯/生卒/官职等）由 `app-data.js` 派生后仍为空（设计选择：缺失字段留空不虚构），后续接入 CBDB 真实档案后填充

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
[1.3.6]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.5...v1.3.6
[1.3.5]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.0...v1.3.1
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
