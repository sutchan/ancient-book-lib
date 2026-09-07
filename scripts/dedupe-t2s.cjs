const fs = require("fs");
const p = "lib/t2s.ts";
let src = fs.readFileSync(p, "utf8");
const re = /"([^"]+)"\s*:\s*"([^"]+)"/g;
const map = {};
let m;
let dup = [];
while ((m = re.exec(src)) !== null) {
  if (map[m[1]] !== undefined) dup.push(m[1]);
  map[m[1]] = m[2];
}
const lines = Object.entries(map).map(([k, v]) => `  "${k}": "${v}"`);
const out = `/**
 * 古籍常用字繁简映射表（T2S）
 * 说明：古籍专用映射，覆盖经文、史传、诗词高频古字。
 * 生产环境可扩展为完整映射库（由 scripts/build-index.mjs 从离线资源生成）。
 */
export const T2S_MAP: Record<string, string> = {
${lines.join(",\n")}
};

/** 繁体转简体 */
export function toSimplified(text: string): string {
  return text
    .split("")
    .map((c) => T2S_MAP[c] || c)
    .join("");
}
`;
fs.writeFileSync(p, out, "utf8");
console.log("去重完成, 总键数:", Object.keys(map).length, "去重键数:", dup.length, dup.join(","));
