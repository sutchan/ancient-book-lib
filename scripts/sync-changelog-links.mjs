#!/usr/bin/env node
// scripts/sync-changelog-links.mjs v1.13.2
/**
 * 重建 CHANGELOG.md 底部的版本比较链接块，并输出待创建的 Git 标签清单。
 *
 * ## 为什么需要这个脚本
 * CHANGELOG 的 compare 链接依赖 Git tag 存在，而本仓库**从未打过 tag**，链接块也因此长期
 * 停留在手工维护的 1.3.6 版本、且顺序错乱。手工补 tag 的难点在于：这个仓库的版本号在两个
 * 地方分头维护，且互不一致——
 *
 *   1. **提交信息**（如「feat: 接入 CBDB 科舉檔案（v1.10.0）」）
 *   2. **package.json 的 version 字段**
 *
 * 在 1.4.6 ~ 1.13.0 这段，package.json 长期停在 1.4.x 没有跟随功能版本演进（例如自称
 * v1.8.0 的 9b61040 里 package.json 仍是 1.4.4）。因此**只信 package.json 会把 v1.4.4
 * 打到实际是 v1.8.0 的提交上**，比不打 tag 更具误导性。故本脚本改用双源取证。
 *
 * ## 取证策略（双源 + 冲突让位）
 * - 主源：提交信息中的 `vX.Y.Z` 标注，同一版本被多次标注时取**最后一次**（该版本工作的收尾点）。
 * - 辅源：package.json **首次**达到该版本的提交，仅在主源无证据时启用。
 * - 冲突：同一提交被多个版本认领时保留主源版本，其余**跳过并注释说明**——宁可不打标签，
 *   也不打语义存疑的标签。
 *
 * ## 用法
 *   node scripts/sync-changelog-links.mjs          # 仅重建 CHANGELOG 链接块
 *   node scripts/sync-changelog-links.mjs --emit   # 额外生成 tmp/create-tags.sh
 *
 * 注：tag 脚本落在被 gitignore 的 tmp/ 下，避免被 `git add -A` 扫进仓库。
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const REPO = 'https://github.com/sutchan/ancient-book-lib';
const CHANGELOG = 'CHANGELOG.md';
const TMP_DIR = 'tmp';

const git = (cmd) => execSync(cmd, { encoding: 'utf8', maxBuffer: 1 << 28 });

/** 语义化版本降序比较：1.10.0 > 1.9.0 */
const cmpVer = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
};

// ---------------------------------------------------------------- 1. 取证

const log = git('git log --reverse --format=%H%x09%ad%x09%s --date=short').trim().split('\n');

/** 主源：提交信息中的版本标注，取最后一次（reverse 遍历 ⇒ 后写覆盖前写） */
const msgClaim = new Map();
const dateOf = new Map();
for (const line of log) {
  const [sha, date, subj] = line.split('\t');
  const short = sha.slice(0, 7);
  dateOf.set(short, date);
  const m = subj.match(/v(\d+\.\d+\.\d+)/);
  if (m) msgClaim.set(m[1], short);
}

/** 辅源：package.json 首次达到某版本的提交 */
const pkgShas = git('git log --format=%H --reverse -- package.json').trim().split('\n').filter(Boolean);
const pkgFirst = new Map();
for (const sha of pkgShas) {
  let version;
  try {
    version = JSON.parse(git(`git show ${sha}:package.json`)).version;
  } catch {
    continue;
  }
  if (version && !pkgFirst.has(version)) pkgFirst.set(version, sha.slice(0, 7));
}

// ------------------------------------------------- 2. CHANGELOG 记录过的版本

const text = readFileSync(CHANGELOG, 'utf8');
const lines = text.split('\n');
const headingDate = new Map();
for (const line of lines) {
  const m = line.match(/^##\s+\[([0-9][^\]]*)\]\s*-\s*(\S+)/);
  if (m) headingDate.set(m[1], m[2]);
}
const documented = [...headingDate.keys()].sort(cmpVer);

// ------------------------------------------------------ 3. 定案 + 冲突让位

const decided = new Map(); // 版本 -> commit
const ownerOfSha = new Map(); // commit -> 版本（用于检测抢占）
const conflicts = []; // 因抢占而放弃的版本

for (const [v, sha] of msgClaim) {
  if (ownerOfSha.has(sha)) {
    conflicts.push(`${v}（提交 ${sha} 已被 v${ownerOfSha.get(sha)} 占用）`);
    continue;
  }
  ownerOfSha.set(sha, v);
  decided.set(v, sha);
}
for (const [v, sha] of pkgFirst) {
  if (decided.has(v)) continue;
  if (ownerOfSha.has(sha)) {
    conflicts.push(`${v}（package.json 落点 ${sha} 已被 v${ownerOfSha.get(sha)} 占用）`);
    continue;
  }
  ownerOfSha.set(sha, v);
  decided.set(v, sha);
}

const tagged = [...decided.keys()].sort(cmpVer);
const unresolved = documented.filter((v) => !decided.has(v)).sort(cmpVer);

// ------------------------------------------------------------ 4. 重建链接块

const block = [
  '<!-- 版本比较链接：由 scripts/sync-changelog-links.mjs 生成，勿手改；新增版本后重跑该脚本 -->',
  `[未发布]: ${REPO}/compare/v${tagged[tagged.length - 1]}...HEAD`,
  ...tagged
    .slice()
    .reverse()
    .map((v, i) => {
      const prev = tagged[tagged.length - 2 - i]; // 升序序列中的前一个版本
      const url = prev ? `${REPO}/compare/v${prev}...v${v}` : `${REPO}/releases/tag/v${v}`;
      return `[${v}]: ${url}`;
    }),
  '',
  '<!--',
  ...(unresolved.length
    ? [
        '  以下版本在 CHANGELOG 中有条目，但提交信息与 package.json 均无可靠落点，',
        '  故不打标签、不生成链接：',
        `  ${unresolved.join(' / ')}`,
      ]
    : []),
  ...(conflicts.length
    ? [
        '',
        '  以下版本因目标提交已被其它版本认领而让位（避免同一 commit 承载两个版本号）：',
        `  ${conflicts.join(' / ')}`,
      ]
    : []),
  '-->',
];

// 幂等清理：链接区恒位于文件末尾，且历史版本可能遗留下生成注释与旧注释块，
// 因此对齐到首个「生成注释 / [未发布] 链接」标记后整段截断重建，而非只替换中段。
const mark = lines.findIndex((l) => /^<!--\s*版本比较链接/.test(l) || /^\[未发布\]:/.test(l));
if (mark < 0) throw new Error('未找到比较链接块起始标记（[未发布]: ...）');

const next = lines.slice(0, mark);
// 去掉截断处可能残留的空行，由下面的 block 统一控制间距
while (next.length && next[next.length - 1].trim() === '') next.pop();
next.push('', ...block);
writeFileSync(CHANGELOG, next.join('\n'));

console.log(`已重建比较链接：${tagged.length} 个可追溯版本`);
console.log(`无落点（不生成链接）：${unresolved.join(' ') || '（无）'}`);
if (conflicts.length) console.log(`冲突让位：${conflicts.join(' / ')}`);

// ------------------------------------------------------------ 5. 生成 tag 脚本

if (process.argv.includes('--emit')) {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
  const script = tagged
    .map((v) => {
      const sha = decided.get(v);
      const date = headingDate.get(v) || dateOf.get(sha) || '';
      return `git tag -a v${v} ${sha} -m "v${v} (${date})"`;
    })
    .join('\n');
  writeFileSync(`${TMP_DIR}/create-tags.sh`, `#!/usr/bin/env bash\nset -euo pipefail\n${script}\n`);
  console.log(`已生成 ${TMP_DIR}/create-tags.sh（${tagged.length} 个标签）`);
}
