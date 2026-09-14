# 文案精简与一致性审计清单（string-audit）

- **生成日期**：2026-09-14
- **范围**：`app/`（路由页）+ `components/`（共享组件）的全部用户可见文案；不含 `prototype/` 演示站、代码注释、标识符与 CSS。
- **方法**：逐文件提取可见字符串（heading / nav / button / placeholder / empty-state / tooltip / aria / stat / label），按「重复冗余 / 冗长啰嗦 / 术语口径 / 中英混排」四类判定。
- **交付物**：仅本清单，**未修改任何代码**（按约定 Q4-a）。
- **优先级**：P0=高（重复 + 维护风险，发版易不同步）；P1=中（口径/语气不一致，影响体验统一）；P2=低（可缩短但不影响理解）。

---

## 一、执行摘要

| 类别 | 条目数 | 代表问题 |
|------|-------|---------|
| 魔法数字 / 硬编码统计 | 5 | `15,694 部`、`661,350 人`、`殆知阁 v20` 多处写死 |
| 检索入口措辞不一致 | 1 | 三处搜索框 placeholder 三种写法 |
| 空状态语气不统一 | 1 | 三套「无结果」文案三种声音 |
| 错误页文案重复 | 1 | `错误编号：`/`重试`/`返回首页` 跨页重复 |
| 中英混排 / 品牌名 | 1 | `古籍通 AncientBook` 呈现规则不统一 |
| 冗长可缩短 | 4 | hero 徽章、书籍说明、缓存提示等 |
| 命名口径不统一 | 1 | 全馆藏 / 全馆藏书目 / 浏览全馆藏 |
| 数字格式混用 | 1 | 万 vs 逗号精确数 |
| 可常量化按钮标签 | 1 | `阅读/详情/移除/导出书单` 多处重复 |

---

## 二、详细清单

### P0 — 魔法数字 / 硬编码统计（发版易不同步）

| ID | 位置 | 现状 | 建议 | 优先级 |
|----|------|------|------|-------|
| S-01 | `app/page.tsx:15`、`:42`、`app/not-found.tsx:15`、`app/catalog/page.tsx:7`、`app/catalog/CatalogInner.tsx:86` | `15,694 部` 在 5 处写死 | 抽为常量 `BOOK_COUNT`（如 `lib/constants.ts`），统一引用 | P0 |
| S-02 | `app/page.tsx:45`、`:79` | `661,350 人` 写死 2 处 | 抽为 `PERSON_COUNT` 常量 | P0 |
| S-03 | `app/page.tsx:14`、`app/catalog/CatalogInner.tsx:94`、`app/catalog/book/CatalogBookInner.tsx:106`、`app/layout.tsx`(SEO) | `殆知阁 v20` 写死 4+ 处 | 抽为 `DATA_SOURCE` / `DATA_VERSION` 常量（版本号已用 `APP_VERSION` 体系，建议同源） | P0 |
| S-04 | `app/page.tsx:17`、`app/catalog/book/CatalogBookInner.tsx:106`、`components/reader/ReaderPanels.tsx:37` | 「原始数据 4.9GB…」「…托管于上游数据源」「…自动缓存到本地」三处措辞各异 | 统一「数据来源 + 缓存说明」为一段共享文案 | P0 |
| S-05 | `app/page.tsx:85` | `CBDB 亲属 56.1 万条 + 社会关系 19 万条` 写死 | 抽为常量或改为动态统计 | P0 |

### P1 — 术语 / 口径不一致

| ID | 位置 | 现状 | 建议 | 优先级 |
|----|------|------|------|-------|
| S-06 | `app/page.tsx:22`、`app/catalog/CatalogInner.tsx:104`、`components/SearchClient.tsx:94` | 三处搜索框：「检索古籍书名、内容、人物」「搜索书名（如：论语、金刚经、史记）」「输入关键词，如：论语、仁义、孔子」——动词（检索/搜索/输入关键词）与示例均不同 | 统一为一套入口文案（主动词建议统一用「搜索」或「检索」其一） | P1 |
| S-07 | `app/not-found.tsx:8-9`、`app/catalog/CatalogInner.tsx:173-174`、`components/SearchClient.tsx:156-159` | 三套「无结果」空状态：文言「此卷不在架上 / 您要找的内容不在书架之上」、直白「未找到匹配古籍 / 请尝试更换关键词」、文艺「未寻得此卷 / 书海无涯…」 | 抽象为统一的 `<EmptyState>` 文案模板（标题 + 行动提示），区分「页面不存在」与「搜索无结果」两类 | P1 |
| S-08 | `components/Navbar.tsx:17`、`app/catalog/CatalogInner.tsx:91`、`app/book-list/page.tsx:10`、`app/catalog/book/CatalogBookInner.tsx:93` | 命名不统一：`全馆藏`（导航）、`全馆藏书目`（标题/面包屑）、`浏览全馆藏`（首页按钮）、`全馆藏`（书籍页面包屑） | 确定唯一规范名「全馆藏」，其余统一 | P1 |
| S-09 | `app/page.tsx:45,79,85`、`app/catalog/CatalogInner.tsx:96` | 数字格式混用：`661,350 人`（逗号精确）、`56.1 万条`（万）、`15,694 部`（逗号） | 提供统一数字格式函数（如 `formatCount`，按需「万/亿」或千分位） | P1 |
| S-10 | `app/layout.tsx`、`components/Navbar.tsx:74`、`components/Footer.tsx:22` | 品牌呈现：`古籍通`、`古籍通 AncientBook`（aria）、`古籍通 AncientBook · 开源公益…` | 定义 `BRAND`（带/不带英文）两套常量，明确各场景用哪套 | P1 |

### P1 — 错误页文案重复

| ID | 位置 | 现状 | 建议 | 优先级 |
|----|------|------|------|-------|
| S-11 | `app/error.tsx:25,28,32,35`、`app/global-error.tsx:18,20,22` | `错误编号：`、`重试`、`返回首页` 在两套错误边界各写一遍；标题「页面出错了 / 应用出错了」近义 | 抽共享 `ErrorBlock` 组件 + 常量文案；区分「页面级/应用级」仅换标题 | P1 |

### P2 — 冗长可缩短

| ID | 位置 | 现状 | 建议 | 优先级 |
|----|------|------|------|-------|
| S-12 | `app/page.tsx:17` | `原始数据 4.9GB 托管于上游数据源 · 阅读时按需加载` | 可拆为「数据 4.9GB · 按需加载」 | P2 |
| S-13 | `app/catalog/book/CatalogBookInner.tsx:106` | `本书来自殆知阁 v20 开源古籍库，原始文本托管于上游数据源。阅读时按需加载原文，自动缓存至本地。` | 与 S-04 合并为共享短句 | P2 |
| S-14 | `app/bookmarks/page.tsx:77` | `收藏保存在本机浏览器，跨会话保留，不与服务器同步。` | 可缩为「收藏仅存于本机浏览器」 | P2 |
| S-15 | `components/reader/ReaderPanels.tsx:32-37` | ⚠️ 大文件提示整段偏长（两行说明 + 建议） | 保留关键信息，压为一行 | P2 |

### P2 — 可常量化的重复按钮标签

| ID | 位置 | 现状 | 建议 | 优先级 |
|----|------|------|------|-------|
| S-16 | `components/catalog/CatalogBookRow.tsx:47,52`、`app/catalog/book/CatalogBookInner.tsx:110,116,118,120`、`components/SearchClient.tsx:97,106,113` 等 | `阅读`/`详情`/`移除`/`加入书签`/`导出书单`/`搜索`/`标题检索`/`全文检索` 在多处重复出现 | 建议引入轻量文案常量或 `i18n` 字典，避免改一处漏多处 | P2 |

---

## 三、重复字符串出现位置索引（便于整改时一并替换）

| 字符串 | 出现位置 |
|--------|---------|
| `15,694 部` | page.tsx:15, :42；not-found.tsx:15；catalog/page.tsx:7；CatalogInner.tsx:86 |
| `661,350 人` | page.tsx:45, :79 |
| `殆知阁 v20` | page.tsx:14；CatalogInner.tsx:94；CatalogBookInner.tsx:106；layout.tsx(SEO) |
| `古籍通 AncientBook` | layout.tsx；Navbar.tsx:74(aria)；Footer.tsx:22 |
| `错误编号：` | error.tsx:28；global-error.tsx:20 |
| `重试` | error.tsx:32；global-error.tsx:22 |
| `返回首页` | error.tsx:35；not-found.tsx:12；book-list/page.tsx:12 |
| `全馆藏` / `全馆藏书目` / `浏览全馆藏` | Navbar.tsx:17；CatalogInner.tsx:91,94；book-list/page.tsx:10；CatalogBookInner.tsx:93；page.tsx:42 |
| `阅读` / `详情` | CatalogBookRow.tsx:47,52；CatalogBookInner.tsx:110 等 |
| `搜索` / `标题检索` / `全文检索` | page.tsx:37；SearchClient.tsx:97,106,113 |
| `自动缓存到本地` / `加载后会自动缓存到本地` | CatalogBookInner.tsx:106；ReaderPanels.tsx:37 |

---

## 四、建议整改路径（不在本次范围）

1. **建常量层** `lib/constants.ts`：`BOOK_COUNT`、`PERSON_COUNT`、`DATA_SOURCE`、`DATA_VERSION`、`BRAND`、`BRAND_FULL`，并接入已有的 `APP_VERSION` / `BUILD_DATE` 注入体系。
2. **统一搜索入口**：抽 `SearchPlaceholder` 常量，三处复用。
3. **抽象空状态**：`<EmptyState title hint cta>` 组件，覆盖 404 / 书目无结果 / 检索无结果。
4. **错误边界合并**：`ErrorBlock` 组件 + 文案常量。
5. **数字格式化**：`formatCount(n)` 统一万/亿/千分位。
6. 完成后逐条对照本清单勾除（S-01 ~ S-16）。

---

## 五、执行状态（2026-09-14）

已按本清单执行整改（范围：`app/` + `components/`，不含 `prototype/` 与文档/README/CHANGELOG）：

- **新增 `lib/constants.ts`**：集中 `BOOK_COUNT / PERSON_COUNT / DATA_SOURCE / DATA_SIZE_GB / REL_KIN_COUNT / REL_SOC_COUNT / BRAND / BRAND_FULL`，以及展示用 `BOOK_COUNT_LABEL / PERSON_COUNT_LABEL / SEARCH_PLACEHOLDER / EMPTY_RESULT_TITLE / EMPTY_RESULT_HINT`。`APP_VERSION / BUILD_DATE` 仍由 `components/Footer.tsx` 从 `package.json` 注入，保持单一来源。
- **新增 `components/EmptyState.tsx`**（统一空状态）与 **`components/ErrorBlock.tsx`**（统一错误提示）。
- **S-01~S-05、S-10**：全部硬编码数字与品牌名改为常量引用，覆盖首页、catalog、search、people、help、data-source、character、relation、stats、layout SEO 等约 20 个文件。
- **S-06**：三处搜索框占位统一为 `SEARCH_PLACEHOLDER`。
- **S-07**：全馆藏筛选无结果 / 检索无结果统一为 `EMPTY_RESULT_TITLE / EMPTY_RESULT_HINT`（保留检索页「试试」建议）。
- **S-08**：命名统一为「全馆藏」（catalog 标题与面包屑、`category`/`book-list` 按钮「前往全馆藏」）。
- **S-11**：`error.tsx` 与 `global-error.tsx` 改用 `ErrorBlock`，集中「错误编号：/重试/返回首页」文案。
- **S-09**：数字展示统一为千分位（`BOOK_COUNT_LABEL / PERSON_COUNT_LABEL`）；关系数保持「万」级（量级不同，语义合理）。
- **S-12、S-13**：缩短 hero 徽章与书籍说明文案。
- **S-14、S-15**：缩短书签说明与大文件提示文案。
- **S-16（按钮标签常量化）**：评估为低收益、改动面大，暂未执行，留作后续可选优化。

**残留说明**：仅 `app/character/page.tsx:2` 的代码注释中仍含数字（属注释，非可见文案，按审计范围排除）。

**验证**：`read_lints` 通过（0 诊断）。
