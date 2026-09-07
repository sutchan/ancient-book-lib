import { test } from "node:test";
import assert from "node:assert/strict";
import {
  searchAll,
  searchCharacters,
  statsByCategory,
  statsByDynasty,
  statsByTag,
  statsByRelationType,
  chunkPlan,
  searchByIndex,
} from "../lib/search";

test("searchAll 命中书名并返回高分", () => {
  const r = searchAll("论语", "title");
  assert.ok(r.length > 0);
  assert.ok(r[0].book.includes("论语") || r[0].chapter.includes("论语"));
  assert.ok(r[0].score >= 90);
});

test("searchAll 全文模式命中正文", () => {
  const r = searchAll("不亦", "full");
  assert.ok(r.length > 0, "应命中论语正文");
});

test("searchAll 空关键词返回空", () => {
  assert.deepEqual(searchAll("", "full"), []);
});

test("searchAll 排序按分数降序", () => {
  const r = searchAll("子", "full", 20);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
});

test("searchCharacters 支持字号与别名检索", () => {
  assert.ok(searchCharacters("仲尼").some((p) => p.name === "孔子"));
  assert.ok(searchCharacters("青莲").some((p) => p.name === "李白"));
  assert.ok(searchCharacters("").length >= 20);
});

test("stats 计算与数据一致", () => {
  const byCat = statsByCategory();
  assert.equal(byCat.reduce((s, r) => s + r.count, 0), 45);
  const byDyn = statsByDynasty();
  assert.ok(byDyn[0].count >= byDyn[byDyn.length - 1].count);
  const byTag = statsByTag();
  assert.ok(byTag.some((r) => r.name === "思想家"));
  const byRel = statsByRelationType();
  assert.ok(byRel.some((r) => r.name === "师生"));
});

test("chunkPlan 分片覆盖完整字节区间", () => {
  const plan = chunkPlan(10000);
  assert.equal(plan.chunks, 3);
  assert.equal(plan.ranges[0][0], 0);
  assert.equal(plan.ranges[plan.ranges.length - 1][1], 9999);
});

test("searchByIndex 无索引时降级为普通检索", () => {
  const r = searchByIndex("论语", null, 10);
  assert.ok(r.length > 0);
});
