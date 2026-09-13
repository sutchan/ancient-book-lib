import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  isBookmarked,
  clearBookmarks,
  getReadPos,
  addReadPos,
  removeReadPos,
  importBookmarks,
} from "../lib/bookmarks";

// 极简 localStorage 内存实现，供 node:test 下跑通持久化逻辑
class MemStorage {
  private store = new Map<string, string>();
  getItem(k: string): string | null {
    return this.store.has(k) ? (this.store.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v));
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
  clear(): void {
    this.store.clear();
  }
}

const mem = new MemStorage();
(globalThis as unknown as { window: unknown; localStorage: unknown }).window = { localStorage: mem };
(globalThis as unknown as { localStorage: unknown }).localStorage = mem;

const sample = { id: "dzg-00001", title: "論語", category: "儒藏" };

test("addBookmark 新增并带 time 时间戳", () => {
  clearBookmarks();
  const list = addBookmark(sample);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, "dzg-00001");
  assert.equal(typeof list[0].time, "number");
});

test("addBookmark 对已存在项去重", () => {
  clearBookmarks();
  addBookmark(sample);
  const list = addBookmark(sample);
  assert.equal(list.length, 1);
});

test("toggleBookmark 在增删之间切换", () => {
  clearBookmarks();
  toggleBookmark(sample);
  assert.equal(isBookmarked("dzg-00001"), true);
  toggleBookmark(sample);
  assert.equal(isBookmarked("dzg-00001"), false);
});

test("removeBookmark 删除指定书", () => {
  clearBookmarks();
  addBookmark(sample);
  const list = removeBookmark("dzg-00001");
  assert.equal(list.length, 0);
});

test("getBookmarks 对损坏 JSON 容错返回空数组", () => {
  mem.setItem("ab-bookmarks", "{bad json");
  assert.deepEqual(getBookmarks(), []);
  mem.removeItem("ab-bookmarks");
});

test("clearBookmarks 清空全部", () => {
  addBookmark(sample);
  clearBookmarks();
  assert.equal(getBookmarks().length, 0);
});

test("importBookmarks 合并并去重", () => {
  clearBookmarks();
  addBookmark(sample);
  const merged = importBookmarks([
    { id: "dzg-00001", title: "論語", category: "儒藏" },
    { id: "dzg-00002", title: "孟子", category: "儒藏" },
  ]);
  assert.equal(merged.length, 2);
  assert.ok(merged.some((b) => b.id === "dzg-00002"));
});

test("阅读位置书签 增删", () => {
  const bid = "dzg-00002";
  mem.setItem(`ab-pos-${bid}`, "[]");
  const list = addReadPos(bid, { chapterIdx: 1, pageIdx: 2, label: "第2章 第3页" });
  assert.equal(list.length, 1);
  assert.equal(list[0].chapterIdx, 1);
  const after = removeReadPos(bid, list[0].createdAt);
  assert.equal(after.length, 0);
});
