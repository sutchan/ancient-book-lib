/**
 * 修复 lib/t2s.ts：对象字面量重复键去重（保留最后一次出现）
 * 运行：node scripts/fix-t2s-dupes.cjs
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "lib", "t2s.ts");
const lines = fs.readFileSync(file, "utf8").split("\n");

// 找到 export const T2S_MAP = { 与对应的结束 };
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("export const T2S_MAP")) start = i;
}
if (start < 0) {
  console.error("未找到 T2S_MAP 声明");
  process.exit(1);
}
// 从 start 找配对的 { }（逐行统计花括号）
let depth = 0;
for (let i = start; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  if (depth === 0) {
    end = i;
    break;
  }
}
if (end < 0) {
  console.error("未找到对象结束");
  process.exit(1);
}

const head = lines.slice(0, start).join("\n");
const bodyLines = lines.slice(start + 1, end); // 对象体（不含声明行与闭合行）
const tail = lines.slice(end).join("\n");

// 去重：键 → 行内容（保留最后一次）
const keyRe = /^(\s*)"([^"]+)":\s*(.*),\s*$/;
const map = new Map();
let removed = 0;
for (const line of bodyLines) {
  const m = keyRe.exec(line);
  if (m) {
    const key = m[2];
    if (map.has(key)) removed++;
    map.set(key, line);
  } else {
    // 注释/其他行：忽略（追加块注释行会被丢掉，但保留非键行会打乱顺序）
    // 为安全，注释行也跳过（文件内注释仅块注释与键行）
  }
}

const out =
  head +
  "\nexport const T2S_MAP: Record<string, string> = {\n" +
  Array.from(map.values()).join("\n") +
  "\n};\n" +
  tail;
fs.writeFileSync(file, out, "utf8");
console.log(`去重完成：移除 ${removed} 个重复键，保留 ${map.size} 个唯一键`);
