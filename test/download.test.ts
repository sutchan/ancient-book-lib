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
