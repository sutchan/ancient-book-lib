/**
 * 殆知阁 v20 全量书目索引工具
 * 数据来源：public/index/daizhige-catalog.json（由 scripts/build-daizhige-catalog.mjs 生成）
 * 原始 TXT 不复制到本仓库，阅读时按需 fetch raw URL
 */
import type { CatalogEntry, DaizhigeCatalog } from "./types";

const INDEX_URL = "/index/daizhige-catalog.json";

let cache: DaizhigeCatalog | null = null;

/** 加载全量书目索引（浏览器端懒加载，带内存缓存） */
export async function loadCatalog(): Promise<DaizhigeCatalog> {
  if (cache) return cache;
  const resp = await fetch(INDEX_URL);
  if (!resp.ok) throw new Error(`书目索引加载失败: ${resp.status}`);
  cache = (await resp.json()) as DaizhigeCatalog;
  return cache;
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
    results = results.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.category.includes(q) ||
        b.subcategories.some((s) => s.includes(q))
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
      set.add(b.subcategories[0]);
    }
  }
  return Array.from(set).sort();
}

/** 按 ID 查找书目 */
export function findBookById(catalog: DaizhigeCatalog, id: string): CatalogEntry | undefined {
  return catalog.books.find((b) => b.id === id);
}

/** 格式化文件大小 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
