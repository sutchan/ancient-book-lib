# 古籍通 AncientBook

**开源古籍文献检索阅读平台**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![架构](https://img.shields.io/badge/架构-纯静态%20·%20零数据库-2e9e6b)](docs/02-架构与开发规范/项目架构设计文档.md)
[![开源](https://img.shields.io/badge/开源-公益非商用-blue)](docs/01-项目基础说明/开源合规声明规范.md)
[![贡献](https://img.shields.io/badge/贡献-欢迎%20PR-orange)](.github/CONTRIBUTING.md)

- 工程仓库名：`ancient-book-lib`
- 架构：纯静态 · 无数据库 · Next.js 14 SSG · 前端内存检索 · 上游 raw URL 按需加载（零 TXT 复制）
- 资源：殆知阁 v20 全量 15,694 部 / 4.9GB 古籍，托管于 garychowcmu/daizhigev20；本仓库仅存 5.7MB 书目索引，阅读时按需 fetch
- 定位：公益开源 · 零广告 · 零注册 · 零付费 · 不收集个人隐私（仅匿名访问统计，GA4）
- 统计：Google Analytics 4（`G-H76XG9L6FZ`），IP 匿名化，仅聚合访问数据
- 当前版本：**v1.2.8**（v1.2.4 Actions 升级 Node 24；v1.2.5 原型页脚改为数据统计；v1.2.6 修复生产站点 basePath 导致的全站资源 404，sitemap/robots 改为生产域名；v1.2.7 书目页移除冗余数据源说明文本；v1.2.8 人物数据改为从书籍作者派生、剔除示范人物）
- 线上站点：https://guji.ewuse.com/（腾讯云 EdgeOne Pages 托管）

| 文档 | 说明 |
| --- | --- |
| [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) | 贡献指南：环境搭建、架构边界、分支与提交规范、PR 流程 |
| [`.github/CODE_OF_CONDUCT.md`](.github/CODE_OF_CONDUCT.md) | 行为准则：社区互动规范与举报渠道 |
| [`.github/SECURITY.md`](.github/SECURITY.md) | 安全策略：静态架构攻击面与漏洞私下报告方式 |
| [`.github/SUPPORT.md`](.github/SUPPORT.md) | 支持与帮助：自助路径、提问渠道、常见问题 |
| [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) | PR 模板与自检清单 |
| [`CHANGELOG.md`](CHANGELOG.md) | 版本更新日志 |
| [`docs/05-设计规范与原型/品牌资料使用规范.md`](docs/05-设计规范与原型/品牌资料使用规范.md) | 品牌资料：logo 规格、图标尺寸、颜色令牌与生成脚本 |

提交内容勘误（原文、繁简映射、人物考据）请使用专门的 [勘误模板](https://github.com/sutchan/ancient-book-lib/issues/new?template=content-errata.yml)，需附史料来源。

## 开源协议与合规

- 本项目为**非商用公益开源项目**，古籍资源遵循上游开源协议（殆知阁开源古籍资源）
- 学术数据遵循哈佛 CBDB、中研院史语所、北大公开学术数据集的公开学术协议
- 禁止商用、二次售卖、篡改后伪造成原创资料库
- 仅供文化传播与学术研究使用，详见 [`docs/01-项目基础说明/开源合规声明规范.md`](docs/01-项目基础说明/开源合规声明规范.md)
