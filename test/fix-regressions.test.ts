/**
 * 缺陷回归测试（v1.15.5）
 *
 * 这些用例对应 2026-09-13 bug 专项审查中「经可执行验证确认」的缺陷，
 * 此前 53 个用例对它们**零覆盖**：
 *   - H1 章节标题误判 / 缩进标题被否决（lib/chapterParse.ts）
 *   - H2 卷首（序）内容被并入第一章（lib/chapterParse.ts）
 *   - H3 页内搜索繁简双向不对称（lib/readerSearch.ts）
 *   - W2 阅读位置书签 createdAt 同毫秒碰撞、无上限（lib/bookmarks.ts）
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { isChapterTitle, parseChapters, chapterBoundaries } from "../lib/chapterParse";
import { buildReaderMatches, splitHighlight } from "../lib/readerSearch";
import { addReadPos, removeReadPos, MAX_READ_POS } from "../lib/bookmarks";

/* ============ 极简 localStorage 桩（与 bookmarks.test.ts 一致） ============ */
class MemStorage {
  private store = new Map<string, string>();
  getItem(k: string): string | null {
    return this.store.has(k) ? (this.store.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v));
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
  clear(): void {
    this.store.clear();
  }
}
const mem = new MemStorage();
(globalThis as unknown as { window: unknown; localStorage: unknown }).window = { localStorage: mem };
(globalThis as unknown as { localStorage: unknown }).localStorage = mem;

/* ============================ H1 章节标题识别 ============================ */

test("H1：全角空格缩进的真实标题应被识别（佛经品题 / 章回）", () => {
  // 曾以「行首缩进 = 正文」直接否决整行；40 部真实语料实测该规则否决了 61% 的真实标题
  assert.equal(isChapterTitle("　　行品第一", "上一行正文", ""), true);
  assert.equal(isChapterTitle("　　分别品第二", "上一行正文", ""), true);
  assert.equal(isChapterTitle("　　第七回　林琼玉孝让分财", "上一行正文", ""), true);
});

test("H1：裸编号标题与带分隔符标题均可用", () => {
  assert.equal(isChapterTitle("卷一", undefined, ""), true);
  assert.equal(isChapterTitle("第二回　宴桃园豪杰三结义", undefined, ""), true);
  assert.equal(isChapterTitle("第一章·温病解释之正误", undefined, ""), true);
});

test("H1 已知局限：以「卷X…」开头的正文行仍会被判为标题（待语料驱动再收紧）", () => {
  // 记录现状而非期望值：收紧正则在 40 部真实语料上会损失 48% 真实召回
  // （失去的 13 条全是真佛经品题），故本轮**有意不收紧**。此处固化现状以便日后有数据时再改。
  assert.equal(isChapterTitle("卷二正文乙", undefined, undefined), true);
});

/* ============================ H2 卷首归属 ============================ */

test("H2：卷首（序）自成一章，不被并入第一章", () => {
  const text = ["序文第一行", "序文第二行", "", "卷一", "", "正文甲"].join("\n");
  const chapters = parseChapters(text, "测试书");

  assert.equal(chapters.length, 2);
  assert.equal(chapters[0].title, "测试书"); // 首章之前的内容 → 卷首章
  assert.deepEqual(chapters[0].paragraphs, ["序文第一行", "序文第二行"]);

  const juan1 = chapters[1];
  assert.equal(juan1.title, "卷一");
  assert.deepEqual(juan1.paragraphs, ["正文甲"]);
  assert.ok(!juan1.paragraphs.some((p) => p.includes("序文")), "序文不得出现在第一章");
});

test("H2：没有卷首时不产生多余空章", () => {
  const chapters = parseChapters(["卷一", "", "正文甲"].join("\n"), "测试书");
  assert.equal(chapters.length, 1);
  assert.equal(chapters[0].title, "卷一");
  assert.deepEqual(chapters[0].paragraphs, ["正文甲"]);
});

test("H2：完全无标题时整书作为一章（回退语义不变）", () => {
  const chapters = parseChapters(["甲", "乙", "丙"].join("\n"), "测试书");
  assert.equal(chapters.length, 1);
  assert.equal(chapters[0].title, "测试书");
  assert.deepEqual(chapters[0].paragraphs, ["甲", "乙", "丙"]);
});

/* ============================ chapterBoundaries 偏移 ============================ */

test("chapterBoundaries：区间连续、精确到文末、切片以标题开头", () => {
  const text = ["序文", "", "卷一", "", "正文甲", "", "卷二", "", "正文乙"].join("\n");
  const b = chapterBoundaries(text);

  assert.equal(b.length, 2);
  assert.equal(b[0].title, "卷一");
  assert.equal(b[1].title, "卷二");
  // 末章 charEnd 必须精确等于文长（曾因末行多计一个 \n 而越界 1 个字符）
  assert.equal(b[b.length - 1].charEnd, text.length);
  for (let i = 1; i < b.length; i++) assert.equal(b[i].charStart, b[i - 1].charEnd);
  for (const seg of b) assert.ok(text.slice(seg.charStart, seg.charEnd).trimStart().startsWith(seg.title));
});

/* ============================ H3 页内搜索繁简对称 ============================ */

const TRAD = "學而時習之，不亦說乎";

test("H3：繁体正文 + 简体查询 → 命中且能高亮（原文切片）", () => {
  const matches = buildReaderMatches([{ title: "學而", paragraphs: [TRAD] }], "时习", 8, false);
  assert.equal(matches.length, 1);

  const segs = splitHighlight(TRAD, "时习");
  const hits = segs.filter((s) => s.hit).map((s) => s.text);
  assert.deepEqual(hits, ["時習"], "高亮应落在原文（繁体）片段上");
  assert.equal(segs.map((s) => s.text).join(""), TRAD, "拼接后不得丢字");
});

test("H3：简体对照模式 + 繁体查询 → 不再漏检", () => {
  const matches = buildReaderMatches([{ title: "学而", paragraphs: ["学而时习之"] }], "時習", 8, true);
  assert.equal(matches.length, 1, "simple=true 时也应做繁简回退匹配");
});

test("H3：高亮段数与命中数一致（命中列表不得出现「点进去没有高亮」）", () => {
  const matches = buildReaderMatches([{ title: "學而", paragraphs: [TRAD] }], "时习", 8, false);
  const hitSegs = splitHighlight(TRAD, "时习").filter((s) => s.hit).length;
  assert.equal(matches.length, hitSegs);
});

test("H3：简体正文 + 简体查询 与 繁体正文 + 繁体查询 仍正常", () => {
  assert.equal(splitHighlight("学而时习之", "时习").filter((s) => s.hit)[0].text, "时习");
  assert.equal(splitHighlight(TRAD, "時習").filter((s) => s.hit)[0].text, "時習");
});

/* ============================ W2 阅读位置书签 ============================ */

test("W2：同一毫秒内保存两次，createdAt 不碰撞且互不误删", () => {
  const bid = "dzg-00009";
  mem.setItem(`ab-pos-${bid}`, "[]");
  const a = addReadPos(bid, { chapterIdx: 0, pageIdx: 0, label: "A" });
  const b = addReadPos(bid, { chapterIdx: 0, pageIdx: 1, label: "B" });

  assert.equal(b.length, 2);
  assert.notEqual(a[0].createdAt, b[1].createdAt, "createdAt 必须唯一（同时充当 React key 与删除键）");

  const after = removeReadPos(bid, b[1].createdAt);
  assert.equal(after.length, 1, "删除一条不得连带删除另一条");
  assert.equal(after[0].label, "A");
});

test("W2：超过上限时丢弃最早记录，避免 localStorage 无限增长", () => {
  const bid = "dzg-00010";
  mem.setItem(`ab-pos-${bid}`, "[]");
  let list = addReadPos(bid, { chapterIdx: 0, pageIdx: 0, label: "L0" });
  for (let i = 1; i < MAX_READ_POS + 5; i++) {
    list = addReadPos(bid, { chapterIdx: i, pageIdx: 0, label: `L${i}` });
  }
  assert.equal(list.length, MAX_READ_POS);
  assert.equal(list[0].label, "L5");
  assert.equal(list[list.length - 1].label, `L${MAX_READ_POS + 4}`);
});
