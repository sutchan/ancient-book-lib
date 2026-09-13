// lib/recentBooks.ts 1.15.8 —— 最近阅读记录的 localStorage 读写（被 useReaderData 与 RecentBooks 复用）
import type { CatalogEntry } from "./types";

const KEY = "ab-recent";
const MAX = 10;

interface RecentItem {
  id: string;
  title: string;
  category: string;
  time: number;
}

/** 将一本书记录到「最近阅读」（去重并按时间倒序，最多保留 10 条） */
export function recordRecent(b: CatalogEntry): void {
  if (typeof window === "undefined") return;
  try {
    const recent = JSON.parse(localStorage.getItem(KEY) || "[]") as RecentItem[];
    const filtered = recent.filter((r) => r.id !== b.id);
    filtered.unshift({ id: b.id, title: b.title, category: b.category, time: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

/** 读取最近阅读列表 */
export function getRecent(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as RecentItem[];
  } catch {
    return [];
  }
}
