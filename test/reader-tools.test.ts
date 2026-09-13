import assert from "node:assert/strict";
import { test } from "node:test";
import { buildReaderMatches, splitHighlight } from "../lib/readerSearch";
import { formatCitation } from "../lib/citation";

const chapters = [
  { title: "學而", paragraphs: ["子曰學而時習之", "有朋自遠方來"] },
  { title: "為政", paragraphs: ["溫故而知新", "學而不思則罔"] },
];

test("buildReaderMatches 命中并给出章/页/段定位", () => {
  const r = buildReaderMatches(chapters, "學", 1, false);
  assert.equal(r.length, 2);
  assert.equal(r[0].chapterIdx, 0);
  assert.equal(r[0].pageIdx, 0);
  assert.equal(r[1].chapterIdx, 1);
  assert.equal(r[1].pageIdx, 1);
});

test("buildReaderMatches 简体查询命中繁体正文（繁简互通）", () => {
  const r = buildReaderMatches(chapters, "温故", 1, false);
  assert.equal(r.length, 1);
  assert.equal(r[0].chapterIdx, 1);
});

test("buildReaderMatches 空查询返回空数组", () => {
  assert.deepEqual(buildReaderMatches(chapters, "   ", 1, false), []);
});

test("buildReaderMatches 页码随 pageSize 变化", () => {
  const r = buildReaderMatches(chapters, "學", 2, false);
  assert.equal(r[1].pageIdx, 0); // 為政第 2 段，每页 2 段 → 第 1 页
});

test("splitHighlight 正确切分命中片段", () => {
  assert.deepEqual(splitHighlight("温故而知新", "而"), [
    { text: "温故", hit: false },
    { text: "而", hit: true },
    { text: "知新", hit: false },
  ]);
});

test("formatCitation 生成《书名·章节》：原文", () => {
  assert.equal(
    formatCitation({ bookTitle: "論語", chapterTitle: "學而", text: "子曰學而時習之" }),
    "《論語·學而》：子曰學而時習之"
  );
  assert.equal(formatCitation({ bookTitle: "論語", text: "子曰" }), "《論語》：子曰");
});
