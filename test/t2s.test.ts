import { test } from "node:test";
import assert from "node:assert/strict";
import { T2S_MAP, toSimplified } from "../lib/t2s";

test("繁简映射表无重复键", () => {
  const keys = Object.keys(T2S_MAP);
  assert.equal(new Set(keys).size, keys.length, "映射表存在重复键");
});

test("繁简映射表覆盖高频古字", () => {
  for (const ch of ["學", "習", "說", "樂", "見", "賢", "無", "遠", "來", "為", "時", "國", "經", "眾", "滅", "諸", "實", "詩", "關", "從"]) {
    assert.ok(T2S_MAP[ch], `缺少映射: ${ch}`);
  }
});

test("toSimplified 转换正确性", () => {
  assert.equal(toSimplified("學而時習之，不亦說乎？"), "学而时习之，不亦说乎？");
  assert.equal(toSimplified("有朋自遠方來，不亦樂乎？"), "有朋自远方来，不亦乐乎？");
  assert.equal(toSimplified("觀自在菩薩，行深般若波羅蜜多時。"), "观自在菩萨，行深般若波罗蜜多时。");
});

test("toSimplified 对简体输入保持原样", () => {
  assert.equal(toSimplified("简体文本测试"), "简体文本测试");
});
