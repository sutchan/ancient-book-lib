// test/person-timeline.test.ts —— 生命时间轴聚合逻辑（纯函数）
import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateTimelineEvents } from "@/components/PersonTimeline";

test("生卒年 + 科举 + 任职按年聚合且排序", () => {
  const events = aggregateTimelineEvents({
    birth: 1036,
    death: 1101,
    entries: [{ entry: "科舉: 進士(籠統)", year: 1057 }],
    offices: [{ office: "大理寺評事", firstYear: 1061 }],
  });
  assert.deepEqual(
    events.map((e) => [e.year, e.type, e.label]),
    [
      [1036, "birth", "生"],
      [1057, "entry", "進士(籠統)"],
      [1061, "office", "大理寺評事"],
      [1101, "death", "卒"],
    ]
  );
});

test("同年事件合并：类型优先级 birth>entry>office>death，多余项标注等N项", () => {
  const events = aggregateTimelineEvents({
    entries: [{ entry: "科舉制舉: 賢良方正能直言極諫科", year: 1061 }],
    offices: [
      { office: "大理寺評事", firstYear: 1061 },
      { office: "簽書鳳翔府判官", firstYear: 1061 },
    ],
  });
  assert.equal(events.length, 1);
  assert.equal(events[0].year, 1061);
  assert.equal(events[0].type, "entry");
  assert.equal(events[0].label, "賢良方正能直言極…、大理寺評事 等3项");
});

test("过滤缺失与异常年份（0/负数/超 2200）", () => {
  const events = aggregateTimelineEvents({
    birth: 0,
    death: 2200,
    entries: [{ entry: "進士", year: 0 }],
    offices: [{ office: "某官", firstYear: -5 }, { office: "某官2", firstYear: 2300 }],
  });
  assert.equal(events.length, 0);
});

test("科举前缀剥离：科舉:/科舉制舉: 不进入标签", () => {
  const events = aggregateTimelineEvents({
    entries: [{ entry: "科舉: 進士", year: 1000 }],
    offices: [],
  });
  assert.equal(events[0].label, "進士");
});

test("空输入返回空数组", () => {
  assert.deepEqual(aggregateTimelineEvents({ entries: [], offices: [] }), []);
});
