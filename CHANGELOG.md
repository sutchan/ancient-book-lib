# 更新日志

本项目的所有重要变更都会记录在此文件中。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.13.1] - 2026-09-12

> 本节内容（愉悦体验层「纸墨雅趣」与人物库检索能力升级）早在 `add80e5` / `8dc499c` 即已随代码上线，但当时未单列版本号；
> v1.13.1 发布时将其正式归档于此（对应提交 `cf40abc`），使线上功能与版本记录对齐。

### 愉悦体验层 · 纸墨雅趣

#### 新增（愉悦体验层 · 纸墨雅趣）
- 以「愉悦体验设计师」视角为全站注入**克制而有文气**的微交互，采用「原型（`prototype/`）先行 → 正式站点（`app/`）同步」流程，八组触点：
  1. **墨韵按钮**：主按钮 hover 时水光自左向右扫过
  2. **朱砂点睛**：卡片 hover 顶缘展开一条朱砂细线
  3. **朱笔眉批**：书目行 hover 行首浮现朱笔标记
  4. **纸墨呼吸**：首页 Hero 背景光晕 16s 缓慢漂移
  5. **空态寻书**：检索零命中改为「未寻得此卷」+ 可点建议词（仁 / 君子 / 天下，真实跳检索）；空态图标轻摇头张望
  6. **随机卡重抽**：「🎲 换一本 / 换一位」内容轻弹重放（`key` 驱动）
  7. **卷首进度**：阅读页顶部 3px 朱砂细条随滚动生长（`components/ScrollProgress.tsx`，`aria-hidden`）
  8. **页脚彩蛋**：2 秒内连点页脚统计 5 次 → 篆字飞舞 + 「文脉绵延，与君共读」；第 3 次点击渐进提示（纯 CSS/JS 零依赖，动画开销极低）
- 文案愉悦化：404 页「此卷不在架上」+ 双 CTA；阅读加载「正在向殆知阁取卷…」、失败态温和提示；检索空态建议词真实可点（原型的建议词点击即触发检索）
- 新增 `components/ScrollProgress.tsx`、`components/EasterEgg.tsx`；`app/globals.css` 末段与 `prototype/assets/css/components.css` 末段同款「愉悦体验层」CSS，源码互注**双向同步契约**
- 原型 `prototype/assets/js/core.js` 新增 `AB.bindScrollProgress` / `AB.bindEasterEgg`，`boot.js` 挂载；`view-search.js` 空态对齐正式站建议词与文案
- 无障碍红线：全部动画收敛于 `@media (prefers-reduced-motion: no-preference)`；彩蛋在 reduce 用户下仅出 toast（`role=status`）；进度条 `pointer-events:none`，不抢焦点、不干扰读屏
- 验证：`tsc --noEmit` 通过、原型 JS `node --check` 通过、`npm run build` 成功（33 静态页 + sitemap）

### 优化（人物库检索能力升级）
- `lib/cbdb.ts` `searchPersons`：由「仅前缀匹配」升级为**多级命中**——① 姓名前缀 > ② 姓名中任意字（子串）> ③ 别名字号前缀 > ④ 别名字号子串，前一级不足 limit 时由后一级补充；修复搜姓名中间字（如「軾」→蘇軾）落空的问题，人物库空态提示「可尝试输入姓名中的任意字」由此真正成立
- 修复简繁互通失效：`searchPersons` 原带 `qNorm !== q` 守卫，导致**简体查询永远打不中繁体人名**（简体查询时 `qNorm === q`，归一化副本比对被整体跳过）。姓名与别名两处守卫均已移除（与 `searchCatalog` 此前同类问题同源）
- `app/people/PeopleInner.tsx`：搜索结果展示别名命中（如 蘇軾（東坡居士））；结果达 100 条上限时提示「仅显示前 100 位，请细化关键词」；搜索模式下禁用朝代筛选按钮并说明原因（结果来自人名索引、不含朝代字段，此前为静默失效）
- `app/people/detail/PeopleDetailInner.tsx`：修正「生平任职」区块注释误写为「人物关系」
- 新增 `test/cbdb-search.test.ts`（10 用例）：锁死繁简双向、前缀/子串、别名前缀/子串、姓名命中优先于别名、limit 生效

## [1.14.0] - 2026-09-12

### 调整（人物考据并入人物库）
- `/character`（人物考据）不再作为独立考据工作台，调整为**引导页**：说明考据能力已统一接入 CBDB 全量人物索引（661,350 位历代人物），并列出 28 位精选人物直达人物库详情页（`/people/detail?id=`），单一数据源、避免双入口重复维护。
- 移除 v1.13.2 引入的考据工作台组件与降级链路（这些能力已在「人物库」`/people` 全量提供）：`components/CharacterDossier.tsx`、`components/CharacterProfileView.tsx`、`components/CharacterList.tsx`、`components/CharacterCard.tsx`、`lib/characterProfile.ts`、`lib/characterValidate.ts`、`lib/characterFilter.ts`、`test/characterProfile.test.ts`、`test/characterFilter.test.ts`、`docs/02-架构与开发规范/人物考据模块规格.md`。
- `app/character/page.tsx` 改为服务端渲染的引导页（读取 `public/index/characters.json` 的 28 位精选，链接至人物库详情），不再依赖客户端 CBDB 索引的运行时可用性，任何部署形态下都能正常渲染。

### 验证
- `npx tsc --noEmit` 通过；`npm test` 通过（57 用例，移除工作台相关测试后）。

## [1.13.2] - 2026-09-12

### 新增（人物考据工作台）
- 新增 `lib/characterProfile.ts`：人物考据**数据契约层**。把 CBDB 紧凑元组归一化为结构化 `CharacterProfile`，并引入分面（facet）三态——`ok`（有数据）/ `empty`（CBDB 确无记录）/ `error`（本次加载失败）。区分 `empty` 与 `error` 是本次的核心约束：**加载失败不得粉饰成"暂无记录"**，否则用户会把取数故障误读成史料失载
- 新增 `lib/characterValidate.ts`：史料一致性校验层。13 个固定 issue code（`NAME_MISSING` / `BIRTH_DEATH_INVERTED` / `ENTRY_AFTER_DEATH` / `OFFICE_YEAR_OUT_OF_LIFE` / `INDEX_YEAR_OUT_OF_LIFE` / `FACET_FAILED` 等）分 error/warn/info 三级；11 个加权维度算 0–100 完整度评分与 AAA~C 分级，`life` 维支持半量折算
- 新增 `components/CharacterDossier.tsx`：考据工作台。检索（300ms 防抖 + 双重竞态守卫）→ 重名候选消歧 → 单份档案；`?q=&id=` 同步到 URL 且双向幂等；CBDB 索引不可用时整页降级到 28 位精选人物，保证任何部署形态下都有内容
- 新增 `components/CharacterProfileView.tsx`：考据档案视图。完整度评分环（SVG 自绘）+ 可折叠校验明细按严重度分组渲染；亲属/社会关系可点跳 `/people/detail`；著作标题可跳馆藏检索；CBDB 官方档案外链与 CC BY-NC-SA 4.0 署名
- 改造 `app/character/page.tsx`：接入工作台并以 `<Suspense>` 包裹（`useSearchParams` 在静态导出下的硬要求）
- 新增 `docs/02-架构与开发规范/人物考据模块规格.md`：现状盘点、功能范围、数据契约、交互与降级边界、13 条边界情况清单

### 优化
- 明确「人物库 `/people`」与「人物考据 `/character`」的职责边界：前者是全量浏览索引入口，后者是研判工作台（二者共用同一份 CBDB 索引，不另建数据源）
- `searchPersons` 候选补充朝代/指数年/籍贯后按 `pickDistinguishers` 计算区分维度，指数年按 50 年分桶、空值不参与多样性判定，避免"有/无"造成伪区分

### 修复
- 完整度评分权重原合计 110，会导致满档档案打出超过上限的分数；已调平到 100 并对 score 加 `0–100` 防御性夹取，另补"权重求和恒为 100""score 不溢出"两条防回归断言

### 工具
- 新增 `scripts/sync-changelog-links.mjs`（npm `sync:changelog`）：自动重建 CHANGELOG 底部的版本比较链接块。仓库此前**从未打过 Git tag**，链接全为死链且手工维护已失序
- 该脚本采用**双源取证**：主源为提交信息中的版本标注（同一版本取最后一次），辅源为 package.json 首次到达该版本的提交。原因是本仓库 package.json 在 1.4.6–1.13.0 期间长期停在 1.4.x 未跟随功能版本（如自称 v1.8.0 的 `9b61040` 里 package.json 仍是 1.4.4）——**仅凭 package.json 会把 v1.4.4 打到实际属于 v1.8.0 的提交上**
- 冲突让位：同一提交被多个版本认领时保留主源版本，其余跳过并在文件末尾注释中说明。据此 `1.4.4` 让位于 `1.8.0`；`1.1.1 / 1.2.1 / 1.2.4 / 1.2.5 / 1.2.7 / 1.2.10 / 1.5.0 / 1.6.0 / 1.7.0` 因两源皆无可靠落点而不生成链接，宁可缺链接也不打语义存疑的标签
- 据此生成 `tmp/create-tags.sh`（`sync:changelog --emit` 产物），含 **35 个待创建标签**命令（v1.0.0 – v1.13.2）；是否执行补建、是否推送远端由人工确认，故当前仓库 `git tag` 仍为空，下方链接块对应的 tag 待补建后方可访问

### 验证
- `npx tsc --noEmit` 0 错误 · `npm test` 63/63 全绿（新增 18 用例）· `npm run build` 成功（`/character` 预渲染为静态页，未因 Suspense 退化为客户端渲染）

## [1.13.0] - 2026-09-12

### 新增（人物详情可视化 + 人物库 URL 状态同步）
- 新增 `components/PersonTimeline.tsx`：人物生命时间轴（SVG 自绘、零依赖），聚合真实生卒年（BIOG_MAIN.c_birthyear/c_deathyear）+ 科举年份 + 任职年份，同年事件合并、上下交替防重叠、含刻度与图例；苏轼示例：1036 生 → 1057 進士 → 1061 賢良方正 → 1101 卒
- 新增 `components/RelationGraph.tsx`：人物关系网络图（确定性放射状布局），以人物为中心展示亲属（青）+ 社会关系（橙）节点，点击跳转详情，单侧上限 12 防重叠
- 人物详情页新增「生命时间轴」与「关系网络」两个可视化区块；人物库浏览页姓氏/朝代/仅看女性/关键词/页码同步到 URL（支持分享与前进后退，双向幂等）
- 验证：tsc 0 错误、next build 33/33、40/40 测试全绿；真实浏览器验证苏轼详情页时间轴与关系图渲染正确

## [1.11.0] - 2026-09-12

### 新增（人物时间分布 + 人物库浏览增强）
- 新增 `scripts/build-cbdb-years.mjs`（npm `build:cbdb-years`）：聚合 BIOG_MAIN.c_index_year 指数年（有效范围 0<year<2000，排除缺失与异常值），生成 `public/index/cbdb/person-years.json`（30.8 万有效指数年 / 20 个世纪区间 / Top 8 朝代×区间，已提交）
- 数据统计页新增「历代人物时间分布」面板（全部/朝代切换 + 世纪柱状图，显示隋唐积累、宋元高峰、明清爆发形态）
- `lib/cbdb.ts`：新增 `PersonYearsMeta` / `loadPersonYears`
- 人物库浏览页增强：性别筛选（仅看女性，CBDB 共 5.8 万女性人物）、姓氏搜索框（前缀精确筛选复姓如欧阳/司马）、展开全部姓氏按钮
- CI 重建 workflow 同步时间分布；README / 帮助页 / 数据来源页 / CHANGELOG 更新

## [1.10.0] - 2026-09-10

### 新增（人物科舉檔案 + 史料來源）
- 新增 `scripts/build-cbdb-entry.mjs`（npm `build:cbdb-entry`）：提取 ENTRY_DATA + ENTRY_CODES + BIOG_MAIN 朝代，生成科举索引（264,820 条 / 220,665 人 / 300+ 登科方式 / 5.6MB，产物 `public/index/cbdb/entry/` 含 entry-dynasty.json 朝代×登科统计，已提交）
- 新增 `scripts/build-cbdb-sources.mjs`（npm `build:cbdb-sources`）：提取 BIOG_SOURCE_DATA 主要来源 + TEXT_CODES 书名（书名字典化压缩，516 种去重书名），生成史料来源索引（504,591 条 / 452,070 人 / 5.8MB，产物 `public/index/cbdb/sources/`，已提交）
- `lib/cbdb.ts`：新增 `loadEntryMeta` / `getPersonEntries` / `loadEntryDynastyMeta` / `loadSourcesMeta` / `getPersonSources`
- 人物详情页新增「科舉/入仕」区块（登科方式+年份+名次，如蘇軾 1057 進士第二名、1061 賢良方正科制舉）与「史料來源」区块（主要来源书目）
- 数据统计页新增「科举-朝代分析」面板（朝代下拉 + 登科方式 Top 12）
- CI 重建 workflow 同步重建科举/来源索引；README / 帮助页 / 数据来源页 / CHANGELOG 更新

## [1.9.0] - 2026-09-10

### 新增（人物字/號/別名接入）
- 新增 `scripts/build-cbdb-altnames.mjs`（npm `build:cbdb-altnames`）：提取 ALTNAME_DATA + ALTNAME_CODES，生成别名索引（163,634 条 / 100,585 人 / 7.8MB，产物 `public/index/cbdb/altnames/`，已提交）
- `lib/cbdb.ts`：新增 `loadAltnameMeta` / `getPersonAltnames`（字/別號/諡號/行第/小名/法號等 19 类）；`searchPersons` 增强——姓名匹配不足时自动补充**别名检索**（如搜「東坡」命中蘇軾），返回命中类型与别名
- 人物详情页新增「字/號/別名」区块；古籍检索页人物匹配卡片显示别名命中（如 蘇軾（東坡居士））
- CI 重建 workflow 同步重建别名索引；README / 帮助页 / 数据来源页 / CHANGELOG 更新

## [1.8.0] - 2026-09-10

#### 新增（关系溯源升级 + 籍贯分布 + 官职-朝代联动）
- 双人溯源升级为**分层 BFS**（`findRelationPath` 重构）：支持直接/2/3 级中间关系，深度可选（1-3 级），每层探索宽度按 2 的幂递减，引入邻居缓存与 visited 去重控制分片加载；返回路径步数 + 实际展开人物数
- 新增 `scripts/build-cbdb-analysis.mjs`（npm `build:cbdb-analysis`）：生成两类分析产物
  - 人物籍贯分布 `public/index/cbdb/geo/geo-meta.json`（378,745 位有籍贯可归省人物 / 217 个省级行政区，按朝代×省/道/路聚合，行政区名忠实历史地理）
  - 官职-朝代联动 `public/index/cbdb/offices/offices-dynasty.json`（587,506 条任职-朝代记录 / 12 朝代，各朝高频官职 Top 15）
- `lib/cbdb.ts`：新增 `loadGeoMeta` / `loadOfficeDynastyMeta`
- 数据统计页新增「人物籍贯分布」（朝代下拉 + 地区柱状图）与「官职-朝代联动分析」（朝代下拉 + 官职排行）两个面板
- 帮助页 / 数据来源页同步更新

## [1.7.0] - 2026-09-10

#### 新增（CBDB 生平任职 + 著作-馆藏联动）
- 新增 `scripts/build-cbdb-offices.mjs`（npm `build:cbdb-offices`）：提取 POSTED_TO_OFFICE_DATA + OFFICE_CODES + APPOINTMENT_CODES，生成按 personid 值区间分片的任职索引（590,540 条 / 298,954 人 / 11,291 种官职 / 16.7MB，产物 `public/index/cbdb/offices/`，已提交）
- `lib/cbdb.ts`：新增 `loadOfficesMeta` / `getPersonOffices`（官职 + 首末年 + 任命类型：正授/權/守/試/攝等）
- 人物详情页新增「生平任职」区块（前 60 条官职标签，含任命类型与起止年）；著作列表新增「在馆藏检索」链接（在殆知阁书目中查找同名著作，标注口径）
- 数据统计页：概览与任职面板接入 59.1 万条任职 / 29.9 万人 / 11,291 种官职 / 任命类型统计
- CI 重建 workflow 同步重建任职索引；README / 帮助页 / 数据来源页更新

## [1.6.0] - 2026-09-10

#### 新增（CBDB 关系网络：亲属 + 社会关系 + 人物著作）
- 新增 `scripts/build-cbdb-relations.mjs`（npm `build:cbdb-rel`）：从 CBDB SQLite 提取 KIN_DATA（亲属 561,361 条）、ASSOC_DATA（社会关系 189,938 条）、BIOG_TEXT_DATA（人物-著作 50,783 条），生成按 personid 值区间分片的索引 + 关系人名映射 + 代码表，产物 `public/index/cbdb/rel/`（21.9MB，已提交，覆盖 311,202 人）
- `lib/cbdb.ts`：新增关系加载能力——`getPersonRelations`（亲属/社会）、`getPersonTexts`（著作）、`findRelationPath`（双人溯源：直接关系 + 二级中间关系，受控广度）
- 人物详情页新增「人物关系」区块：亲属（前 60）、社会关系（前 60，含年份）、著作列表（前 40），关系标签可点击直达对应人物
- `components/RelationClient.tsx` 全面重写：社会关系溯源页从占位变为真实 CBDB 数据——人物搜索联想（防抖）、单人关系网络（亲属/社会分组）、双人溯源（A→B 或 A→X→B 路径展示）、顶部数据统计
- `components/StatsClient.tsx`：数据统计页 KPI 与概览接入真实人物/关系数据，新增「CBDB 人物朝代分布（前 10）」柱状图与关系数据面板（亲属/社会/著作/称谓/关系类型计数）
- 首页「社会关系溯源」卡片、帮助页、数据来源页、README 更新为真实数据口径

## [1.5.0] - 2026-09-10

#### 新增（CBDB 全量人物库）
- 接入 CBDB（中国历代人物传记资料库）**全量 661,350 位人物**，新建 `scripts/build-cbdb-index.mjs`（npm `build:cbdb`）：读取 CBDB 官方 SQLite（cbdb-project/cbdb_sqlite 2026-09-05 版），提取 BIOG_MAIN 基本信息（姓名/拼音/生卒年/指数年/性别/朝代/籍贯），生成按姓氏分片 + 排序姓名索引，产物 `public/index/cbdb/`（49.8MB，已提交）
- 新增 `app/people/` 人物库：搜索（防抖前缀匹配）、朝代筛选（前 12）、姓氏浏览（前 60）、分页列表；新增 `app/people/detail/` 人物详情（生卒年/指数年/性别/籍贯 + 「在古籍中检索」「CBDB 官方档案」入口）
- 检索页新增「人物匹配（CBDB）」卡片（`components/PeopleSearchResults.tsx`），搜索关键词同时匹配人物姓名，最多 8 人直达详情
- 首页 Hero 与「学术工具」新增「人物库」入口；导航栏新增「人物库」；页脚统计口径更新为「人物 661,350 人（CBDB）」
- 新增 `.github/workflows/rebuild-cbdb.yml`：手动触发重建 CBDB 索引并提交（上游发布新版时使用）
- `.gitignore` 增加 `/tmp/`，防止 585MB SQLite 临时数据入库

## [1.5.1] - 2026-09-10

### 新增（CBDB 人名补全与简繁搜索修复）
- 人物搜索新增人名补全（输入任意字补全 CBDB 人名）；修复简繁互查（简体查询命中繁体原名），与后续 v1.9.0 的多级检索同源演进

## [1.4.6] - 2026-09-12

### 修复（CBDB 人物库姓氏分片 404）
- 修复人物库大姓详情/列表加载报错「姓氏分片加载失败: 404」：`scripts/build-cbdb-index.mjs` 曾用 `encodeURIComponent(surname)` 作为磁盘文件名（字面量 `%E6%9D%8E.json`），而前端 `lib/cbdb.ts` 请求同一编码路径，静态服务器解码 `%E6%9D%8E`→「李」后在磁盘找不到「%E6%9D%8E.json」导致 404
- 将 `public/index/cbdb/surnames/` 下 480 个 URL 编码分片文件名还原为真实中文名（如 `%E6%9D%8E.json`→`李.json`），与 fetch 解码结果一致；`build-cbdb-index.mjs` 改为写入真实中文文件名（meta 仍存 URL 安全路径），避免重建复发

## [1.4.5] - 2026-09-10

### 文档（冗余清理收尾）
- 修复删除 `components/CatalogSearchResults.tsx` 后在 `docs/10-用户研究与需求洞察/02-用户旅程地图.md` 遗留的悬空引用（改为已实现 SearchClient 书目检索）
- 将 CHANGELOG 中早于 package.json 的 1.5.0–1.8.0 超前草稿归入「未发布」区，消除版本号错位

## [1.4.4] - 2026-09-10

### 修复（冗余清理）
- 删除孤立且功能重复的组件 `components/CatalogSearchResults.tsx`（其书目检索能力已由 `components/SearchClient.tsx` + `lib/search.ts` 实现并上线，全仓零 import 引用）
- 移除 `lib/catalog.ts` 中未被调用的死代码 `groupByCategory()`

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
- 原型 `prototype/`：新增 `pages/license.html`、`data-source.html`、`disclaimer.html`、`feedback.html` 四个独立页（静态内容镜像线上页）；`prototype.html` 与 9 个 `pages/*.html` 页脚四项链接由统一 `./help.html`（`#page-help`）拆为分别指向四个独立页

### 调整（顶部导航精简）
- `components/Navbar.tsx`：顶部导航移除「数据统计」「开源协议 / 数据来源 / 免责声明 / 反馈渠道」，仅保留核心功能入口（首页 / 全馆藏 / 检索 / 人物考据 / 社会关系 / 帮助）
- `components/Footer.tsx`：页脚新增「数据统计」链接（置于四项合规链接之后）
- 原型 `prototype/`：14 个文件同步——导航移除「数据统计」（枢纽用 `#page-stats` 锚点、各页用 `./stats.html`，含移动端折叠菜单），页脚新增对应链接（枢纽用 `./pages/stats.html`、各页用 `./stats.html`）

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

<!-- 版本比较链接：由 scripts/sync-changelog-links.mjs 生成，勿手改；新增版本后重跑该脚本 -->
[未发布]: https://github.com/sutchan/ancient-book-lib/compare/v1.14.0...HEAD
[1.14.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.13.2...v1.14.0
[1.13.2]: https://github.com/sutchan/ancient-book-lib/compare/v1.13.1...v1.13.2
[1.13.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.13.0...v1.13.1
[1.13.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.11.0...v1.13.0
[1.11.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.5.1...v1.8.0
[1.5.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.4.6...v1.5.1
[1.4.6]: https://github.com/sutchan/ancient-book-lib/compare/v1.4.5...v1.4.6
[1.4.5]: https://github.com/sutchan/ancient-book-lib/compare/v1.4.3...v1.4.5
[1.4.3]: https://github.com/sutchan/ancient-book-lib/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/sutchan/ancient-book-lib/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.8...v1.4.0
[1.3.8]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.7...v1.3.8
[1.3.7]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.6...v1.3.7
[1.3.6]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.5...v1.3.6
[1.3.5]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.9...v1.3.0
[1.2.9]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.8...v1.2.9
[1.2.8]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.6...v1.2.8
[1.2.6]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.3...v1.2.6
[1.2.3]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/sutchan/ancient-book-lib/compare/v1.2.0...v1.2.2
[1.2.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/sutchan/ancient-book-lib/releases/tag/v1.0.0

<!--
  以下版本在 CHANGELOG 中有条目，但提交信息与 package.json 均无可靠落点，
  故不打标签、不生成链接：
  1.1.1 / 1.2.1 / 1.2.4 / 1.2.5 / 1.2.7 / 1.2.10 / 1.4.4 / 1.5.0 / 1.6.0 / 1.7.0

  以下版本因目标提交已被其它版本认领而让位（避免同一 commit 承载两个版本号）：
  1.2.1（package.json 落点 903cd36 已被 v1.2.0 占用） / 1.4.4（package.json 落点 9b61040 已被 v1.8.0 占用）
-->