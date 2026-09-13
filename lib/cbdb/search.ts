// lib/cbdb/search.ts v1.15.7
import { toSimplified } from "../t2s";
import { loadSearchIndex, loadNormSearchIndex } from "./meta";
import { loadAltnameSearch, loadAltnamePersons } from "./altnames";

/**
 * 人名搜索（繁简双向兼容）
 * 命中优先级：① 姓名前缀 > ② 姓名子串 > ③ 别名字号前缀 > ④ 别名字号子串。
 * 前一级不足 limit 时由后一级补充，保证「苏轼」优先于「苏」开头的同名杂项、
 * 且搜「軾」这类中间字也能命中「蘇軾」。
 */
export async function searchPersons(
  query: string,
  limit = 20
): Promise<{ id: number; name: string; matched?: "name" | "alias"; alias?: string }[]> {
  const q = query.trim();
  if (!q) return [];
  // 查询本身为简体时（qNorm === q）原名多为繁体，只有归一化副本能命中——
  // 不能加 qNorm !== q 守卫，否则简体查询永远打不中繁体人名。
  const qNorm = toSimplified(q);
  type Hit = { id: number; name: string; matched: "name" | "alias"; alias?: string };
  const [index, normIndex] = await Promise.all([loadSearchIndex(), loadNormSearchIndex()]);
  const prefix: Hit[] = [];
  const substr: Hit[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < index.length; i++) {
    if (prefix.length >= limit && substr.length >= limit) break;
    const [name, id] = index[i];
    if (seen.has(id)) continue;
    const norm = normIndex[i][0];
    const isPrefix = name.startsWith(q) || norm.startsWith(qNorm);
    const isSubstr = !isPrefix && (name.includes(q) || norm.includes(qNorm));
    if (!isPrefix && !isSubstr) continue;
    seen.add(id);
    const hit: Hit = { id, name, matched: "name" };
    if (isPrefix) {
      if (prefix.length < limit) prefix.push(hit);
    } else if (substr.length < limit) {
      substr.push(hit);
    }
  }

  const results: Hit[] = [...prefix, ...substr].slice(0, limit);

  if (results.length < limit) {
    try {
      const [altIndex, persons] = await Promise.all([loadAltnameSearch(), loadAltnamePersons()]);
      const remain = limit - results.length;
      const altPrefix: Hit[] = [];
      const altSubstr: Hit[] = [];
      for (let i = 0; i < altIndex.length; i++) {
        if (altPrefix.length >= remain && altSubstr.length >= remain) break;
        const [alias, id] = altIndex[i];
        if (seen.has(id)) continue;
        const aliasNorm = toSimplified(alias);
        const isPrefix = alias.startsWith(q) || aliasNorm.startsWith(qNorm);
        const isSubstr = !isPrefix && (alias.includes(q) || aliasNorm.includes(qNorm));
        if (!isPrefix && !isSubstr) continue;
        seen.add(id);
        const hit: Hit = { id, name: persons.get(id) || `人物 ${id}`, matched: "alias", alias };
        if (isPrefix) {
          if (altPrefix.length < remain) altPrefix.push(hit);
        } else if (altSubstr.length < remain) {
          altSubstr.push(hit);
        }
      }
      results.push(...[...altPrefix, ...altSubstr].slice(0, remain));
    } catch {
      // 别名索引不可用时静默降级为纯姓名搜索
    }
  }
  return results;
}
