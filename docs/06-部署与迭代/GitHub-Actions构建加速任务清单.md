# 古籍通 AncientBook｜GitHub Actions 构建加速任务清单

**制定日期**：2026-09-13
**对应版本**：v1.15.1（清单制定）→ v1.15.4（C1–C12 落地）
**适用范围**：`.github/workflows/deploy.yml`（Build & Deploy）、`.github/workflows/rebuild-cbdb.yml`
**目标**：缩短 `Build & Deploy` 工作流墙钟时间，重点消除「每次 main 推送重下 5.14GB 上游 TXT + 全量分词」。

---

## 一、现状与耗时构成

工作流分两段（`deploy.yml`）：

- `check`：`tsc --noEmit` + `npm test`（快速反馈门禁，push/PR 均跑）
- `build`：`Resolve upstream tree SHA` → 缓存恢复（catalog / fulltext）→ 按需 `build:catalog` / `build:fulltext` → `next build` → 上传产物

| 步骤 | 实现 | 耗时/说明 |
|---|---|---|
| checkout / setup-node / `npm ci` | 两个 job 各执行一次 | `cache: npm` + `--prefer-offline`（C5/C11） |
| `Resolve upstream tree SHA` | `scripts/resolve-upstream-sha.mjs`，一次**非递归** root tree 调用 | 秒级；所有重型缓存键的唯一来源（C1/C3） |
| `build:catalog` | 仅在 `catalog-<sha>` 缓存未命中时执行 | 15,694 节点 Trees API（C3） |
| `build:fulltext` | 逐本 fetch 15,694 个 TXT（实测 5,140,888,047 B）+ 单线程分词 + 章节偏移 | 冷启动数十分钟；命中缓存则跳过（C1） |
| `Report index cache status and sizes` | 写入 `$GITHUB_STEP_SUMMARY` | 耗时基线 + 产物体积（C2/C10） |
| `next build` | SSG 全量导出（`out/`） | 约 145s；`.next/cache` 复用（C9） |
| upload artifact | `out/`（保留 7 天） | — |

---

## 二、关键问题与根因

### P0-A：全文索引缓存**永不命中**（已修复）

- **证据**：`scripts/build-daizhige-catalog.mjs:71` 写入 `generatedAt: new Date().toISOString()`；缓存键原为 `hashFiles('public/index/daizhige-catalog.json')`。
- **因果链**：`build:catalog` 每次运行都生成新的时间戳 → 该 JSON 内容与哈希每次变化 → 缓存键每次不同 → `actions/cache` 永远 miss → `build:fulltext`（5.14GB 下载 + 全量分词）**每次 main 推送都完整重跑**。
- **影响**：`build` 作业（`timeout-minutes: 60`）被顶到上限并报 `The job has exceeded the maximum execution time of 1h0m0s`。
- **修复（v1.15.4）**：新增 `scripts/resolve-upstream-sha.mjs`，取上游**根 tree SHA**（git 对象内容寻址，仅上游真变更才变）作为唯一缓存键来源；键改为 `fulltext-<tree_sha>`，并在取不到 SHA 时以 `::error::` 硬失败，避免退化成常量键导致「永久命中」错误数据。

### P0-B：重型 build 对生产（EdgeOne）无直接贡献（已收敛）

- **证据**：部署 job 条件为 `vars.ENABLE_PAGES == 'true'`；生产站由腾讯云 **EdgeOne Pages 自行拉取仓库构建** `out/`，不消费 GitHub Actions 的 artifact。
- **处理（v1.15.4）**：重型索引三步（catalog 缓存 / catalog 构建 / fulltext 缓存 / fulltext 构建）统一加条件 `vars.ENABLE_PAGES == 'true' || inputs.force_heavy_indexes == true`；需要刷新产物时手动 `workflow_dispatch` 勾选 `force_heavy_indexes`。

---

## 三、改进任务清单

### P0 · 立即可做

- [x] **C1 修复全文索引缓存键** —— 采用方案 A：上游 tree SHA。新增 `scripts/resolve-upstream-sha.mjs`；`deploy.yml` 以 `steps.upstream.outputs.tree_sha` 为键，空值硬失败。
  - **验收**：上游未变时连续两次 main 推送，第二次日志出现 `Restore fulltext/chapters cache` 命中且 `build:fulltext` 步骤被跳过；摘要表显示 `fulltext 缓存 = 命中`。
- [x] **C2 建立耗时基线** —— `build:catalog` / `build:fulltext` / `next build` 各自写入 `$GITHUB_STEP_SUMMARY`（含秒数与冷/热标注）；另设 `Report index cache status and sizes` 汇总上游 SHA、两个缓存命中状态、产物 MB 数与作业总耗时。

### P1 · 短期（结构性与复用）

- [x] **C3 缓存 catalog 本身** —— 键 `catalog-<tree_sha>`，命中则跳过 `build:catalog`（省一次全量 Trees 调用 + 11MB 写盘）。同时把 SHA 解析提前为独立步骤，使 catalog 与 fulltext 两级缓存共用同一个键源。
- [x] **C4 路径过滤** —— `on.push.paths-ignore` 忽略 `**.md`、`docs/**`、`prototype/**`、`LICENSE`。**仅作用于 push**：PR 若被跳过，分支保护要求的状态检查会永远 pending。
- [x] **C5 减少重复安装** —— 不合并 job（`check` 需在 PR 独立快速反馈，`build` 依赖其通过）；改为降低安装成本：`npm ci --prefer-offline --no-audit --no-fund`（见 C11）。
- [x] **C6 厘清生产构建归属** —— 按 P0-B 结论，重型索引默认只在 `ENABLE_PAGES=true` 或手动强制时重建；纯 push 不再付 5.14GB 成本。

### P2 · 中期（算法与并行）

- [~] **C7 分词并行化** —— **部分落地，worker_threads 方案暂缓**。已做：`normalize()` 由 `.split("").map().join()` 改为单次遍历 + 单数组（每部书少分配两个 n 长度临时数组），标点正则提升到模块级；实测 12 部样本输出与改前完全一致（80,454 词条 / 2.2MB），确认等价。**暂缓原因**：C1+C6 落地后冷启动已非高频路径，而按核并行需处理 postings 跨线程回传的内存带宽与结果确定性，宜单独立版本并附 shard 方案验证。
- [x] **C8 下载策略优化** —— 并发 8 → 默认 12（`FULLTEXT_CONCURRENCY`，上限 32，避免上游限流反噬）；新增 `FULLTEXT_MIRROR_FIRST=1` 可切换为 CDN 镜像优先（默认仍 raw 主源优先，行为最可预期）。`git clone --filter=blob:none` 稀疏检出方案未采用：本仓库阅读链路按 `rawUrl` 逐书取用，克隆只能服务索引构建侧，属独立改造。
- [x] **C9 `next build` 缓存** —— 缓存 `.next/cache`，`key: nextjs-<lockfile hash>-<sha>` + `restore-keys` 退回 lockfile 维度，使新提交仍能复用上次编译缓存。
- [x] **C10 大缓存体积治理** —— 体积上报已接入 C2 摘要（`du -m` 输出 `fulltext-index.json` / `chapters.json` / `daizhige-catalog.json`）。配额判断需以 CI 首次冷启动实测为准；GitHub Actions 单仓库缓存上限 10GB，超限会 LRU 淘汰，届时按摘要数据决定是否改分层缓存或 artifact。

### P3 · 长期（可选）

- [x] **C11** —— `npm ci` 加 `--prefer-offline --no-audit --no-fund`；`npx tsc --noEmit` 改为 `node node_modules/typescript/bin/tsc --noEmit`，避免 npx 的包解析与网络探测。
- [x] **C12 CI 预算表** —— 见下方 §四。

---

## 四、CI 步骤预算表（C12）

| 步骤 | 热路径预算 | 冷路径预算 | 实际 `timeout-minutes` | 说明 |
|---|---|---|---|---|
| `check` 作业（含 checkout/setup/ci） | 1–2 min | 2–3 min | 15 | PR 主门禁 |
| `build` 作业（含 checkout/setup/ci） | 1–2 min | 1–2 min | 90（作业级） | 作业上限须大于冷路径各步骤之和 |
| `Resolve upstream tree SHA` | 5–10 s | 5–10 s | 5 | 单次非递归 Trees 调用 |
| Restore catalog cache + `build:catalog` | 缓存下载数秒 | 1–2 min | 15 | 冷路径=全量 Trees + 11MB 写盘 |
| Restore fulltext cache + `build:fulltext` | 缓存下载数十秒 | 30–50 min | 60 | 冷路径=5.14GB 下载 + 全量分词（单线程 CPU） |
| `next build` | 2–3 min | 2–3 min | 25 | `.next/cache` 命中可再降 |
| upload artifact（`out/`） | 1–2 min | 1–2 min | — | 全量索引在内时 `out/` 约 126MB |
| **合计（热路径）** | **约 5–8 min** | | | 改前每次均是冷路径 → 撞 60 min 上限 |

**读表要点**：作业级 `timeout-minutes` 只在「所有步骤都异常慢」时兜底；定位问题应看**步骤级**超时，其报错会带步骤名。冷路径预算为保守估计，真实值以 C2 摘要实测为准。

---

## 五、预期收益

| 场景 | 改前 | 改后 |
|---|---|---|
| main 推送（上游未变） | 数十分钟，`fulltext` 必跑，常撞 60 min 上限 | 两个缓存均命中，**5–8 分钟** |
| main 推送（仅文档/原型变更） | 触发完整重型构建 | **完全不触发**（C4） |
| main 推送（Pages 未启用） | 仍执行 5.14GB 重型构建 | **跳过重型索引**，仅 `next build` 编译校验（C6） |
| PR | 已跳过重型索引 | 维持，另加 `--prefer-offline` 与本地 tsc |
| 上游数据变更 | 数十分钟（预期内） | 同上（缓存未命中属正常） |

---

## 六、风险与注意

- 缓存键的**硬性要求**：任何新增缓存都必须以确定性值作键。含 `new Date()` / 随机量 / 递增计数的产物**不可**直接 `hashFiles()`，否则缓存永久 miss（本清单 P0-A 即此陷阱）。
- `ENABLE_PAGES`、`PAGES_CUSTOM_DOMAIN` 为仓库变量。C6 落地后，**若 `ENABLE_PAGES` 未设为 `true`，main 推送不再产出含全文索引的 `out-<sha>` artifact**；需要时用 `workflow_dispatch` 勾选 `force_heavy_indexes`。
- C6 的判定条件在 `deploy.yml` 中重复出现 4 处（GitHub Actions 的 `if` 不读 job 级 `env`），改动触发条件时务必同步。
- Trees API 偶发 `truncated=true`（仅 `recursive=1` 生效；本方案用非递归 root tree，不受影响），`build:catalog` 侧仍保留告警。
- GitHub Actions 缓存单仓库上限 10GB，超限会 LRU 淘汰；大产物配额以东侧摘要实测数据为准（C10）。
- 本清单仅涉及 GitHub Actions；**不改动**生产 EdgeOne 的构建链路。

---

## 七、参考

- `.github/workflows/deploy.yml`（Build & Deploy）
- `.github/workflows/rebuild-cbdb.yml`（CBDB 索引重建，手动触发，产物入库）
- `scripts/resolve-upstream-sha.mjs`（上游 tree SHA 解析，缓存键唯一来源）
- `scripts/build-daizhige-catalog.mjs`（catalog 生成 + `catalog-fingerprint.json`）
- `scripts/build-fulltext-index.mjs`（全量倒排索引 + 章节清单）
- [`项目部署上线规范.md`](./项目部署上线规范.md) §5.2 构建加速（专项）
