# 古籍通 AncientBook｜GitHub Actions 构建加速任务清单

**制定日期**：2026-09-13
**对应版本**：v1.15.1
**适用范围**：`.github/workflows/deploy.yml`（Build & Deploy）、`.github/workflows/rebuild-cbdb.yml`
**目标**：缩短 `Build & Deploy` 工作流墙钟时间，重点消除「每次 main 推送重下 4.9GB 上游 TXT + 全量分词」。

---

## 一、现状与耗时构成

工作流分两段（`deploy.yml`）：

- `check`：`tsc --noEmit` + `npm test`（快速反馈门禁，push/PR 均跑）
- `build`：`build:catalog` → `Restore heavy index cache` → `build:fulltext` → `next build` → 上传产物（main / 手动；PR 跳过重型索引）

| 步骤 | 现状实现 | 耗时/说明 |
|---|---|---|
| checkout / setup-node / npm ci | 两个 job 各执行一次 | `setup-node` 的 `cache: npm` 只缓存 `~/.npm` 下载缓存 |
| `build:catalog` | 每次调 GitHub Trees API（15,694 节点） | 输出经 `scripts/build-daizhige-catalog.mjs` 写入 |
| Restore heavy index cache | `key: fulltext-${{ hashFiles('public/index/daizhige-catalog.json') }}` | ⚠️ 见 P0-A |
| `build:fulltext` | 逐本 fetch 15,694 个 TXT（约 4.9GB）+ 单线程分词 + 章节偏移 | 冷启动数十分钟 |
| `next build` | SSG 全量导出（`out/`） | 约 145s |
| upload artifact | `out/`（保留 7 天） | — |

---

## 二、关键问题与根因

### P0-A：全文索引缓存**永不命中**（最高收益，实为缺陷）

- **证据**：`scripts/build-daizhige-catalog.mjs:71` 写入 `generatedAt: new Date().toISOString()`；`.github/workflows/deploy.yml:89` 缓存键为 `hashFiles('public/index/daizhige-catalog.json')`。
- **因果链**：`build:catalog` 每次运行都生成新的时间戳 → 该 JSON 内容与哈希每次变化 → 缓存键每次不同 → `actions/cache` 永远 miss → `build:fulltext`（4.9GB 下载 + 全量分词）**每次 main 推送都完整重跑**。
- **影响**：代码注释与设计意图（`deploy.yml:78-80`「命中时跳过 4.9GB 重下载…降为秒级复用」）**从未生效**。这是当前 CI 慢的第一根因。

### P0-B：重型 build 对生产（EdgeOne）无直接贡献

- **证据**：`deploy.yml:131` 部署 job 条件为 `vars.ENABLE_PAGES == 'true'`；生产站由腾讯云 **EdgeOne Pages 自行拉取仓库构建** `out/`，不消费 GitHub Actions 的 artifact。
- **推论**：默认 `ENABLE_PAGES` 未开启时，GH Actions 的 `build`（含 4.9GB 下载）仅作「编译校验」，与生产无关 → 每次 main 推送的重型构建**可能是纯开销**。

---

## 三、改进任务清单（按收益 / 成本排序）

### P0 · 立即可做（高收益 / 低成本）

- [ ] **C1 修复全文索引缓存键（最高优先级）**
  - 方案 A（推荐）：缓存键改用**上游文件树 SHA**——Trees API 响应顶层即返回 `sha`（`scripts/build-daizhige-catalog.mjs` 取 `data.sha` 输出到 `$GITHUB_OUTPUT`），`key: fulltext-${{ steps.catalog.outputs.tree_sha }}`。该 SHA 仅在上游变更时改变。
  - 方案 B：把 `generatedAt` 移出被哈希的产物（写入独立 `public/index/catalog-meta.json`），使 `daizhige-catalog.json` 内容确定化。
  - **验收**：上游未变时连续两次 main 推送，第二次日志出现 `index-cache` 命中且 `build:fulltext` 步骤被跳过。
- [ ] **C2 建立耗时基线**：为 `build:catalog` / `fulltext` / `next build` 输出步骤耗时（`$GITHUB_STEP_SUMMARY` 或时间戳日志），用于验证 C1 收益并发现回退。

### P1 · 短期（结构性与复用）

- [ ] **C3 缓存 catalog 本身**：以 Tree SHA 为键缓存 `public/index/daizhige-catalog.json`，命中则跳过 `build:catalog`（省一次 Trees API + 写盘）。
- [ ] **C4 路径过滤**：`on.push.paths-ignore`（`docs/**`、`**.md`、`prototype/**`、`LICENSE` 等）；纯文档/原型变更不触发 `build` job（`check` 可视需要保留）。
- [ ] **C5 减少重复安装**：`check` 与 `build` 各跑一次 `npm ci`；可缓存 `node_modules`（按 `package-lock.json` 哈希）或合并为一个 job。
- [ ] **C6 厘清生产构建归属**：核对 EdgeOne 构建命令（`build:fulltext && build`）与 GH Actions 是否重复；若 Pages 不启用，将重型 `build` 改为 `workflow_dispatch` 或 `ENABLE_PAGES=true` 时触发（可能直接省掉整个重型 job）。

### P2 · 中期（算法与并行）

- [ ] **C7 分词并行化**：`scripts/build-fulltext-index.mjs` 的分词/章节解析为**单线程 CPU**（`CONCURRENCY=8` 仅重叠 I/O，墙钟 ≈ 下载时间 + CPU 时间）；改用 Node `worker_threads` 按核并行，或将「并发下载」与「并行分词」两阶段解耦。
- [ ] **C8 下载策略优化**：15,694 次 HTTP 请求可提高并发（8 → 16/32，注意上游限流），或改 `git clone --depth 1 --filter=blob:none` 稀疏检出（一次克隆替代万次请求）；下载优先走 jsDelivr / statically CDN 镜像。
- [ ] **C9 `next build` 缓存**：缓存 `.next/cache`（`actions/cache`），降低重复构建耗时。
- [ ] **C10 大缓存体积治理**：实测 `fulltext-index.json` / `chapters.json` 体积（脚本末尾会打印），评估缓存上传/下载成本与 10GB 仓库配额，必要时改为分层缓存或 artifact。

### P3 · 长期（可选）

- [ ] **C11** `npm ci --prefer-offline`；CI 内避免 `npx`，改用本地二进制（`node node_modules/typescript/bin/tsc`）。
- [ ] **C12** 补 CI 预算表（步骤预算 × 冷/热路径），与既有分级 `timeout-minutes`（作业 90 / fulltext 60 / catalog 15 / build 25）配套。

---

## 四、预期收益（估算）

| 场景 | 改前 | 改后 |
|---|---|---|
| main 推送（上游未变） | 数十分钟（`fulltext` 必跑） | 缓存命中，**分钟级** |
| main 推送（仅文档变更） | 触发完整重型构建 | 跳过 `build`（C4） |
| PR | 已跳过重型索引（现状良好） | 维持 |
| 上游数据变更 | 数十分钟（应为预期） | 同上（缓存未命中属正常） |

---

## 五、风险与注意

- C1 方案 A 需 `build-daizhige-catalog.mjs` 输出 `data.sha`；注意 Trees API 偶发 `truncated=true`（脚本已告警）。
- GitHub Actions 缓存单仓库上限 10GB，超限会 LRU 淘汰；大产物缓存需配合 C10 治理。
- `ENABLE_PAGES`、`PAGES_CUSTOM_DOMAIN` 为仓库变量，改动 CI 前先确认其现状。
- 本清单仅涉及 GitHub Actions；**不改动**生产 EdgeOne 的构建链路。
- 落地时遵循仓库「每次修改 bump 最小版本 + 仅更新被改文件头注释」规范。

---

## 六、参考

- `.github/workflows/deploy.yml`（步骤 L73–L127、缓存键 L89、部署条件 L131）
- `.github/workflows/rebuild-cbdb.yml`（CBDB 索引重建，手动触发，产物入库）
- `scripts/build-daizhige-catalog.mjs`（L71 `generatedAt`）
- `scripts/build-fulltext-index.mjs`（L69 `CONCURRENCY`、L127 `worker`、L159–L161 主流程）
- [`项目部署上线规范.md`](./项目部署上线规范.md) §5 部署流水线（CI/CD）
