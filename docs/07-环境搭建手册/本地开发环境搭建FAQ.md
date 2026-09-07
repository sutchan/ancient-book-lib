# 古籍通 AncientBook｜本地开发环境搭建FAQ

**文档版本**：V1.0 正式定稿

本手册面向零基础开发者，逐步完成本地环境搭建、依赖安装、项目启动、常见问题排查。

## 一、环境要求

| 软件 | 版本要求 | 用途 |
|-|-|-|
| Node.js | 18.0+（推荐 LTS 20.x） | 运行 Next.js 项目 |
| npm | 9.0+ | 包管理器 |
| Git | 任意较新版本 | 克隆仓库、版本管理 |
| 浏览器 | Chrome / Edge / Safari / Firefox | 本地预览 |

## 二、零基础搭建步骤

### 1. 安装 Node.js

1. 访问 Node.js 官网（nodejs.org），下载 LTS 版本
2. 双击安装包，一路「下一步」完成安装
3. 安装完成后打开命令行验证：

```bash
node -v
npm -v
```

### 2. 克隆项目仓库

```bash
git clone https://github.com/sutchan/ancient-book-lib.git
cd ancient-book-lib
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动本地开发

```bash
npm run dev
```

浏览器访问 http://localhost:3000 即可预览。

### 5. 静态构建与预览

```bash
npm run build
npm run start
```

## 三、常见问题FAQ

### Q1：npm install 报错怎么办？

- 优先检查 Node.js 版本是否符合要求（node -v）
- 尝试清除缓存重装：`npm cache clean --force` 后重新 `npm install`
- 国内网络可配置淘宝镜像：`npm config set registry https://registry.npmmirror.com`

### Q2：npm run dev 启动失败 / 端口被占用？

- 默认端口3000被占用时，使用 `npm run dev -- -p 3001` 指定其他端口
- 检查是否有其他Node进程占用端口

### Q3：构建（npm run build）报错？

- 检查是否遗留 console.log、未使用的导入等 lint 问题
- 检查 TypeScript 类型错误：`npx tsc --noEmit`
- 检查静态索引文件是否已放入 src/static-index/

### Q4：为什么项目没有数据库配置？

项目为**纯静态无数据库架构**，这是刻意设计，无需也不允许配置任何数据库。所有检索能力基于前端内存检索静态索引实现。

### Q5：如何更新古籍索引数据？

1. 本地运行离线预处理脚本（scripts/ 目录）
2. 生成新的静态索引文件
3. 提交仓库，重新构建部署

### Q6：离线预处理脚本在哪执行？

预处理仅在本地开发环境执行（scripts/ 目录下的分块、索引构建脚本），线上绝不执行。

### Q7：本地如何查看高保真原型？

直接双击打开 prototype/prototype.html，或通过浏览器访问 prototype 目录下各页面文件，无需启动服务。

## 四、开发提交规范提醒

- 提交信息格式：`feat: 新增功能` / `fix: 修复缺陷` 等
- 提交前必须通过 lint 与类型检查（`npx tsc --noEmit`）
- 禁止提交 console.log 调试代码与敏感信息

## 五、社区协作文档入口

| 文档 | 用途 |
| - | - |
| `.github/CONTRIBUTING.md` | 贡献指南：架构边界、分支与提交规范、PR 流程 |
| `.github/CODE_OF_CONDUCT.md` | 行为准则 |
| `.github/SECURITY.md` | 安全策略与漏洞私下报告方式 |
| `.github/SUPPORT.md` | 支持与帮助、常见问题速查 |
| `CHANGELOG.md` | 版本更新日志 |

提交 Issue 时请使用 `.github/ISSUE_TEMPLATE/` 中的模板（缺陷 / 功能建议 / 内容勘误）。
