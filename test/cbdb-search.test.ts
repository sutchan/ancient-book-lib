// test/cbdb-search.test.ts
/**
 * 人名搜索回归锁（searchPersons）
 * 覆盖：繁简双向、前缀命中、任意字子串命中、别名字号前缀/子串、limit 生效。
 * 旧实现只做 startsWith，导致「搜姓名中间字」（如「軾」→蘇軾）全部落空，
 * 而人物库空态却提示「可尝试输入姓名中的任意字」——本文件锁死该承诺。
 */
import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { searchPersons } from "../lib/cbdb";

// 姓名索引 [姓名, personid]（真实产物为按姓名排序的全量 661,350 条）
const SEARCH_INDEX: [string, number][] = [
  ["王安石", 1],
  ["王維", 2],
  ["李白", 3],
  ["李清照", 4],
  ["蘇軾", 5],
  ["杜甫", 6],
  ["楊維楨", 7],
];
// 别名检索索引 [别名, personid] 与 别名→姓名映射
const ALT_SEARCH: [string, number][] = [
  ["太白", 3],
  ["青蓮居士", 3],
  ["東坡居士", 5],
];
const ALT_PERSONS: [number, string][] = [
  [3, "李白"],
  [5, "蘇軾"],
];

// lib/cbdb 的索引为模块级缓存，故在首个用例前装好 fetch 桩并全程保留
const originalFetch = globalThis.fetch;

before(() => {
  globalThis.fetch = (async (url: unknown) => {
    const u = String(url);
    const json = (data: unknown) =>
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    if (u.endsWith("/index/cbdb/search.json")) return json(SEARCH_INDEX);
    if (u.endsWith("/altnames/altnames-search.json")) return json(ALT_SEARCH);
    if (u.endsWith("/altnames/altnames-person.json")) return json(ALT_PERSONS);
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
});

after(() => {
  globalThis.fetch = originalFetch;
});

const names = (r: { name: string }[]) => r.map((x) => x.name);

test("繁体前缀命中：搜「蘇」得蘇軾", async () => {
  const r = await searchPersons("蘇", 20);
  assert.ok(names(r).includes("蘇軾"));
  assert.equal(r.find((x) => x.name === "蘇軾")?.matched, "name");
});

test("简繁互通（前缀）：搜简体「苏」命中繁体「蘇軾」", async () => {
  const r = await searchPersons("苏", 20);
  assert.ok(names(r).includes("蘇軾"));
});

test("任意字子串命中：搜姓名中间字「軾」得蘇軾（旧实现落空）", async () => {
  const r = await searchPersons("軾", 20);
  assert.ok(names(r).includes("蘇軾"), "子串「軾」应命中蘇軾");
});

test("简繁互通（子串）：搜简体「轼」命中繁体「蘇軾」", async () => {
  const r = await searchPersons("轼", 20);
  assert.ok(names(r).includes("蘇軾"));
});

test("子串可同时命中多人：搜「維」得王維与楊維楨", async () => {
  const r = await searchPersons("維", 20);
  const got = names(r);
  assert.ok(got.includes("王維") && got.includes("楊維楨"));
});

test("姓名命中优先于别名：搜「白」时李白以姓名命中返回", async () => {
  const r = await searchPersons("白", 20);
  const li = r.find((x) => x.name === "李白");
  assert.ok(li, "李白应被命中");
  assert.equal(li?.matched, "name");
});

test("别名字号前缀命中：搜「東坡」得蘇軾并标注别名", async () => {
  const r = await searchPersons("東坡", 20);
  const su = r.find((x) => x.name === "蘇軾");
  assert.ok(su, "「東坡」应命中蘇軾");
  assert.equal(su?.matched, "alias");
  assert.equal(su?.alias, "東坡居士");
});

test("简繁互通（别名）：搜简体「东坡」命中蘇軾", async () => {
  const r = await searchPersons("东坡", 20);
  assert.ok(names(r).includes("蘇軾"));
});

test("别名字号子串命中：搜「居士」得蘇軾（東坡居士）与李白（青蓮居士）", async () => {
  const r = await searchPersons("居士", 20);
  const got = names(r);
  assert.ok(got.includes("蘇軾") && got.includes("李白"));
  assert.ok(r.every((x) => x.matched === "alias"));
});

test("limit 生效：返回条数不超过上限", async () => {
  const r = await searchPersons("維", 1);
  assert.equal(r.length, 1);
});
