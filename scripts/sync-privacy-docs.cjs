/**
 * 同步更新隐私表述：零埋点/零隐私收集 → 不收集个人身份信息+仅匿名统计
 */
const fs = require("fs");

const REPLACEMENTS = [
  {
    file: "docs/01-项目基础说明/开源合规声明规范.md",
    pairs: [
      ["- 零用户隐私收集、零数据埋点、零用户内容上传",
       "- 不收集用户个人身份信息、零数据埋点（仅匿名访问统计）、零用户内容上传"],
    ],
  },
  {
    file: "docs/01-项目基础说明/README-项目简介.md",
    pairs: [
      ["无注册、无付费、无隐私收集",
       "无注册、无付费、无个人隐私收集（仅匿名访问统计，GA4）"],
    ],
  },
  {
    file: "docs/01-项目基础说明/项目整体概述.md",
    pairs: [
      ["零广告、零注册、零付费、零隐私收集的纯公益开源古籍工具",
       "零广告、零注册、零付费、不收集个人隐私的纯公益开源古籍工具（仅匿名访问统计，GA4）"],
    ],
  },
  {
    file: "docs/03-产品需求PRD/V1.0上线版产品需求文档.md",
    pairs: [
      ["**基础普惠定位**：零广告、零注册、零付费、零隐私收集的纯公益开源古籍工具",
       "**基础普惠定位**：零广告、零注册、零付费、不收集个人隐私的纯公益开源古籍工具（仅匿名访问统计，GA4）"],
      ["- 零用户隐私收集、零数据埋点、零用户内容上传，无隐私合规隐患",
       "- 不收集用户个人身份信息、零数据埋点（仅匿名访问统计，GA4，IP 匿名化）、零用户内容上传，无隐私合规隐患"],
    ],
  },
  {
    file: "docs/04-开发任务清单/V1.0精简版开发任务清单.md",
    pairs: [
      ["- 零隐私合规优化：关闭所有埋点、隐私收集、用户上传功能",
       "- 隐私合规优化：关闭个人数据采集与用户上传功能，仅保留匿名访问统计（GA4，IP 匿名化）"],
      ["- 合规达标：无隐私收集、开源声明完整、非商用免责闭环，可直接备案上线",
       "- 合规达标：无个人隐私收集（匿名统计已公示）、开源声明完整、非商用免责闭环，可直接备案上线"],
    ],
  },
];

let total = 0;
for (const { file, pairs } of REPLACEMENTS) {
  const full = file;
  let c = fs.readFileSync(full, "utf8");
  let changed = false;
  for (const [old, next] of pairs) {
    if (c.includes(old)) {
      c = c.replace(old, next);
      total++;
      changed = true;
    } else {
      console.log(`⚠️ 未命中: ${file} :: ${old.slice(0, 30)}…`);
    }
  }
  if (changed) fs.writeFileSync(full, c, "utf8");
}
console.log(`✅ 完成 ${total} 处替换`);
