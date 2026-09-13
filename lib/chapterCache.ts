// lib/chapterCache.ts v1.15.8 —— 阅读器章节文本内存缓存（带 LRU 淘汰，从 useReaderData 拆出）
export interface ChapterCache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

/**
 * 章节文本缓存：键必须带 bookId（不同书首章 start 常为 0，仅以 start 为键会碰撞）。
 * 超出 max 时按插入顺序淘汰最早的一条（Map 保持插入顺序）。
 */
export function createChapterCache(max: number): ChapterCache {
  const map = new Map<string, string>();
  return {
    get: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
      if (map.size > max) {
        const oldest = map.keys().next().value;
        if (oldest !== undefined) map.delete(oldest);
      }
    },
  };
}
