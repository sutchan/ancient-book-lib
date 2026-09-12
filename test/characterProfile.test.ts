// test/characterProfile.test.ts —— 人物档案契约层与校验层（纯函数，无需 fetch）
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCharacterProfile,
  fromLegacyCharacter,
  pickDistinguishers,
} from "../lib/characterProfile";
import type { CandidateHit, CharacterProfileInput } from "../lib/characterProfile";
import type { CbdbPerson } from "../lib/cbdb";
import type { Character } from "../lib/types";
import {
  groupIssuesBySeverity,
  summarizeValidation,
  validateCharacterProfile,
} from "../lib/characterValidate";

/** 造一个最小可用档案：只有姓名与朝代，其余留空 */
function profileWith(input: Omit<CharacterProfileInput, "person"> & { person?: CbdbPerson }) {
  const person: CbdbPerson = input.person ?? [1, "王某", "", 1000, 1060, 1030, 0, "宋", "开封"];
  return buildCharacterProfile({ ...input, person });
}

test("元组归一化：姓名/简体副本/生卒/性别位", () => {
  const su: CbdbPerson = [439127, "蘇軾", "Su Shi", 1037, 1101, 1080, 0, "宋", "眉州"];
  const p = buildCharacterProfile({ person: su });
  assert.equal(p.id, 439127);
  assert.equal(p.identity.name, "蘇軾");
  assert.equal(p.identity.nameSimplified, "苏轼");
  assert.equal(p.identity.pinyin, "Su Shi");
  assert.equal(p.identity.gender, "male");
  assert.equal(p.identity.dynasty, "宋");
  assert.equal(p.nativePlace, "眉州");
  assert.equal(p.life.birthYear, 1037);
  assert.equal(p.life.deathYear, 1101);
  assert.equal(p.life.lifespan, 64);
  assert.equal(p.identity.indexYear, 1080);
});

test("元组归一化：女性位与 0 年份折成 null", () => {
  const li: CbdbPerson = [135114, "李清照", "Li Qingzhao", 1084, 0, 1100, 1, "宋", ""];
  const p = buildCharacterProfile({ person: li });
  assert.equal(p.identity.gender, "female");
  assert.equal(p.life.birthYear, 1084);
  assert.equal(p.life.deathYear, null);
  assert.equal(p.life.lifespan, null);
  assert.equal(p.nativePlace, "");
});

test("facet 三态：有值 ok / 空数组 empty / 未加载 error", () => {
  const okProfile = profileWith({ altnames: [{ name: "子瞻", type: "字" }] });
  assert.equal(okProfile.facets.altnames.status, "ok");

  const emptyProfile = profileWith({ altnames: [] });
  assert.equal(emptyProfile.facets.altnames.status, "empty");

  const missingProfile = profileWith({});
  assert.equal(missingProfile.facets.altnames.status, "error");
  assert.equal(missingProfile.altnames.length, 0);
});

test("relations facet 由 kin/assoc 共同决定", () => {
  const onlyKin = profileWith({ kin: [{ id: 2, name: "王乙", rel: "父" }], assoc: [] });
  assert.equal(onlyKin.facets.relations.status, "ok");

  const bothEmpty = profileWith({ kin: [], assoc: [] });
  assert.equal(bothEmpty.facets.relations.status, "empty");

  const notLoaded = profileWith({});
  assert.equal(notLoaded.facets.relations.status, "error");
});

test("校验：生卒倒挂触发 error", () => {
  const p = profileWith({ person: [1, "李某", "", 1100, 1000, 1050, 0, "宋", ""] });
  const v = validateCharacterProfile(p);
  assert.equal(v.hasError, true);
  const issue = v.issues.find((i) => i.code === "BIRTH_DEATH_INVERTED");
  assert.ok(issue);
  assert.equal(issue.severity, "error");
  assert.equal(issue.field, "life.deathYear");
});

test("校验：生卒俱缺只报 LIFE_MISSING(warn)，不算 error", () => {
  // 各分面显式传空数组（= 已加载但为空），才不会额外触发 FACET_FAILED
  const p = profileWith({
    person: [2, "張某", "", 0, 0, 0, 0, "唐", ""],
    altnames: [],
    entries: [],
    offices: [],
    texts: [],
    kin: [],
    assoc: [],
    sources: [],
  });
  const v = validateCharacterProfile(p);
  assert.equal(v.hasError, false);
  const life = v.issues.filter((i) => i.severity !== "info");
  assert.deepEqual(
    life.map((i) => i.code),
    ["LIFE_MISSING"]
  );
  assert.equal(v.issues.some((i) => i.code === "BIRTH_DEATH_INVERTED"), false);
});

test("校验：登科年晚于卒年触发 ENTRY_AFTER_DEATH", () => {
  const p = profileWith({
    person: [3, "王某", "", 1000, 1050, 1020, 0, "宋", ""],
    entries: [{ entry: "科舉: 進士", year: 1080, rank: "" }],
  });
  const v = validateCharacterProfile(p);
  const issue = v.issues.find((i) => i.code === "ENTRY_AFTER_DEATH");
  assert.ok(issue);
  assert.equal(issue.severity, "error");
  assert.equal(v.hasError, true);
});

test("校验：年份越界与登科早于生年", () => {
  const p = profileWith({
    person: [4, "赵某", "", 1000, 1050, 1020, 0, "宋", ""],
    entries: [{ entry: "進士", year: 900, rank: "" }],
  });
  const codes = validateCharacterProfile(p).issues.map((i) => i.code);
  assert.ok(codes.includes("ENTRY_BEFORE_BIRTH"));

  const bad = profileWith({ person: [5, "钱某", "", 99999, 1050, 1020, 0, "宋", ""] });
  const badCodes = validateCharacterProfile(bad).issues.map((i) => i.code);
  assert.ok(badCodes.includes("YEAR_OUT_OF_RANGE"));
});

test("校验：分面加载失败产生 FACET_FAILED 并点名中文分面", () => {
  // entries / offices 等未加载（undefined）→ facet 状态 error
  const p = profileWith({ altnames: [] });
  const v = validateCharacterProfile(p);
  const issue = v.issues.find((i) => i.code === "FACET_FAILED");
  assert.ok(issue);
  assert.equal(issue.severity, "warn");
  assert.ok(issue.message.includes("科举/入仕"));
  assert.ok(issue.message.includes("亲属/社会关系"));
});

test("校验：空白档案落在 C 档且报 NAME_MISSING", () => {
  const blank = buildCharacterProfile({ person: [0, "", "", 0, 0, 0, 0, "", ""] });
  const v = validateCharacterProfile(blank);
  assert.equal(v.completeness.score, 0);
  assert.equal(v.completeness.grade, "C");
  assert.ok(v.issues.some((i) => i.code === "NAME_MISSING"));
});

test("校验：齐备档案拿满分并评 AAA", () => {
  const p = profileWith({
    altnames: [{ name: "子瞻", type: "字" }],
    entries: [{ entry: "進士", year: 1030, rank: "" }],
    offices: [{ office: "知州", firstYear: 1040, lastYear: 1045, appt: "" }],
    texts: [{ title: "某集", role: "撰", year: 1048 }],
    kin: [{ id: 2, name: "王乙", rel: "父" }],
    assoc: [{ id: 3, name: "王丙", rel: "友", year: 1042 }],
    sources: ["宋史"],
  });
  const v = validateCharacterProfile(p);
  // 权重合计为 100，齐备档案恰好满分，不应越出百分制
  assert.equal(v.completeness.score, 100);
  assert.equal(v.completeness.grade, "AAA");
  assert.equal(v.hasError, false);
});

test("校验：score 恒不超过 100（数组再长也不溢出）", () => {
  const many = (n: number) =>
    Array.from({ length: n }, (_, i) => i);
  const p = profileWith({
    altnames: many(50).map((i) => ({ name: `字第${i}`, type: "字" })),
    entries: many(50).map((i) => ({ entry: "進士", year: 1030 + (i % 20), rank: "" })),
    offices: many(50).map(() => ({
      office: "知州",
      firstYear: 1040,
      lastYear: 1045,
      appt: "",
    })),
    texts: many(50).map((i) => ({ title: `集${i}`, role: "撰", year: 1048 })),
    kin: many(50).map((i) => ({ id: 100 + i, name: `親${i}`, rel: "父" })),
    assoc: many(50).map((i) => ({ id: 200 + i, name: `友${i}`, rel: "友", year: 1042 })),
    sources: many(50).map((i) => `史料${i}`),
  });
  const v = validateCharacterProfile(p);
  assert.ok(v.completeness.score <= 100, `score 越界：${v.completeness.score}`);
  assert.equal(v.completeness.score, 100);
  // 维度权重合计本身也必须是 100，防止后续改权重表时悄悄越界
  const weightSum = v.completeness.dimensions.reduce((s, d) => s + d.weight, 0);
  assert.equal(weightSum, 100);
});

test("校验：只有一端生卒时 life 维按半量折算", () => {
  const half = profileWith({
    person: [9, "周某", "", 1000, 0, 1030, 0, "宋", "开封"],
    altnames: [],
    entries: [],
    offices: [],
    texts: [],
    kin: [],
    assoc: [],
    sources: [],
  });
  const full = profileWith({
    person: [9, "周某", "", 1000, 1060, 1030, 0, "宋", "开封"],
    altnames: [],
    entries: [],
    offices: [],
    texts: [],
    kin: [],
    assoc: [],
    sources: [],
  });
  const halfScore = validateCharacterProfile(half).completeness.score;
  const fullScore = validateCharacterProfile(full).completeness.score;
  assert.equal(fullScore - halfScore, 8); // life 权重 16，半量为 8
});

test("fromLegacyCharacter：cbdb id / 负数生年 / 空卒年", () => {
  const legacy: Character = {
    id: "cbdb-439127",
    name: "司馬遷",
    zi: "子長",
    alias: "",
    dynasty: "西漢",
    native: "",
    birth: "-135",
    death: "",
    office: "",
    tags: [],
    desc: "",
    books: [],
  };
  const p = fromLegacyCharacter(legacy);
  assert.equal(p.id, 439127);
  assert.equal(p.life.birthYear, -135);
  assert.equal(p.life.deathYear, null);
  assert.deepEqual(p.altnames, [{ name: "子長", type: "字" }]);
  assert.equal(p.facets.altnames.status, "ok");
  assert.equal(p.identity.gender, "unknown");
  assert.equal(p.identity.dynasty, "西漢");
  assert.equal(p.source?.license, "CC BY-NC-SA 4.0");
});

test("fromLegacyCharacter：字號并存、官职与著作落位、id 解析失败回退 0", () => {
  const p = fromLegacyCharacter({
    id: "no-number",
    name: "班固",
    zi: "孟堅",
    alias: "白虎通",
    dynasty: "東漢",
    native: "扶風",
    birth: "",
    death: "92",
    office: "蘭臺令史",
    tags: [],
    desc: "",
    books: ["漢書"],
  });
  assert.equal(p.id, 0);
  assert.equal(p.life.birthYear, null);
  assert.equal(p.life.deathYear, 92);
  assert.deepEqual(p.altnames, [
    { name: "孟堅", type: "字" },
    { name: "白虎通", type: "號" },
  ]);
  assert.equal(p.offices.length, 1);
  assert.equal(p.offices[0].office, "蘭臺令史");
  assert.equal(p.offices[0].firstYear, 0);
  assert.deepEqual(p.texts, [{ title: "漢書", role: "", year: 0 }]);
  assert.equal(p.facets.offices.status, "ok");
});

test("pickDistinguishers：朝代相同不产出区分项，不同则产出", () => {
  const same: CandidateHit[] = [
    { id: 1, name: "李甲", matched: "name", dynasty: "唐" },
    { id: 2, name: "李甲", matched: "name", dynasty: "唐" },
  ];
  assert.deepEqual(pickDistinguishers(same), []);

  const diff: CandidateHit[] = [
    { id: 1, name: "李甲", matched: "name", dynasty: "唐", indexYear: 800, nativePlace: "隴西" },
    { id: 2, name: "李甲", matched: "name", dynasty: "宋", indexYear: 1050, nativePlace: "開封" },
  ];
  const ds = pickDistinguishers(diff);
  assert.deepEqual(
    ds.map((d) => d.field),
    ["dynasty", "indexYear", "nativePlace"]
  );
  assert.equal(ds[0].label, "朝代");
  assert.ok(ds[0].sample.length <= 3);

  // 单条候选无需消歧
  assert.deepEqual(pickDistinguishers([diff[0]]), []);
});

test("pickDistinguishers：指数年 50 年内的差异不构成区分", () => {
  const close: CandidateHit[] = [
    { id: 1, name: "王甲", matched: "name", indexYear: 1000 },
    { id: 2, name: "王甲", matched: "name", indexYear: 1020 },
  ];
  assert.deepEqual(pickDistinguishers(close), []);

  const far: CandidateHit[] = [
    { id: 1, name: "王甲", matched: "name", indexYear: 1000 },
    { id: 2, name: "王甲", matched: "name", indexYear: 1100 },
  ];
  const ds = pickDistinguishers(far);
  assert.deepEqual(
    ds.map((d) => d.field),
    ["indexYear"]
  );
});

test("summarizeValidation 与 groupIssuesBySeverity 稳定返回", () => {
  const clean = profileWith({
    altnames: [{ name: "子瞻", type: "字" }],
    entries: [],
    offices: [],
    texts: [],
    kin: [],
    assoc: [],
    sources: [],
  });
  const cleanSummary = summarizeValidation(validateCharacterProfile(clean));
  assert.equal(typeof cleanSummary, "string");
  assert.ok(cleanSummary.length > 0);

  const dirty = validateCharacterProfile(
    profileWith({ person: [7, "孫某", "", 1100, 1000, 1050, 0, "宋", ""] })
  );
  const dirtySummary = summarizeValidation(dirty);
  assert.ok(dirtySummary.includes("矛盾") || dirtySummary.includes("存疑"));
  assert.ok(dirtySummary.includes("档案完整度"));

  const grouped = groupIssuesBySeverity(dirty);
  assert.ok(grouped.error.length >= 1);
  assert.equal(
    grouped.error.length + grouped.warn.length + grouped.info.length,
    dirty.issues.length
  );
});
