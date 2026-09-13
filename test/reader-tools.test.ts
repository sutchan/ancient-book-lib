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

test("buildReaderMatches 简体对照模式+繁体查询仍能居中命中摘要", () => {
  // 简体对照模式 display = toSimplified(para)，查询为繁体时原实现直接 fallback 失败、
  // 只返回段落前 40 字（命中词被截断在 40 字之外则摘要丢失命中上下文）。
  const longChapters = [
    {
      title: "千字文",
      paragraphs: [
        "天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏闰余成岁律吕调阳雲騰致雨露結為霜金生麗水玉出崑崗。溫故而知新可以為師矣。",
      ],
    },
  ];
  const r = buildReaderMatches(longChapters, "溫故", 1, true);
  assert.equal(r.length, 1);
  // 修正后摘要应居中命中词「温故」，而非仅返回段落开头切片
  assert.ok(r[0].snippet.includes("温故"));
});

test("formatCitation 生成《书名·章节》：原文", () => {
  assert.equal(
    formatCitation({ bookTitle: "論語", chapterTitle: "學而", text: "子曰學而時習之" }),
    "《論語·學而》：子曰學而時習之"
  );
  assert.equal(formatCitation({ bookTitle: "論語", text: "子曰" }), "《論語》：子曰");
});
