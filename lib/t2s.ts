// lib/t2s.ts 1.15.8 —— 古籍常用字繁简转换（映射表见 t2s-map.ts 分段合并）
/**
 * 古籍专用映射，覆盖经文、史传、诗词高频古字。
 * 生产环境可扩展为完整映射库（由 scripts/build-index.mjs 从离线资源生成）。
 */
import { T2S_MAP } from "./t2s-map";

export { T2S_MAP };

/** 繁体转简体 */
export function toSimplified(text: string): string {
  return text
    .split("")
    .map((c) => T2S_MAP[c] || c)
    .join("");
}
