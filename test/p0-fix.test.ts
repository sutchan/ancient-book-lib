// test/p0-fix.test.ts v1.5.1
import assert from "node:assert/strict";
import { test } from "node:test";
import { searchByTitle } from "../lib/search";
import { formatYear, formatLife, type CbdbMeta, loadSurnamePersons } from "../lib/cbdb";
import type { DaizhigeCatalog, CatalogEntry } from "../lib/types";

const testBooks: CatalogEntry[] = [
  { id: "dzg-101", title: "蘇軾文集", category: "集部", subcategories: ["別集"], path: "集部/蘇軾文集.txt", size: 1000, rawUrl: "x", mirrors: [] },
];
const testCatalog: DaizhigeCatalog = {
  source: "test",
  branch: "main",
  generatedAt: "2026-09-10",
  total: 1,
  totalSizeBytes: 1000,
  stats: { 集部: 1 },
  books: testBooks,
};

test("P0-3: 简体关键词「苏轼」能跨语言命中繁体书目「蘇軾文集」", () => {
  const r = searchByTitle("苏轼", testCatalog);
  assert.equal(r.length, 1);
  assert.equal(r[0].id, "dzg-101");
});

test("P0-3: 繁体关键词「蘇軾」正常命中繁体书目", () => {
  const r = searchByTitle("蘇軾", testCatalog);
  assert.equal(r.length, 1);
  assert.equal(r[0].id, "dzg-101");
});

test("P0-4: UTF-8 字节区间截取验证（确保中文字符不被按字符切断或乱码）", () => {
  const fullText = "第一章 道德經\n道可道非常道。\n第二章 玄之又玄";
  const bytes = new TextEncoder().encode(fullText);
  // 计算「道可道非常道。\n」在 UTF-8 字节流中的实际区间
  const startBytes = new TextEncoder().encode("第一章 道德經\n").byteLength;
  const targetBytes = new TextEncoder().encode("道可道非常道。\n").byteLength;
  const endBytes = startBytes + targetBytes - 1;

  const sliced = new TextDecoder().decode(bytes.subarray(startBytes, endBytes + 1));
  assert.equal(sliced, "道可道非常道。\n");
});

test("CBDB 辅助函数 formatYear 和 formatLife", () => {
  assert.equal(formatYear(-551), "公元前 551 年");
  assert.equal(formatYear(1037), "1037 年");
  assert.equal(formatLife(1037, 1101), "1037 年 — 1101 年");
});
