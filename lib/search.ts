// lib/search.ts v1.4.3
/**
 * 检索工具（纯静态无数据库）
 * - 标题/元数据检索：始终可用，基于 daizhige-catalog.json（loadCatalog + searchCatalog）
 * - 全文检索：当 public/index/fulltext-index.json 存在时基于倒排索引做真正全文匹配
 *   （由 `npm run build:fulltext` 下载上游 TXT 生成；索引缺失时自动回退标题检索）
 */
import type { DaizhigeCatalog } from "./types";
import { loadCatalog, searchCatalog } from "./catalog";

export interface SearchResult {
  kind: "book";
  id: string;
  book: string; // 书名
  category: string;
  subcategories: string[];
  path: string;
  score: number;
}

export interface SearchFilters {
  category?: string;
}

/** 加载全量倒排索引（缺失返回 null，调用方回退标题检索） */
export async function loadFulltextIndex(baseUrl = ""): Promise<Record<string, string[]> | null> {
  try {
    const res = await fetch(`${baseUrl}/index/fulltext-index.json`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, string[]>;
  } catch {
    return null;
  }
}

/** 查询分词：单字 + 二元组（与 build-fulltext-index.mjs 一致） */
function tokenize(q: string): string[] {
  const norm = q.replace(/\s+/g, "");
  const toks = new Set<string>();
  for (let i = 0; i < norm.length; i++) {
    toks.add(norm[i]);
    if (i < norm.length - 1) toks.add(norm.slice(i, i + 2));
  }
  return Array.from(toks);
}

/** 基于倒排索引的全文检索：命中词数越多排序越前 */
export function searchFulltext(
  kw: string,
  index: Record<string, string[]> | null,
  catalog: DaizhigeCatalog,
  limit = 20
): SearchResult[] {
  if (!index || !kw.trim()) return [];
  const toks = tokenize(kw);
  const scores = new Map<string, number>();
  for (const t of toks) {
    const hits = index[t];
    if (!hits) continue;
    for (const id of hits) scores.set(id, (scores.get(id) || 0) + 1);
  }
  const idMap = new Map(catalog.books.map((b) => [b.id, b]));
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, score]) => {
      const b = idMap.get(id)!;
      return {
        kind: "book" as const,
        id,
        book: b.title,
        category: b.category,
        subcategories: b.subcategories,
        path: `${b.category} › ${b.subcategories.join(" › ")}`,
        score: 90 + Math.min(score, 10),
      };
    });
}

/** 标题/元数据检索（始终可用，无需索引） */
export function searchByTitle(
  kw: string,
  catalog: DaizhigeCatalog,
  filters: SearchFilters = {},
  limit = 20
): SearchResult[] {
  const results = searchCatalog(catalog, kw, { category: filters.category, limit: 99999 });
  return results.slice(0, limit).map((b) => ({
    kind: "book" as const,
    id: b.id,
    book: b.title,
    category: b.category,
    subcategories: b.subcategories,
    path: `${b.category} › ${b.subcategories.join(" › ")}`,
    score: 85,
  }));
}
