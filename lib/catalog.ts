// lib/catalog.ts v1.5.1
/**
 * 殆知阁 v20 全量书目索引工具
 * 数据来源：public/index/daizhige-catalog.json（由 scripts/build-daizhige-catalog.mjs 生成）
 * 原始 TXT 不复制到本仓库，阅读时按需 fetch raw URL
 */
import type { CatalogEntry, DaizhigeCatalog } from "./types";
import { toSimplified } from "./t2s";

export type { CatalogEntry, DaizhigeCatalog };

// 每个 catalog 实例对应一份「标题+馆藏」简体归一化摘要（按 id 索引），
// 让简体关键词也能命中繁体书目数据；WeakMap 随 catalog 自动回收。
const normHaystacks = new WeakMap<DaizhigeCatalog, Map<string, string>>();

/** 懒构建某 catalog 的简体匹配摘要（仅构建一次） */
function getNormHaystack(catalog: DaizhigeCatalog): Map<string, string> {
  let map = normHaystacks.get(catalog);
  if (!map) {
    map = new Map(
      catalog.books.map((b) => [
        b.id,
        toSimplified([b.title, b.category, ...b.subcategories].join(" ")).toLowerCase(),
      ])
    );
    normHaystacks.set(catalog, map);
  }
  return map;
}

// 主源 + CDN 镜像降级（jsDelivr / statically），避免单点失败导致全站书目瘫痪
const INDEX_CANDIDATES = [
  "/index/daizhige-catalog.json",
  "https://cdn.jsdelivr.net/gh/sutchan/ancient-book-lib@main/public/index/daizhige-catalog.json",
  "https://cdn.statically.io/gh/sutchan/ancient-book-lib/main/public/index/daizhige-catalog.json",
];

let cache: DaizhigeCatalog | null = null;
let idMap: Map<string, CatalogEntry> | null = null;

/** 加载全量书目索引（浏览器端懒加载，带内存缓存 + O(1) ID 查找 Map + CDN 镜像降级） */
export async function loadCatalog(): Promise<DaizhigeCatalog> {
  if (cache) return cache;
  let lastError: Error | null = null;
  for (const url of INDEX_CANDIDATES) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        lastError = new Error(`书目索引加载失败: ${resp.status}`);
        continue;
      }
      cache = (await resp.json()) as DaizhigeCatalog;
      idMap = new Map(cache.books.map((b) => [b.id, b]));
      return cache;
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError || new Error("书目索引加载失败");
}

/** 书目级搜索（标题/馆藏/子类匹配，不做全文检索） */
export function searchCatalog(
  catalog: DaizhigeCatalog,
  keyword: string,
  opts: { category?: string; limit?: number } = {}
): CatalogEntry[] {
  const q = keyword.trim().toLowerCase();
  const limit = opts.limit ?? 100;
  let results = catalog.books;
  if (opts.category) results = results.filter((b) => b.category === opts.category);
  if (q) {
    // 原文匹配（繁简直查）+ 简体归一化匹配（查询词与书目统一转简后匹配，繁简双向可命中）
    const qNorm = toSimplified(keyword).trim().toLowerCase();
    const norm = getNormHaystack(catalog);
    results = results.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.category.includes(q) ||
        b.subcategories.some((s) => s.includes(q)) ||
        (norm.get(b.id) || "").includes(qNorm)
    );
  }
  return results.slice(0, limit);
}

/** 按馆藏分组 */
export function groupByCategory(catalog: DaizhigeCatalog): Record<string, CatalogEntry[]> {
  const groups: Record<string, CatalogEntry[]> = {};
  for (const b of catalog.books) {
    if (!groups[b.category]) groups[b.category] = [];
    groups[b.category].push(b);
  }
  return groups;
}

/** 获取某馆藏下的子类列表（去重有序） */
export function getSubcategories(
  catalog: DaizhigeCatalog,
  category: string
): string[] {
  const set = new Set<string>();
  for (const b of catalog.books) {
    if (b.category === category && b.subcategories.length > 0) {
      b.subcategories.forEach((s) => set.add(s));
    }
  }
  return Array.from(set).sort();
}

/** 按 ID 查找书目（O(1) Map 查找） */
export function findBookById(catalog: DaizhigeCatalog, id: string): CatalogEntry | undefined {
  if (idMap) return idMap.get(id);
  // fallback：未经过 loadCatalog 构建 Map 时线性查找
  return catalog.books.find((b) => b.id === id);
}

/** 格式化文件大小 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
