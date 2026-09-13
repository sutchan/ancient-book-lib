// lib/bookmarks.ts v1.14.3
/**
 * 书签持久化（纯静态 / 零后端，仅 localStorage）
 * - 书籍收藏：ab-bookmarks（JSON 数组）
 * - 阅读位置书签（按书隔离）：ab-pos-${bookId}（JSON 数组）
 * - 内置极简 subscribe/notify pub/sub，供同标签页跨组件实时同步
 */

export interface Bookmark {
  id: string;
  title: string;
  category: string;
  time: number;
}

export interface ReadPosBookmark {
  chapterIdx: number;
  pageIdx: number;
  label: string;
  createdAt: number;
}

const BOOKMARKS_KEY = "ab-bookmarks";

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = (): void => {
  listeners.forEach((l) => l());
};

/** 订阅书签变更（同标签页跨组件同步），返回取消订阅函数 */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** 安全解析 localStorage 中的 JSON 数组，损坏数据回退为 fallback */
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

function readBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  return safeParse<Bookmark[]>(localStorage.getItem(BOOKMARKS_KEY), []);
}

function writeBookmarks(list: Bookmark[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  notify();
}

export function getBookmarks(): Bookmark[] {
  return readBookmarks();
}

export function isBookmarked(id: string): boolean {
  return readBookmarks().some((b) => b.id === id);
}

export function addBookmark(b: Omit<Bookmark, "time">): Bookmark[] {
  const list = readBookmarks();
  if (list.some((x) => x.id === b.id)) return list;
  const next = [{ ...b, time: Date.now() }, ...list];
  writeBookmarks(next);
  return next;
}

export function removeBookmark(id: string): Bookmark[] {
  const next = readBookmarks().filter((b) => b.id !== id);
  writeBookmarks(next);
  return next;
}

export function toggleBookmark(b: Omit<Bookmark, "time">): Bookmark[] {
  return isBookmarked(b.id) ? removeBookmark(b.id) : addBookmark(b);
}

export function clearBookmarks(): void {
  writeBookmarks([]);
}

/** 合并导入书签（去重，保留既有项），写入后触发 notify */
export function importBookmarks(incoming: Omit<Bookmark, "time">[]): Bookmark[] {
  const existing = readBookmarks();
  const merged = [...existing];
  for (const b of incoming) {
    if (b && b.id && !merged.some((m) => m.id === b.id)) {
      merged.unshift({ ...b, time: Date.now() });
    }
  }
  writeBookmarks(merged);
  return merged;
}

/* ============ 阅读位置书签（Phase 2，按书隔离） ============ */

function posKey(bookId: string): string {
  return `ab-pos-${bookId}`;
}

export function getReadPos(bookId: string): ReadPosBookmark[] {
  if (typeof window === "undefined" || !bookId) return [];
  return safeParse<ReadPosBookmark[]>(localStorage.getItem(posKey(bookId)), []);
}

export function addReadPos(
  bookId: string,
  p: Omit<ReadPosBookmark, "createdAt">
): ReadPosBookmark[] {
  if (typeof window === "undefined" || !bookId) return [];
  const list = getReadPos(bookId);
  const next = [...list, { ...p, createdAt: Date.now() }];
  localStorage.setItem(posKey(bookId), JSON.stringify(next));
  return next;
}

export function removeReadPos(bookId: string, createdAt: number): ReadPosBookmark[] {
  if (typeof window === "undefined" || !bookId) return [];
  const next = getReadPos(bookId).filter((p) => p.createdAt !== createdAt);
  localStorage.setItem(posKey(bookId), JSON.stringify(next));
  return next;
}

export function clearReadPos(bookId: string): void {
  if (typeof window === "undefined" || !bookId) return;
  localStorage.setItem(posKey(bookId), JSON.stringify([]));
}
