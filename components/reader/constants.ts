// components/reader/constants.ts v1.15.8

export const PAGE_SIZE = 8;
export const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB 以上视为大文件
export const FETCH_TIMEOUT = 60000; // 60秒超时（大文件需要更长时间）
export const CHAPTER_CACHE_MAX = 30; // 章节缓存上限，避免长书读完全程后把整本正文留在内存

/** 仅允许 http/https 协议，阻断 javascript:/data: 等危险协议（防御 XSS） */
export function safeHttpUrl(url: string | undefined): string | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return url;
}
