// lib/search.ts 1.15.8
/**
 * 检索工具（纯静态无数据库）
 * - 标题/元数据检索：始终可用，基于 daizhige-catalog.json（loadCatalog + searchCatalog）
 * - 全文检索：当 public/index/fulltext-index.json 存在时基于倒排索引做真正全文匹配
 *   （由 `npm run build:fulltext` 下载上游 TXT 生成；索引缺失时自动回退标题检索）
 */
import type { DaizhigeCatalog } from "./types";
import { loadCatalog, searchCatalog } from "./catalog";
import { T2S_MAP } from "./t2s";

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

let fulltextIndexPromise: Promise<Record<string, string[]> | null> | null = null;

/** 加载全量倒排索引（缺失返回 null，调用方回退标题检索）。模块级 Promise 缓存，避免每次检索重复下载索引 JSON。 */
export async function loadFulltextIndex(baseUrl = ""): Promise<Record<string, string[]> | null> {
  if (fulltextIndexPromise) return fulltextIndexPromise;
  fulltextIndexPromise = (async () => {
    try {
      const res = await fetch(`${baseUrl}/index/fulltext-index.json`);
      if (!res.ok) return null;
      return (await res.json()) as Record<string, string[]>;
    } catch {
      return null;
    }
  })();
  return fulltextIndexPromise;
}

/**
 * 查询归一化：必须与 scripts/build-fulltext-index.mjs 的 normalize 完全一致
 * （繁→简 + 去除标点/空白/数字），否则繁体查询打不中简体倒排索引。
 */
function normalizeQuery(q: string): string {
  return q
    .split("")
    .map((c) => T2S_MAP[c] || c)
    .join("")
    .replace(/[「」『』“”‘’《》〈〉：；，。！？、·\s\d]/g, "");
}

/** 查询分词：单字 + 二元组（与 build-fulltext-index.mjs 一致） */
function tokenize(q: string): string[] {
  const norm = normalizeQuery(q);
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
  // 防御：全文索引与书目不同步（跨版本/索引缺失重建）时，索引里可能含 catalog 中不存在的 id，
  // 必须过滤缺失项，否则 idMap.get(id)! 会抛 TypeError 导致搜索结果渲染白屏。
  return Array.from(scores.entries())
    .filter(([id]) => idMap.has(id))
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
