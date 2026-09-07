import { test } from "node:test";
import assert from "node:assert/strict";
import { T2S_MAP, toSimplified } from "../lib/t2s";

test("繁简映射扩展：映射表覆盖 800+ 古籍高频字", () => {
  assert.ok(Object.keys(T2S_MAP).length >= 800, `实际 ${Object.keys(T2S_MAP).length}`);
});

test("繁简映射：古籍高频字正确转换", () => {
  assert.equal(T2S_MAP["歲"], "岁");
  assert.equal(T2S_MAP["龜"], "龟");
  assert.equal(T2S_MAP["龍"], "龙");
  assert.equal(T2S_MAP["聽"], "听");
  assert.equal(T2S_MAP["禮"], "礼");
});

test("繁简转换：论语样本全量简体化", () => {
  const out = toSimplified("學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？");
  assert.equal(out, "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？");
});

test("繁简转换：心经样本无繁体残留", () => {
  const out = toSimplified("觀自在菩薩，行深般若波羅蜜多時，照見五蘊皆空，度一切苦厄。");
  // 校验所有原繁体字均已转换（简繁同形字除外）
  for (const ch of ["觀", "薩", "羅", "時", "見", "蘊"]) {
    assert.ok(!out.includes(ch), `不应残留繁体「${ch}」: ${out}`);
  }
});

test("繁简转换：未覆盖字符原样保留", () => {
  assert.equal(toSimplified("學a"), "学a");
});
