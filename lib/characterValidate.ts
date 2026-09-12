// lib/characterValidate.ts v1.13.2
/**
 * 人物考据 · 数据校验层
 *
 * 职责：对一份 CharacterProfile 做「史料一致性体检」——
 * CBDB 是多人协作的历史数据库，生卒倒挂、年份越界、登科晚于卒年这类脏数据并不罕见，
 * 直接渲染会让读者误以为考据有误，因此需要在展示前把可疑处显式标出。
 *
 * 设计要点：
 * 1. issue.code 是稳定契约：前端按 code 映射图标与文案，不得随意改名。
 * 2. 所有涉及年份的规则在年份为 null 时必须跳过——CBDB 用 0（已折算成 null）表示缺失，
 *    拿缺失值去比较会批量产生假阳性。
 * 3. 完整度评分按维度加权求和，权重固定（合计 100），便于跨人物横向比较；
 *    score 在返回前夹取到 [0, 100]，防止后续调整权重时越过百分制上限。
 */
import { FACET_KEYS, FACET_LABELS } from "./characterProfile";
import type { CharacterProfile, FacetKey } from "./characterProfile";

export type IssueSeverity = "error" | "warn" | "info";

export interface ValidationIssue {
  code: string; // 稳定大写下划线码
  severity: IssueSeverity;
  field: string; // 所属档案字段路径，如 "life.deathYear"
  message: string; // 面向中文用户的简短说明
  hint?: string; // 可选的处置建议
}

export interface ValidationDimension {
  key: string;
  label: string;
  weight: number;
  hit: boolean;
}

export interface CharacterValidation {
  issues: ValidationIssue[];
  hasError: boolean;
  completeness: {
    score: number; // 0–100 整数
    grade: "AAA" | "AA" | "A" | "B" | "C";
    dimensions: ValidationDimension[];
  };
}

/** 年份可信区间：超出即视为 CBDB 脏数据（秦始皇以前与公元 3000 年后都不该出现） */
const YEAR_MAX = 3000;
const YEAR_MIN = -2500;

/** 完整度维度权重（合计 100），顺序即 UI 展示顺序 */
const DIMENSIONS: { key: string; label: string; weight: number }[] = [
  { key: "name", label: "姓名", weight: 10 },
  { key: "life", label: "生卒年", weight: 16 },
  { key: "indexYear", label: "指数年", weight: 5 },
  { key: "dynasty", label: "朝代", weight: 9 },
  { key: "nativePlace", label: "籍贯", weight: 9 },
  { key: "altnames", label: "字號別名", weight: 8 },
  { key: "entries", label: "科举/入仕", weight: 8 },
  { key: "offices", label: "任职", weight: 9 },
  { key: "texts", label: "著作", weight: 12 },
  { key: "sources", label: "史料来源", weight: 4 },
  { key: "relations", label: "亲属/社会关系", weight: 10 },
];

/** 年份越界判定（0 视为缺失，不参与） */
function outOfRange(year: number): boolean {
  return Math.abs(year) > YEAR_MAX || year < YEAR_MIN;
}

/** 有效年份（0 在 CBDB 里代表缺失，已在此层统一挡掉） */
function valid(year: number | null | undefined): year is number {
  return typeof year === "number" && Number.isFinite(year) && year !== 0;
}

/**
 * 对一份人物档案做一致性校验与完整度评分。
 * 纯函数、同步、无副作用。
 */
export function validateCharacterProfile(p: CharacterProfile): CharacterValidation {
  const issues: ValidationIssue[] = [];
  const push = (
    code: string,
    severity: IssueSeverity,
    field: string,
    message: string,
    hint?: string
  ) => {
    issues.push(hint ? { code, severity, field, message, hint } : { code, severity, field, message });
  };

  const name = (p.identity?.name ?? "").trim();
  const dynasty = (p.identity?.dynasty ?? "").trim();
  const nativePlace = (p.nativePlace ?? "").trim();
  const birth = p.life?.birthYear ?? null;
  const death = p.life?.deathYear ?? null;
  const indexYear = p.identity?.indexYear ?? null;

  // ---- 姓名 ----
  if (!name) {
    push("NAME_MISSING", "error", "identity.name", "人物姓名缺失", "该条 CBDB 记录的姓名字段为空，考据价值有限");
  }

  // ---- 生卒 ----
  if (birth === null && death === null) {
    push("LIFE_MISSING", "warn", "life", "生卒年俱缺", "可尝试通过亲属关系或任职年份反推活跃年代");
  }

  // 直接判 death < birth 而非复用别名布尔量，让 TS 能在分支内窄化 birth/death
  if (valid(birth) && valid(death) && death < birth) {
    push(
      "BIRTH_DEATH_INVERTED",
      "error",
      "life.deathYear",
      `卒年（${death}）早于生年（${birth}），生卒顺序颠倒`,
      "疑为 CBDB 录入错误，引用时请以原始史料为准"
    );
  }

  if (valid(birth) && valid(death) && death >= birth) {
    const span = death - birth;
    if (span > 120 || span < 10) {
      push(
        "LIFESPAN_IMPLAUSIBLE",
        "warn",
        "life.lifespan",
        `享年 ${span} 岁，超出常理区间（10–120 岁）`,
        "可能是生卒年有一端记录有误"
      );
    }
  }

  // ---- 年份越界 ----
  const yearFields: { field: string; value: number | null }[] = [
    { field: "life.birthYear", value: birth },
    { field: "life.deathYear", value: death },
    { field: "identity.indexYear", value: indexYear },
  ];
  (p.entries ?? []).forEach((e, i) => {
    yearFields.push({ field: `entries[${i}].year`, value: e?.year ?? null });
  });
  (p.offices ?? []).forEach((o, i) => {
    yearFields.push({ field: `offices[${i}].firstYear`, value: o?.firstYear ?? null });
    yearFields.push({ field: `offices[${i}].lastYear`, value: o?.lastYear ?? null });
  });
  for (const yf of yearFields) {
    if (valid(yf.value) && outOfRange(yf.value)) {
      push(
        "YEAR_OUT_OF_RANGE",
        "error",
        yf.field,
        `年份 ${yf.value} 超出可信区间`,
        "该年份疑为 CBDB 脏数据，不应直接引用"
      );
    }
  }

  // ---- 科举/入仕年份与生卒的冲突 ----
  (p.entries ?? []).forEach((e, i) => {
    const y = e?.year ?? 0;
    if (!valid(y)) return; // 0 表示年份缺失
    if (valid(death) && y > death) {
      push(
        "ENTRY_AFTER_DEATH",
        "error",
        `entries[${i}].year`,
        `登科年份 ${y} 晚于卒年 ${death}`,
        "疑为同名人物混入或年份录入错误"
      );
    }
    if (valid(birth) && y < birth) {
      push(
        "ENTRY_BEFORE_BIRTH",
        "error",
        `entries[${i}].year`,
        `登科年份 ${y} 早于生年 ${birth}`,
        "疑为同名人物混入或年份录入错误"
      );
    }
  });

  // ---- 任职年份与生卒的冲突 ----
  (p.offices ?? []).forEach((o, i) => {
    if (!o) return;
    const years: { field: string; value: number }[] = [
      { field: `offices[${i}].firstYear`, value: o.firstYear ?? 0 },
      { field: `offices[${i}].lastYear`, value: o.lastYear ?? 0 },
    ];
    for (const y of years) {
      if (!valid(y.value)) continue;
      // 生卒只有一端时，用另一端做单侧参照也要判
      const beforeBirth = valid(birth) && y.value < birth;
      const afterDeath = valid(death) && y.value > death;
      if (beforeBirth || afterDeath) {
        push(
          "OFFICE_YEAR_OUT_OF_LIFE",
          "warn",
          y.field,
          `任职年份 ${y.value} 越出生卒区间（${valid(birth) ? birth : "生年不详"}–${
            valid(death) ? death : "卒年不详"
          }）`,
          "任职记录可能归属同名人物"
        );
      }
    }
  });

  // ---- 指数年 ----
  if (!valid(indexYear)) {
    push("INDEX_YEAR_MISSING", "info", "identity.indexYear", "指数年缺失", "无法确定该人物的活跃年代");
  } else if (valid(birth) && valid(death) && (indexYear < birth || indexYear > death)) {
    push(
      "INDEX_YEAR_OUT_OF_LIFE",
      "warn",
      "identity.indexYear",
      `指数年 ${indexYear} 不在生卒区间 ${birth}–${death} 内`,
      "指数年通常取生平活跃点，越界说明生卒年或指数年有一处存疑"
    );
  }

  // ---- 朝代 / 籍贯 / 别名 ----
  if (!dynasty) {
    push("DYNASTY_MISSING", "warn", "identity.dynasty", "朝代缺失", "无法确定该人物的历史时期");
  }
  if (!nativePlace) {
    push("NATIVE_PLACE_MISSING", "info", "nativePlace", "籍贯缺失", "CBDB 中该人物的籍贯字段为空");
  }
  const altnameFacet = p.facets?.altnames;
  if ((p.altnames ?? []).length === 0 && altnameFacet?.status !== "error") {
    push("ALTNAME_MISSING", "info", "altnames", "未收录字號別名", "CBDB 的 ALTNAME_DATA 中没有该人物的字号记录");
  }

  // ---- 分面加载失败 ----
  const failed: FacetKey[] = FACET_KEYS.filter((k) => p.facets?.[k]?.status === "error");
  if (failed.length > 0) {
    const labels = failed.map((k) => FACET_LABELS[k]).join("、");
    push(
      "FACET_FAILED",
      "warn",
      "facets",
      `以下分面数据未能加载：${labels}`,
      "索引分片可能缺失或网络异常，可稍后重试"
    );
  }

  return {
    issues,
    hasError: issues.some((i) => i.severity === "error"),
    completeness: scoreCompleteness(p),
  };
}

/** 按固定权重计算完整度得分与等级 */
function scoreCompleteness(p: CharacterProfile): CharacterValidation["completeness"] {
  const has = (v: unknown): boolean => {
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "number") return Number.isFinite(v) && v !== 0;
    if (Array.isArray(v)) return v.length > 0;
    return Boolean(v);
  };

  const birth = p.life?.birthYear ?? null;
  const death = p.life?.deathYear ?? null;
  // 生卒各占一半：只有一端记一半分，避免"半条生卒"被判 0 分
  const lifeRatio = (valid(birth) ? 0.5 : 0) + (valid(death) ? 0.5 : 0);

  const raw: Record<string, boolean> = {
    name: has(p.identity?.name),
    life: lifeRatio > 0,
    indexYear: valid(p.identity?.indexYear),
    dynasty: has(p.identity?.dynasty),
    nativePlace: has(p.nativePlace),
    altnames: has(p.altnames),
    entries: has(p.entries),
    offices: has(p.offices),
    texts: has(p.texts),
    sources: has(p.sources),
    relations: has(p.kin) || has(p.assoc),
  };

  // 权重固定不变（UI 需要稳定的总分口径），仅"生卒年"这一维在计分时按半量折算
  const dimensions: ValidationDimension[] = DIMENSIONS.map((d) => ({
    key: d.key,
    label: d.label,
    weight: d.weight,
    hit: Boolean(raw[d.key]),
  }));

  const total = Math.round(
    dimensions.reduce(
      (sum, d) => sum + (d.hit ? (d.key === "life" ? d.weight * lifeRatio : d.weight) : 0),
      0
    )
  );
  // 防御性夹取：契约声明 score 为 0–100，权重表日后若被改动也不该越界
  const score = Math.max(0, Math.min(100, total));

  return { score, grade: gradeOf(score), dimensions };
}

function gradeOf(score: number): "AAA" | "AA" | "A" | "B" | "C" {
  if (score >= 85) return "AAA";
  if (score >= 70) return "AA";
  if (score >= 55) return "A";
  if (score >= 35) return "B";
  return "C";
}

/** 一行中文摘要，用于卡片/页头的紧凑展示 */
export function summarizeValidation(v: CharacterValidation): string {
  const issues = v?.issues ?? [];
  const { score, grade } = v?.completeness ?? { score: 0, grade: "C" as const };
  const tail = `档案完整度 ${score}（${grade}）`;
  if (issues.length === 0) return `档案校验通过 · ${tail}`;

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warn").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  const parts: string[] = [];
  if (errorCount > 0) parts.push(`${errorCount} 处矛盾`);
  if (warnCount > 0) parts.push(`${warnCount} 处存疑`);
  if (infoCount > 0) parts.push(`${infoCount} 条提示`);
  if (parts.length === 0) return `档案校验通过 · ${tail}`;
  return `发现 ${parts.join("、")} · ${tail}`;
}

/** 按严重度分组，顺序固定为 error → warn → info */
export function groupIssuesBySeverity(
  v: CharacterValidation
): Record<IssueSeverity, ValidationIssue[]> {
  const out: Record<IssueSeverity, ValidationIssue[]> = { error: [], warn: [], info: [] };
  for (const issue of v?.issues ?? []) {
    out[issue.severity]?.push(issue);
  }
  return out;
}
