// lib/idb.ts v1.4.3
/**
 * IndexedDB 封装：远程书原文缓存
 * 容量上限 100MB，LRU 淘汰
 */

const DB_NAME = "ancient-book-cache";
const DB_VERSION = 1;
const STORE_NAME = "books";
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB

interface CacheEntry {
  bookId: string;
  title: string;
  content: string;
  size: number;
  accessedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "bookId" });
        store.createIndex("accessedAt", "accessedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/** 获取缓存 */
export async function getCachedBook(bookId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(bookId);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined;
        if (entry) {
          // 更新访问时间（LRU）
          entry.accessedAt = Date.now();
          store.put(entry);
          resolve(entry.content);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null; // IndexedDB 不可用时降级
  }
}

/** 写入缓存（含 LRU 淘汰） */
export async function setCachedBook(
  bookId: string,
  title: string,
  content: string
): Promise<void> {
  try {
    const db = await openDB();
    const size = new Blob([content]).size;

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      // 先检查总容量，必要时淘汰
      const countReq = store.getAll();
      countReq.onsuccess = () => {
        const entries = (countReq.result || []) as CacheEntry[];
        let totalSize = entries.reduce((s, e) => s + e.size, 0);

        // LRU 淘汰：按 accessedAt 升序删除
        const sorted = entries.sort((a, b) => a.accessedAt - b.accessedAt);
        let idx = 0;
        while (totalSize + size > MAX_CACHE_SIZE && idx < sorted.length) {
          store.delete(sorted[idx].bookId);
          totalSize -= sorted[idx].size;
          idx++;
        }

        // 写入新条目
        const entry: CacheEntry = {
          bookId,
          title,
          content,
          size,
          accessedAt: Date.now(),
        };
        const putReq = store.put(entry);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      countReq.onerror = () => reject(countReq.error);
    });
  } catch {
    // 缓存写入失败不影响阅读
  }
}

/** 获取缓存使用量 */
export async function getCacheStats(): Promise<{ count: number; size: number }> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        const entries = (req.result || []) as CacheEntry[];
        resolve({
          count: entries.length,
          size: entries.reduce((s, e) => s + e.size, 0),
        });
      };
      req.onerror = () => resolve({ count: 0, size: 0 });
    });
  } catch {
    return { count: 0, size: 0 };
  }
}

/** 清空缓存 */
export async function clearCache(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}
