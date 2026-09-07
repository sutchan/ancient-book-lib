# 古籍通 AncientBook

**开源古籍文献检索阅读平台**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![架构](https://img.shields.io/badge/架构-纯静态%20·%20零数据库-2e9e6b)](docs/02-架构与开发规范/项目架构设计文档.md)
[![开源](https://img.shields.io/badge/开源-公益非商用-blue)](docs/01-项目基础说明/开源合规声明规范.md)
[![贡献](https://img.shields.io/badge/贡献-欢迎%20PR-orange)](.github/CONTRIBUTING.md)

- 工程仓库名：`ancient-book-lib`
- 架构：纯静态 · 无数据库 · Next.js 14 SSG · 前端内存检索 · GitHub Range 分片懒加载
- 资源：殆知阁开源十大藏库 5GB 纯 TXT 古籍
- 定位：公益开源 · 零广告 · 零注册 · 零付费 · 不收集个人隐私（仅匿名访问统计，GA4）
- 统计：Google Analytics 4（`G-H76XG9L6FZ`），IP 匿名化，仅聚合访问数据
- 当前版本：**v1.0.2**

## 快速开始

```bash
git clone https://github.com/sutchan/ancient-book-lib.git
cd ancient-book-lib
npm install
npm run dev              # 本地开发 http://localhost:3000
```

其他常用命令：

```bash
npm run build            # 静态构建，产物输出到 out/
npm run build:index      # 由 prototype/data/app-data.js 生成 lib/data-generated.ts
npx serve out            # 预览静态产物（开启 output: export，next start 不适用）
npx tsc --noEmit         # TypeScript 类型检查
```

> Node.js ≥ 18（推荐 LTS 20.x）、npm ≥ 9。端口占用时可用 `npm run dev -- -p 3001`。

原型预览：直接用浏览器打开 `prototype/prototype.html` 即可，无需启动服务。

## 自动部署（GitHub Pages）

本仓库内置 GitHub Actions 工作流（`.github/workflows/deploy.yml`），推送 `main` 分支自动执行：安装依赖 → 同步数据（`build:index`）→ 全量静态构建 → 单元测试 → 部署 GitHub Pages。

启用步骤（一次性）：

1. 打开仓库 **Settings → Pages**；
2. **Source** 选择 **GitHub Actions**；
3. 推送任意提交到 `main`，Actions 中的 `Build & Deploy to GitHub Pages` 工作流自动运行；
4. 部署完成后访问 `https://<用户名>.github.io/ancient-book-lib/`。

> 工作流仅对 `main` 分支推送/手动触发（`workflow_dispatch`）时部署；PR 只跑构建与测试，不部署。

## 目录结构

```plain
ancient-book-lib/
├── app/            # Next.js 页面（book-list / category / character / help /
│                   # read / relation / search / stats，全部 SSG）
├── components/     # 全局公共组件（Navbar、Footer、ReaderClient、SearchClient...）
├── lib/            # 类型定义、检索引擎、繁简映射、生成数据
├── scripts/        # 离线预处理脚本（build-index.mjs）
├── prototype/      # 高保真可交互原型（prototype.html + pages/ + data/）
├── public/         # 静态资源
├── docs/           # 全套项目规范、PRD、任务清单、设计文档
└── .github/        # 社区健康文件（贡献指南 / 行为准则 / 安全策略 / 支持 / 模板）
```

## 项目文档导航

```
docs/
├── 01-项目基础说明/        README、品牌定名、项目概述、开源合规
├── 02-架构与开发规范/      架构、目录结构、代码规范、索引预处理、分片请求、性能、Git规范
├── 03-产品需求PRD/         V1.0上线版PRD（终审）、古籍价值增量、历史版本
├── 04-开发任务清单/        V1.0精简版开发任务清单
├── 05-设计规范与原型/      UI/UX全局设计规范、Figma原型建模清单
├── 06-部署与迭代/          部署上线规范、版本迭代管理规范
├── 07-环境搭建手册/        本地开发环境搭建FAQ
└── 08-技术方案研究/        5GB存储分析、无数据库检索方案、PRD缺陷复盘

prototype/                高保真可交互原型
├── prototype.html         全站高保真可交互原型（三套主题+真实数据+路由跳转）
├── wireframes.html        组件库规范（基础/复合/业务组件+使用规则）
├── assets/                原型全局样式、主题变量、交互脚本
├── pages/                 独立页面原型（index.html 等8个页面）
└── data/                  真实业务模拟数据（书籍/检索/人物）
```

## 参与共建

| 文档 | 用途 |
| - | - |
| [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) | 贡献指南：环境搭建、架构边界、分支与提交规范、PR 流程 |
| [`.github/CODE_OF_CONDUCT.md`](.github/CODE_OF_CONDUCT.md) | 行为准则：社区互动规范与举报渠道 |
| [`.github/SECURITY.md`](.github/SECURITY.md) | 安全策略：静态架构攻击面与漏洞私下报告方式 |
| [`.github/SUPPORT.md`](.github/SUPPORT.md) | 支持与帮助：自助路径、提问渠道、常见问题 |
| [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) | PR 模板与自检清单 |
| [`CHANGELOG.md`](CHANGELOG.md) | 版本更新日志 |

提交内容勘误（原文、繁简映射、人物考据）请使用专门的 [勘误模板](https://github.com/sutchan/ancient-book-lib/issues/new?template=content-errata.yml)，需附史料来源。

## 开源协议与合规

- 本项目为**非商用公益开源项目**，古籍资源遵循上游开源协议（殆知阁开源古籍资源）
- 学术数据遵循哈佛 CBDB、中研院史语所、北大公开学术数据集的公开学术协议
- 禁止商用、二次售卖、篡改后伪造成原创资料库
- 仅供文化传播与学术研究使用，详见 [`docs/01-项目基础说明/开源合规声明规范.md`](docs/01-项目基础说明/开源合规声明规范.md)
