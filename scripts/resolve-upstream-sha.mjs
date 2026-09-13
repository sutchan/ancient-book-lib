/**
 * 解析殆知阁上游仓库的根 tree SHA（CI 缓存键专用）
 *
 * 为什么单独做成一个脚本：
 *   缓存键必须在**任何产物生成之前**确定，才能用同一个键同时缓存
 *   `daizhige-catalog.json` 与 `fulltext-index.json` / `chapters.json`（见 C3）。
 *   而 `build:catalog` 需要一次全量 Trees 调用 + 写盘 11MB 才产出指纹。
 *   此处只调一次**非递归** root tree 接口（响应仅十几个条目），前置执行成本可忽略。
 *
 * 为什么 root tree SHA 是不变量的正确指纹：
 *   git tree 对象是内容寻址的——任一深层文件变动都会改变其所在子树的 SHA，
 *   进而逐层改变父级条目 SHA，最终改变 root tree SHA。因此「同一 SHA ⟺ 同一内容」，
 *   与 `generatedAt` 之类的时间戳无关（这正是此前缓存永久 miss 的根因）。
 *
 * 用法：node scripts/resolve-upstream-sha.mjs
 * 输出：标准输出为裸 SHA（供 CI 写入 $GITHUB_OUTPUT / $GITHUB_ENV）
 * 失败：以非 0 退出，并由 CI 侧拒绝使用会退化为「永久命中」的空键
 */
const REPO = "garychowcmu/daizhigev20";
const BRANCH = "master";
const TREE_API = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}`;
const TIMEOUT_MS = 30000;

let resp;
try {
  resp = await fetch(TREE_API, {
    headers: { "User-Agent": "ancient-book-lib", Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
} catch (e) {
  console.error(`Trees API 请求失败: ${e.message}`);
  process.exit(1);
}

if (!resp.ok) {
  console.error(`Trees API 失败: ${resp.status} ${resp.statusText}`);
  process.exit(1);
}

const data = await resp.json();
if (!data.sha) {
  console.error("Trees API 响应缺少 sha 字段（上游接口结构可能变更）");
  process.exit(1);
}

// 只取 sha，不校验 truncated：truncated 仅对 recursive=1 生效，
// 非递归 root tree 只返回顶层条目，不存在截断问题。
process.stdout.write(data.sha);
