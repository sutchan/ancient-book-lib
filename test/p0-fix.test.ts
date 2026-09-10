// test/p0-fix.test.ts v1.5.1
import assert from "node:assert/strict";
import { test } from "node:test";
import { searchByTitle } from "../lib/search";
import { formatYear, formatLife, type CbdbMeta, loadSurnamePersons } from "../lib/cbdb";
import { fetchRangeText } from "../lib/fetchWithTimeout";
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

// ---------------------------------------------------------------------------
// P0 回归锁：#1 分片路径 / #2 小姓兜底 / #4 Range 前缀
// 三者均为「路径/协议拼装」类缺陷，改错一处即线上 404 或整本下载，
// 故用最小 fetch 桩捕获真实请求，锁死拼装结果。
// ---------------------------------------------------------------------------
interface CapturedCall {
  url: string;
  headers: Record<string, string>;
}

/** 安装 fetch 桩：记录每次请求的 URL 与请求头，返回固定响应；返回还原函数 */
function stubFetch(
  responder: (url: string) => unknown,
  captured: CapturedCall[],
  opts: { status?: number; body?: string } = {}
): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: unknown, init: any = {}) => {
    const headers: Record<string, string> = {};
    const h = init?.headers;
    if (h instanceof Headers) h.forEach((v, k) => (headers[k] = v));
    else if (h) Object.assign(headers, h);
    captured.push({ url: String(url), headers });
    return new Response(opts.body ?? JSON.stringify(responder(String(url))), {
      status: opts.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

test("P0 #1 分片路径：大姓分片必须请求根路径绝对地址（含 surnames/ 前缀）", async () => {
  const meta = {
    surnames: [
      { surname: "李", count: 100, file: "surnames/%E6%9D%8E.json", standalone: true },
    ],
  } as unknown as CbdbMeta;
  const captured: CapturedCall[] = [];
  const restore = stubFetch(() => [[1, "李白", "", 701, 762, 0, 0, "唐", ""]], captured);
  try {
    const persons = await loadSurnamePersons(meta, "李");
    // 静态导出下 /people/ 等 trailingSlash 页面必须走绝对地址，否则解析为 /people/surnames/... 404
    assert.equal(captured[0].url, "/index/cbdb/surnames/%E6%9D%8E.json");
    assert.equal(persons.length, 1);
    assert.equal(persons[0][1], "李白");
  } finally {
    restore();
  }
});

test("P0 #2 小姓兜底：无独立分片时回退 _others.json 并按首字段姓氏过滤", async () => {
  const meta = { surnames: [] } as unknown as CbdbMeta; // 空姓氏表 → 任何姓都走兜底
  const captured: CapturedCall[] = [];
  const restore = stubFetch(
    () => [
      ["迮", 9001, "迮某", "", 0, 0, 0, 0, "清", ""],
      ["李", 1, "李四", "", 0, 0, 0, 0, "唐", ""],
    ],
    captured
  );
  try {
    const persons = await loadSurnamePersons(meta, "迮");
    assert.equal(captured[0].url, "/index/cbdb/surnames/_others.json");
    // 兜底分片是 [姓氏, ...人物] 的合流结构，须按姓氏过滤并剥掉首字段
    assert.equal(persons.length, 1);
    assert.equal(persons[0][1], "迮某");
  } finally {
    restore();
  }
});

test("P0 #4 Range 前缀：请求头只补一次 bytes=（不得出现 bytes=bytes=）", async () => {
  const captured: CapturedCall[] = [];
  const restore = stubFetch(() => null, captured, { status: 206, body: "章节原文" });
  try {
    const text = await fetchRangeText("https://cdn.example.com/book.txt", "1024-2047");
    assert.equal(text, "章节原文");
    assert.equal(captured[0].headers["Range"], "bytes=1024-2047");
    assert.ok(!captured[0].headers["Range"].includes("bytes=bytes="));
  } finally {
    restore();
  }
});
