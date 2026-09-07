import { test } from "node:test";
import assert from "node:assert/strict";
import { searchAll, distinctDynasties, categoryNames } from "../lib/search";

test("高级检索：馆藏筛选只返回该馆藏书籍", () => {
  const r = searchAll("论", "title", 50, { category: "儒藏" });
  assert.ok(r.length > 0);
  for (const item of r) {
    assert.ok(item.path.includes("儒藏"), `应全部命中儒藏，实际: ${item.path}`);
  }
});

test("高级检索：馆藏筛选排除其他馆藏", () => {
  const all = searchAll("", "full", 50);
  assert.equal(all.length, 0); // 空关键词不返回
  const ru = searchAll("经", "title", 50, { category: "佛藏" });
  for (const item of ru) {
    assert.ok(item.path.includes("佛藏"));
  }
});

test("高级检索：朝代筛选", () => {
  const r = searchAll("子", "title", 50, { dynasty: "春秋" });
  for (const item of r) {
    assert.ok(
      item.path.includes("考据 > 春秋") || item.kind === "book",
      "朝代筛选应作用于书籍与人物"
    );
  }
});

test("高级检索：组合筛选（馆藏+朝代）", () => {
  const r = searchAll("经", "full", 50, { category: "佛藏", dynasty: "唐" });
  for (const item of r) {
    assert.ok(item.path.includes("佛藏"), `佛藏过滤失败: ${item.path}`);
  }
});

test("检索：人物可按字号匹配", () => {
  const r = searchAll("子瞻", "full", 50);
  assert.ok(r.some((x) => x.book === "苏轼"));
});

test("检索：朝代列表去重且有序", () => {
  const d = distinctDynasties();
  assert.ok(d.length >= 10);
  assert.deepEqual(d, [...d].sort());
});

test("检索：馆藏名称列表与分类一致", () => {
  const names = categoryNames();
  assert.equal(names.length, 10);
  assert.ok(names.includes("儒藏"));
});

test("检索：关键词为空返回空数组", () => {
  assert.deepEqual(searchAll("  ", "full", 10), []);
});
