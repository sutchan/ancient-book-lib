/**
 * 人物考据检索与筛选（纯函数，便于单测）。
 * - uniqueDynasties / uniqueTags：从数据派生筛选维度
 * - filterCharacters：关键词 + 朝代 + 标签 组合筛选并排序
 */

import type { Character } from "./types";

/** 去重并排序的朝代列表 */
export function uniqueDynasties(chars: Character[]): string[] {
  return [...new Set(chars.map((c) => c.dynasty).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh")
  );
}

/** 去重并排序的标签列表（限前 N 个，避免筛选器过长） */
export function uniqueTags(chars: Character[], limit = 40): string[] {
  const set = new Set<string>();
  chars.forEach((c) => (c.tags ?? []).forEach((t) => set.add(t)));
  return [...set].sort((a, b) => a.localeCompare(b, "zh")).slice(0, limit);
}

export type CharacterSort = "name" | "dynasty";

export interface CharacterFilterOptions {
  query?: string;
  dynasty?: string;
  tag?: string;
  sort?: CharacterSort;
}

/** 关键词命中字段：姓名 / 字 / 号 / 籍贯 / 朝代 / 官职 / 简介 / 标签 */
function matchesQuery(c: Character, q: string): boolean {
  const hay = [
    c.name,
    c.zi,
    c.alias,
    c.native,
    c.dynasty,
    c.office,
    c.desc,
    (c.tags ?? []).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

/**
 * 组合筛选并排序。
 * - query：关键词（不区分大小写，子串匹配）
 * - dynasty / tag：精确维度过滤（空串表示不限）
 * - sort：name 按姓名拼音、dynasty 按朝代再按姓名
 */
export function filterCharacters(
  chars: Character[],
  opts: CharacterFilterOptions = {}
): Character[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  const out = chars.filter((c) => {
    if (opts.dynasty && c.dynasty !== opts.dynasty) return false;
    if (opts.tag && !(c.tags ?? []).includes(opts.tag)) return false;
    if (q && !matchesQuery(c, q)) return false;
    return true;
  });

  const sort = opts.sort ?? "name";
  return out.slice().sort((a, b) => {
    if (sort === "dynasty") {
      const d = (a.dynasty || "").localeCompare(b.dynasty || "", "zh");
      if (d !== 0) return d;
    }
    return (a.name || "").localeCompare(b.name || "", "zh");
  });
}
