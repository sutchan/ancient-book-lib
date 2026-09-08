import assert from "node:assert/strict";
import { test } from "node:test";
import { filterCharacters, uniqueDynasties, uniqueTags } from "../lib/characterFilter";
import type { Character } from "../lib/types";

const chars: Character[] = [
  { id: "c1", name: "孔子", zi: "仲尼", alias: "", dynasty: "春秋", native: "鲁国", birth: "前551", death: "前479", office: "司寇", tags: ["儒家", "思想家"], desc: "至圣先师", books: ["論語"] },
  { id: "c2", name: "孟子", zi: "子舆", alias: "", dynasty: "战国", native: "邹国", birth: "前372", death: "前289", office: "", tags: ["儒家"], desc: "亚圣", books: ["孟子"] },
  { id: "c3", name: "老子", zi: "伯阳", alias: "李耳", dynasty: "春秋", native: "楚国", birth: "", death: "", office: "", tags: ["道家"], desc: "", books: [] },
];

test("uniqueDynasties 去重排序", () => {
  assert.deepEqual(uniqueDynasties(chars).slice().sort(), ["春秋", "战国"].slice().sort());
});

test("uniqueTags 汇总去重", () => {
  assert.deepEqual(uniqueTags(chars).slice().sort(), ["儒家", "思想家", "道家"].slice().sort());
});

test("filterCharacters 关键词命中姓名/字/籍贯", () => {
  assert.equal(filterCharacters(chars, { query: "孔子" }).length, 1);
  assert.equal(filterCharacters(chars, { query: "仲尼" })[0].id, "c1");
  assert.equal(filterCharacters(chars, { query: "鲁国" })[0].id, "c1");
});

test("filterCharacters 朝代精确筛选", () => {
  const r = filterCharacters(chars, { dynasty: "春秋" });
  assert.equal(r.length, 2);
});

test("filterCharacters 标签精确筛选", () => {
  const r = filterCharacters(chars, { tag: "道家" });
  assert.equal(r.length, 1);
  assert.equal(r[0].id, "c3");
});

test("filterCharacters 组合筛选 + 排序（按朝代）", () => {
  const r = filterCharacters(chars, { tag: "儒家", sort: "dynasty" });
  assert.equal(r.length, 2);
  assert.equal(r[0].dynasty, "春秋"); // 孔子(春秋) 排在 孟子(战国) 前
});
