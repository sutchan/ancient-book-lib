// lib/remoteBook.ts v1.4.3
/**
 * 远程书分片加载（超大书 HTTP Range 懒加载）
 * - loadChapterSupport：读取构建期生成的章节清单索引，判断该书是否支持 Range 分片
 * - loadChapterManifest：读取某书章节字节偏移清单
 * - fetchChapterText：按字节区间从 CDN 镜像（优先，支持 Range）/ 主源拉取章节文本
 */
import { fetchRangeText } from "./fetchWithTimeout";
import type { CatalogEntry } from "./types";

export interface ChapterRange {
  title: string;
  start: number; // UTF-8 字节偏移（含）
  end: number; // UTF-8 字节偏移（含），最后一章为文件总长
}

let chaptersMapCache: Record<string, ChapterRange[]> | null = null;

/** 读取全局章节偏移清单（构建期生成，单文件），缓存后供阅读页判断与取用。失败返回 null。 */
export async function loadChaptersMap(): Promise<Record<string, ChapterRange[]> | null> {
  if (chaptersMapCache) return chaptersMapCache;
  try {
    const res = await fetch("/index/chapters.json");
    if (!res.ok) return null;
    const map = (await res.json()) as Record<string, ChapterRange[]>;
    chaptersMapCache = map;
    return map;
  } catch {
    return null;
  }
}

/** 读取某书章节字节偏移清单；不支持 / 缺失时返回 null */
export async function loadChapterManifest(id: string): Promise<ChapterRange[] | null> {
  const map = await loadChaptersMap();
  if (!map || !map[id] || map[id].length === 0) return null;
  return map[id];
}

/**
 * 由章节清单补全「卷首/序」条目，使目录连续覆盖整本（首个章节前的封面/序）。
 * 若首章即位于文件开头（start=0），则不插入空条目。
 */
export function buildToc(manifest: ChapterRange[]): ChapterRange[] {
  if (manifest.length === 0) return [];
  const firstStart = manifest[0].start;
  const head: ChapterRange = { title: "（卷首/序）", start: 0, end: firstStart };
  return firstStart > 0 ? [head, ...manifest] : [...manifest];
}

/**
 * 按章节字节区间拉取文本。
 * 优先使用支持 Range 的 CDN 镜像（jsDelivr/statically），主源最后兜底。
 */
export async function fetchChapterText(
  book: CatalogEntry,
  ch: ChapterRange,
  opts: { timeout?: number; onProgress?: (loaded: number, total: number) => void } = {}
): Promise<string> {
  const range = `bytes=${ch.start}-${ch.end}`;
  const urls = [...(book.mirrors || []), book.rawUrl];
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      return await fetchRangeText(url, range, {
        timeout: opts.timeout,
        onProgress: opts.onProgress,
      });
    } catch (e: any) {
      lastError = e;
    }
  }
  throw lastError || new Error("所有数据源均加载失败");
}
