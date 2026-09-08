import assert from "node:assert/strict";
import { test } from "node:test";
import { searchByTitle, searchFulltext, type SearchResult } from "../lib/search";
import type { DaizhigeCatalog, CatalogEntry } from "../lib/types";

const books: CatalogEntry[] = [
  { id: "dzg-00001", title: "論語", category: "儒藏", subcategories: [], path: "儒藏/論語.txt", size: 100, rawUrl: "x", mirrors: [] },
  { id: "dzg-00002", title: "孟子", category: "儒藏", subcategories: [], path: "儒藏/孟子.txt", size: 100, rawUrl: "x", mirrors: [] },
  { id: "dzg-00003", title: "金剛經", category: "佛藏", subcategories: [], path: "佛藏/金剛經.txt", size: 100, rawUrl: "x", mirrors: [] },
];

const catalog: DaizhigeCatalog = {
  source: "x",
  branch: "master",
  generatedAt: "",
  total: 3,
  totalSizeBytes: 300,
  stats: { 儒藏: 2, 佛藏: 1 },
  books,
};

test("searchByTitle 标题命中", () => {
  const r = searchByTitle("論語", catalog);
  assert.equal(r.length, 1);
  assert.equal(r[0].id, "dzg-00001");
});

test("searchByTitle 馆藏筛选", () => {
  const r = searchByTitle("經", catalog, { category: "佛藏" });
  assert.equal(r.length, 1);
  assert.equal(r[0].id, "dzg-00003");
});

test("searchFulltext 基于倒排索引命中", () => {
  const index = { 論: ["dzg-00001"], 語: ["dzg-00001"], 論語: ["dzg-00001", "dzg-00002"] };
  const r = searchFulltext("論語", index, catalog);
  assert.ok(r.some((x: SearchResult) => x.id === "dzg-00001"));
});

test("searchFulltext 空索引返回空", () => {
  assert.equal(searchFulltext("x", null, catalog).length, 0);
});
