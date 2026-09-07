# 更新日志

本项目的所有重要变更都会记录在此文件中。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

## [1.0.3] - 2026-09-07

### 优化
- 页脚新增当前版本号显示（构建时从 package.json 读取）

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

[未发布]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/sutchan/ancient-book-lib/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/sutchan/ancient-book-lib/releases/tag/v1.0.0
