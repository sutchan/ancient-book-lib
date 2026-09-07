# 支持与帮助｜古籍通 AncientBook

## 先自助

遇到问题时，按以下顺序查找通常最快：

1. **项目文档中心**：[`docs/`](https://github.com/sutchan/ancient-book-lib/tree/main/docs)
   - `01-项目基础说明`：项目简介、品牌定名、开源合规
   - `02-架构与开发规范`：架构、目录结构、代码规范、分片请求、性能
   - `03-产品需求PRD`：V1.0 上线版需求（终审）
   - `05-设计规范与原型`：UI/UX 全局设计规范、原型清单
   - `06-部署与迭代`：部署上线、版本迭代
   - `07-环境搭建手册`：本地开发环境搭建 FAQ
2. **高保真原型**：直接用浏览器打开 `prototype/prototype.html`，可先看期望效果
3. **历史 Issue**：[问题列表](https://github.com/sutchan/ancient-book-lib/issues?q=is%3Aissue)（可能已有答案）

## 提问渠道

| 场景 | 渠道 |
| - | - |
| 功能缺陷 | [提交 Bug 报告](https://github.com/sutchan/ancient-book-lib/issues/new?template=bug_report.yml) |
| 新功能建议 | [提交功能请求](https://github.com/sutchan/ancient-book-lib/issues/new?template=feature_request.yml) |
| 古籍原文、繁简、考据内容有误 | [提交内容勘误](https://github.com/sutchan/ancient-book-lib/issues/new?template=content-errata.yml) |
| 安全漏洞 | **不要开 Issue**，走 [私密安全公告](https://github.com/sutchan/ancient-book-lib/security/advisories/new) |
| 参与开发 | 阅读 [贡献指南](CONTRIBUTING.md) |

## 常见问题速查

**Q：为什么项目没有数据库？**
刻意设计。5GB 古籍原文入库会严重膨胀且难以运维，本项目采用「离线索引预构建 + 前端内存检索 + Range 分片懒加载」，无需也不允许配置数据库。

**Q：`npm run dev` 启动失败或端口被占用？**
换端口：`npm run dev -- -p 3001`；确认 Node 版本 ≥ 18。

**Q：构建后怎么预览？**
`npm run build` 产物在 `out/`（开启了 `output: export`），用 `npx serve out` 等任意静态服务器预览。

**Q：怎么更新馆藏 / 人物数据？**
改唯一数据源 `prototype/data/app-data.js`，然后执行 `npm run build:index` 重新生成 `lib/data-generated.ts`。

**Q：检索很慢 / 结果为空？**
先确认静态索引已生成且未损坏；检索性能基线为 20–80ms，明显超出请按 Bug 模板提交环境信息。

## 如何支持本项目

本项目为公益非商用项目，**不接受广告投放、付费推广与商业合作**。欢迎用这些方式支持：

- 给仓库点 Star，分享给需要的人
- 提交古籍原文、繁简映射、人物考据的**勘误**（附史料来源）
- 参与文档校对、无障碍与移动端体验改进
- 在学术引用中规范标注来源

## 维护者

- [@sutchan](https://github.com/sutchan)（仓库所有者）
- 响应时间无保障，公益项目维护以志愿者精力为准，感谢理解
