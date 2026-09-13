// test/download.test.ts v1.15.8
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOWNLOAD_NOTICE, buildBookTxt, buildCategoryTxt } from "../lib/download";

test("下载：免责声明内容完整", () => {
  assert.ok(DOWNLOAD_NOTICE.includes("仅供学术研究与个人学习"));
  assert.ok(DOWNLOAD_NOTICE.includes("禁止商用"));
});

test("下载：整本 TXT 结构正确（书名+逐章+免责）", () => {
  const txt = buildBookTxt(
    "论语",
    "春秋 · 孔子弟子及再传弟子",
    [
      { title: "学而篇第一", text: "子曰：学而时习之。" },
      { title: "为政篇第二", text: "子曰：为政以德。" },
    ]
  );
  assert.ok(txt.includes("论语"));
  assert.ok(txt.includes("春秋 · 孔子弟子及再传弟子"));
  assert.ok(txt.includes("【学而篇第一】"));
  assert.ok(txt.includes("【为政篇第二】"));
  assert.ok(txt.includes("学而时习之。"));
  assert.ok(txt.includes(DOWNLOAD_NOTICE));
});

test("下载：馆藏合集 TXT 结构正确", () => {
  const txt = buildCategoryTxt("儒藏", [
    { title: "论语", meta: "春秋 · 孔子弟子", body: "【学而】\n正文\n" },
  ]);
  assert.ok(txt.includes("儒藏·馆藏合集"));
  assert.ok(txt.includes("# 论语"));
  assert.ok(txt.includes(DOWNLOAD_NOTICE));
});

test("下载：空书籍列表安全", () => {
  const txt = buildCategoryTxt("佛藏", []);
  assert.ok(txt.includes("佛藏·馆藏合集"));
  assert.ok(txt.includes(DOWNLOAD_NOTICE));
});

test("下载：CSV 导出防御公式注入", () => {
  const { escapeCsvCell } = require("../lib/download");
  // 以 = + - @ 开头的单元格前置单引号，避免被 Excel/Sheets 当作公式执行
  assert.equal(escapeCsvCell("=cmd|'/c..."), "'=cmd|'/c...");
  assert.equal(escapeCsvCell("+1+1"), "'+1+1");
  assert.equal(escapeCsvCell("-2+3"), "'-2+3");
  assert.equal(escapeCsvCell("@SUM(A1)"), "'@SUM(A1)");
  // 普通文本与含逗号文本不受影响（仅转义引号包裹）
  assert.equal(escapeCsvCell("論語"), "論語");
  assert.equal(escapeCsvCell('a"b'), '"a""b"');
});
