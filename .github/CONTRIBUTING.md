# 参与共建｜古籍通 AncientBook

感谢你愿意为「古籍通 AncientBook」出一份力。本项目是**公益、非商用、纯静态、零数据库**的古籍文献检索阅读平台，任何有助于「让古籍更好读、更好查、更保真」的改动都欢迎。

> 提 Issue / PR 前请先阅读：[行为准则](CODE_OF_CONDUCT.md) · [支持与帮助](SUPPORT.md) · [安全策略](SECURITY.md)

---

## 一、先理解这个项目的边界

为了保证项目长期可维护，以下几条是**硬性约束**，不符合的改动会被拒绝：

| 约束 | 说明 |
| - | - |
| 禁止引入数据库 | 不使用 MySQL / SQLite / MongoDB / IndexedDB 之外的任何持久化方案 |
| 禁止引入后端检索 | 全部检索逻辑运行在前端内存，禁止新增后端接口 |
| 禁止动态 SSR | 所有页面必须 SSG 静态预渲染（`next.config.mjs` 已开启 `output: "export"`） |
| 禁止线上直读超大原文 | 大文件一律走 HTTP Range 分片懒加载 |
| 禁止服务端存储用户数据 | 用户配置（主题、繁简、字号、阅读进度）只进本地缓存 |
| 禁止商业化改动 | 不得引入广告、付费、注册登录、数据统计埋点、用户内容上传 |
| 古籍原文保持保真 | 不篡改、不删改、不做通用繁简强制转换 |

更完整的约定见 [`docs/02-架构与开发规范/代码开发规范.md`](../docs/02-架构与开发规范/代码开发规范.md)。

---

## 二、环境准备

| 软件 | 要求 |
| - | - |
| Node.js | 18.0+（推荐 LTS 20.x） |
| npm | 9.0+ |
| Git | 任意较新版本 |

```bash
git clone https://github.com/sutchan/ancient-book-lib.git
cd ancient-book-lib
npm install
npm run dev          # http://localhost:3000
```

端口被占用时：`npm run dev -- -p 3001`。

详细排障见 [`docs/07-环境搭建手册/本地开发环境搭建FAQ.md`](../docs/07-环境搭建手册/本地开发环境搭建FAQ.md)。

---

## 三、常用命令

| 命令 | 作用 |
| - | - |
| `npm run dev` | 本地开发 |
| `npm run build:index` | 由 `prototype/data/app-data.js` 生成 `lib/data-generated.ts` |
| `npm run build` | 静态构建（产物输出到 `out/`） |
| `npx serve out` | 预览静态产物（本项目开启 `output: export`，`next start` 不适用） |
| `npm run lint` | 代码检查（仓库尚未内置 ESLint 配置，首次运行按提示初始化） |
| `npx tsc --noEmit` | TypeScript 类型检查（提交前必跑） |

**原型预览**：直接浏览器打开 `prototype/prototype.html`，无需启动服务。

---

## 四、数据来源与索引同步（重要）

- **唯一数据源**：`prototype/data/app-data.js`（馆藏、典籍、人物、关系数据）。
- **禁止手改** `lib/data-generated.ts`，它由 `scripts/build-index.mjs` 自动生成。
- 修改了原型数据后，必须执行：

```bash
npm run build:index
```

- 5GB 古籍原文**不入库、不提交仓库**，线上通过索引字节定位 + 远程 Range 分片调用。

---

## 五、目录结构速览

```plain
ancient-book-lib/
├── app/            # Next.js App Router 页面（book-list / category / character /
│                   # help / read / relation / search / stats，全部 SSG）
├── components/     # 全局公共组件（Navbar、Footer、ReaderClient、SearchClient...）
├── lib/            # 类型定义、检索引擎、繁简映射、生成数据
├── scripts/        # 离线预处理脚本（build-index.mjs）
├── prototype/      # 高保真可交互原型（prototype.html + pages/ + data/）
├── public/         # 静态资源
├── docs/           # 全套项目规范、PRD、任务清单、原型设计文档
└── .github/        # 社区健康文件（本文档所在目录）
```

---

## 六、分支与提交规范

分支体系（详见 [`docs/02-架构与开发规范/Git分支与提交规范.md`](../docs/02-架构与开发规范/Git分支与提交规范.md)）：

- `main`：线上稳定版，**不直接推送**，只接受合并
- `dev`：日常开发主分支，功能分支从这里拉出
- `feature/<功能名>`：功能开发
- `fix/<问题描述>`：缺陷修复（线上紧急 bug 从 `main` 拉）

Commit 格式（强制）：`type: 简要描述`，描述不超过 20 字。

```bash
feat: 新增繁简切换功能
fix: 修复检索高亮错位问题
docs: 更新PRD终审文档
perf: 优化分片请求并发
```

type 取值：`feat` / `fix` / `style` / `docs` / `refactor` / `perf` / `build` / `chore`。

---

## 七、代码规范要点

- 文件与目录 `kebab-case`；组件 `PascalCase`；变量函数 `camelCase`；常量 `UPPER_SNAKE_CASE`
- 颜色一律使用 CSS 变量，禁止写死色值
- 三套主题（日间 / 护眼 / 深色）必须同时兼容
- 移动端点击区域 ≥ 44px；`hover` / `active` / `disabled` 状态必须完整
- 组件优先复用 `components/` 全局组件，禁止重复造样式
- 禁止遗留 `console.log` 调试代码，禁止提交密钥、Token

---

## 八、提交前自检清单

- [ ] `npx tsc --noEmit` 通过
- [ ] `npm run build` 构建无报错
- [ ] 三套主题 + 移动端表现正常
- [ ] 改动过原型数据 → 已执行 `npm run build:index`
- [ ] 无 `console.log`、无密钥、无敏感信息
- [ ] 涉及文档/功能的改动已同步更新 `docs/` 与 `CHANGELOG.md`
- [ ] 未引入数据库、后端接口、广告、埋点、注册登录

---

## 九、Pull Request 流程

1. Fork 仓库并基于 `dev` 创建分支（仓库成员直接从 `dev` 拉分支）
2. 完成开发并跑通第八节自检清单
3. 提交 PR 到 `dev`，填写 [PR 模板](PULL_REQUEST_TEMPLATE.md)
4. 维护者评审（关注：架构约束、保真度、性能、合规）
5. 合并后由维护者统一合入 `main` 并打 tag

---

## 十、合规提醒

- 古籍资源遵循上游开源协议（殆知阁开源古籍资源），**禁止商用、二次售卖、篡改后伪称原创**
- 人物考据数据来源须可溯源（CBDB、中研院史语所、北大公开学术数据集等），不得杜撰史料
- 所有内容仅供学术研究与传统文化传播

详见 [`docs/01-项目基础说明/开源合规声明规范.md`](../docs/01-项目基础说明/开源合规声明规范.md)。
