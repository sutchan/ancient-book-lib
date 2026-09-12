// lib/characterProfile.ts v1.13.2
/**
 * 人物考据 · 数据契约层
 *
 * 职责：把 lib/cbdb.ts 的紧凑元组 / 遗留 Character 种子数据，归一化为
 * 前端可直接消费的结构化档案 CharacterProfile，并给出分面（facet）加载状态。
 *
 * 设计要点：
 * 1. buildCharacterProfile 是纯函数（同步、无 fetch），便于单测与 SSR 复用；
 *    loadCharacterProfile 只负责编排取数，任何单一分面失败都不阻断整体。
 * 2. CBDB 用 0 表示"年份缺失"，与真实年份 0 无法区分，故一律在契约层转成 null，
 *    避免上层到处写 `year ? year : null` 的判空。
 * 3. 分面状态三态：ok（有数据）/ empty（已加载但为空）/ error（取数失败或未加载）。
 *    区分 empty 与 error 是为了让 UI 能区分"此人确无科举记录"与"索引没加载出来"。
 * 4. 所有运行时资源路径走根绝对路径——静态导出 trailingSlash 页面下相对路径会 404。
 *    （本模块不直接 fetch，路径约定由 lib/cbdb.ts 统一保证。）
 */
import { toSimplified } from "./t2s";
import type { CbdbPerson } from "./cbdb";
import {
  findPersonById,
  getPersonAltnames,
  getPersonEntries,
  getPersonOffices,
  getPersonRelations,
  getPersonSources,
  getPersonTexts,
  loadCbdbMeta,
  loadRelNames,
} from "./cbdb";
import type { Character } from "./types";

// ============ 分面（facet）状态 ============

export type FacetKey = "altnames" | "entries" | "offices" | "sources" | "relations" | "texts";
export type FacetStatus = "ok" | "empty" | "error";
export interface FacetState {
  key: FacetKey;
  status: FacetStatus;
  error?: string;
}
export type FacetMap = Record<FacetKey, FacetState>;

/** 分面中文名：UI 与校验文案共用，避免中文名散落各处 */
export const FACET_LABELS: Record<FacetKey, string> = {
  altnames: "字號別名",
  entries: "科举/入仕",
  offices: "任职",
  sources: "史料来源",
  relations: "亲属/社会关系",
  texts: "著作",
};

/** 分面固定顺序：保证 facets 遍历顺序稳定（对象键序在 JSON 序列化后仍可控） */
export const FACET_KEYS: FacetKey[] = [
  "altnames",
  "entries",
  "offices",
  "sources",
  "relations",
  "texts",
];

// ============ 分面数据视图 ============

export interface AltnameEntry {
  name: string;
  type: string;
}
export interface EntryRecordView {
  entry: string;
  year: number;
  rank: string;
}
export interface OfficeTenure {
  office: string;
  firstYear: number;
  lastYear: number;
  appt: string;
}
export interface WorkRecord {
  title: string;
  role: string;
  year: number;
}
export interface KinLink {
  id: number;
  name: string;
  rel: string;
}
export interface AssocLink {
  id: number;
  name: string;
  rel: string;
  year: number;
}

// ============ 档案主体 ============

export interface CharacterIdentity {
  id: number;
  name: string; // CBDB 原名（多为繁体）
  nameSimplified: string; // toSimplified(name)，供简体检索/展示
  pinyin: string;
  gender: "male" | "female" | "unknown";
  dynasty: string;
  indexYear: number | null;
}

export interface CharacterLife {
  birthYear: number | null;
  deathYear: number | null;
  lifespan: number | null; // deathYear - birthYear；任一端缺失为 null
}

export interface ProfileSourceRef {
  name: string;
  url: string;
  releaseDate: string;
  license: string;
}

export interface CharacterProfile {
  id: number;
  identity: CharacterIdentity;
  life: CharacterLife;
  nativePlace: string;
  altnames: AltnameEntry[];
  entries: EntryRecordView[];
  offices: OfficeTenure[];
  texts: WorkRecord[];
  kin: KinLink[];
  assoc: AssocLink[];
  sources: string[];
  facets: FacetMap;
  source: ProfileSourceRef | null;
  generatedAt: string;
}

export interface CharacterProfileInput {
  person: CbdbPerson;
  source?: ProfileSourceRef | null;
  altnames?: AltnameEntry[] | null;
  entries?: EntryRecordView[] | null;
  offices?: OfficeTenure[] | null;
  texts?: WorkRecord[] | null;
  kin?: KinLink[] | null;
  assoc?: AssocLink[] | null;
  sources?: string[] | null;
}

/**
 * CBDB 固定出处引用。
 * 抽成常量是为了让 fromLegacyCharacter、loadCharacterProfile 与 UI 兜底共用一个出处，
 * 避免同一个版权串在三处各写一遍导致不一致。
 */
export const CBDB_SOURCE_REF: ProfileSourceRef = {
  name: "CBDB 中国历代人物传记资料库",
  url: "https://projects.iq.harvard.edu/cbdb",
  releaseDate: "",
  license: "CC BY-NC-SA 4.0",
};

/** CBDB 用 0 表示年份缺失，统一转成 null（0 年是合法但无意义的历史年份） */
function normYear(year: number): number | null {
  if (!Number.isFinite(year)) return null;
  return year === 0 ? null : year;
}

/** 数组分面：undefined=未加载(error)，[]/null=已加载但为空(empty)，非空=ok */
function statusOf(arr: unknown[] | null | undefined): FacetStatus {
  if (arr === undefined) return "error";
  return arr && arr.length > 0 ? "ok" : "empty";
}

/**
 * relations 由 kin/assoc 两项共同决定：
 * 两者都没取到（undefined）才算加载失败，任一有数据即视为 ok。
 */
function relationStatus(
  kin: KinLink[] | null | undefined,
  assoc: AssocLink[] | null | undefined
): FacetStatus {
  if (kin === undefined && assoc === undefined) return "error";
  const kinCount = kin ? kin.length : 0;
  const assocCount = assoc ? assoc.length : 0;
  return kinCount + assocCount > 0 ? "ok" : "empty";
}

/**
 * 元组 → 结构化档案（纯函数、同步、无 fetch）。
 * 分面数组传 undefined 表示该分面未加载（状态 error），null/空数组表示已加载但为空。
 */
export function buildCharacterProfile(input: CharacterProfileInput): CharacterProfile {
  const person = input.person;
  const id = person[0];
  const rawName = person[1] ?? "";
  const pinyin = person[2] ?? "";
  const birthYear = normYear(person[3]);
  const deathYear = normYear(person[4]);
  const indexYear = normYear(person[5]);
  const genderBit = person[6];
  const dynasty = person[7] ?? "";
  const nativePlace = person[8] ?? "";

  const name = rawName.trim();
  const altnames = input.altnames ?? [];
  const entries = input.entries ?? [];
  const offices = input.offices ?? [];
  const texts = input.texts ?? [];
  const kin = input.kin ?? [];
  const assoc = input.assoc ?? [];
  const sources = input.sources ?? [];

  const facets = {} as FacetMap;
  facets.altnames = { key: "altnames", status: statusOf(input.altnames) };
  facets.entries = { key: "entries", status: statusOf(input.entries) };
  facets.offices = { key: "offices", status: statusOf(input.offices) };
  facets.sources = { key: "sources", status: statusOf(input.sources) };
  facets.relations = { key: "relations", status: relationStatus(input.kin, input.assoc) };
  facets.texts = { key: "texts", status: statusOf(input.texts) };

  return {
    id,
    identity: {
      id,
      name,
      nameSimplified: toSimplified(name),
      pinyin,
      gender: genderBit === 1 ? "female" : "male",
      dynasty,
      indexYear,
    },
    life: {
      birthYear,
      deathYear,
      lifespan: birthYear !== null && deathYear !== null ? deathYear - birthYear : null,
    },
    nativePlace,
    altnames,
    entries,
    offices,
    texts,
    kin,
    assoc,
    sources,
    facets,
    source: input.source ?? null,
    generatedAt: new Date().toISOString(),
  };
}

/** 把 Promise.allSettled 的 rejected 原因收敛成可展示的中文短句 */
function reasonMessage(reason: unknown): string {
  if (reason instanceof Error && reason.message) return reason.message;
  if (typeof reason === "string" && reason) return reason;
  return "未知错误";
}

/** 取数失败的分面补记具体错误原因（buildCharacterProfile 无从得知，只能事后回填） */
function attachFacetErrors(
  profile: CharacterProfile,
  errors: Partial<Record<FacetKey, string>>
): CharacterProfile {
  const facets = {} as FacetMap;
  for (const key of FACET_KEYS) {
    const state = profile.facets[key];
    facets[key] = errors[key] ? { ...state, error: errors[key] } : state;
  }
  return { ...profile, facets };
}

/**
 * 编排层：加载某人完整档案。
 * 六个分面并发取数，任一分面 reject 只把对应 facet 置 error 并记录原因，
 * 不阻断整体——CBDB 分片索引可能部分缺失，宁可展示残缺档案也不要整页报错。
 */
export async function loadCharacterProfile(id: number): Promise<CharacterProfile> {
  const [person, meta] = await Promise.all([
    findPersonById(id),
    loadCbdbMeta().catch(() => null),
  ]);
  if (!person) throw new Error(`未找到 CBDB ID ${id} 对应的人物`);

  const source: ProfileSourceRef | null = meta
    ? {
        name: meta.source?.name || CBDB_SOURCE_REF.name,
        url: meta.source?.url || CBDB_SOURCE_REF.url,
        releaseDate: meta.source?.release_date || "",
        license: meta.source?.license || CBDB_SOURCE_REF.license,
      }
    : null;

  const [altRes, entryRes, officeRes, srcRes, textRes, relRes] = await Promise.allSettled([
    getPersonAltnames(id),
    getPersonEntries(id),
    getPersonOffices(id),
    getPersonSources(id),
    getPersonTexts(id),
    // 关系族：人名映射只用于装饰，它失败不该连坐 relations 分面
    (async () => {
      const [rel, names] = await Promise.all([
        getPersonRelations(id),
        loadRelNames().catch(() => new Map<number, string>()),
      ]);
      const kin: KinLink[] = rel.kin.map((k) => ({
        id: k.id,
        name: names.get(k.id) || `人物 ${k.id}`,
        rel: k.rel,
      }));
      const assoc: AssocLink[] = rel.assoc.map((a) => ({
        id: a.id,
        name: names.get(a.id) || `人物 ${a.id}`,
        rel: a.rel,
        year: a.year,
      }));
      return { kin, assoc };
    })(),
  ]);

  const errors: Partial<Record<FacetKey, string>> = {};
  if (altRes.status === "rejected") errors.altnames = reasonMessage(altRes.reason);
  if (entryRes.status === "rejected") errors.entries = reasonMessage(entryRes.reason);
  if (officeRes.status === "rejected") errors.offices = reasonMessage(officeRes.reason);
  if (srcRes.status === "rejected") errors.sources = reasonMessage(srcRes.reason);
  if (textRes.status === "rejected") errors.texts = reasonMessage(textRes.reason);
  if (relRes.status === "rejected") errors.relations = reasonMessage(relRes.reason);

  const rel = relRes.status === "fulfilled" ? relRes.value : null;

  const profile = buildCharacterProfile({
    person,
    source,
    altnames: altRes.status === "fulfilled" ? altRes.value : undefined,
    entries: entryRes.status === "fulfilled" ? entryRes.value : undefined,
    offices: officeRes.status === "fulfilled" ? officeRes.value : undefined,
    sources: srcRes.status === "fulfilled" ? srcRes.value : undefined,
    texts: textRes.status === "fulfilled" ? textRes.value : undefined,
    // 关系族整族失败时两项都传 undefined，facet 才会落到 error
    kin: rel ? rel.kin : undefined,
    assoc: rel ? rel.assoc : undefined,
  });

  return attachFacetErrors(profile, errors);
}

/** 遗留种子数据里的年份串："-135" / "前551" / "" 都可能出现，统一成数字或 null */
function parseLegacyYear(raw: string): number | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  // "前551" 这类中文公元前写法在早期种子数据里出现过，负号写法是后来的规范
  const bc = /^前\s*(\d+)$/.exec(s);
  if (bc) return -Number(bc[1]);
  const n = Number(s);
  if (!Number.isFinite(n) || n === 0) return null;
  return n;
}

/**
 * 遗留 Character（public/index/characters.json，28 位精选人物）→ CharacterProfile。
 * CBDB 索引不可用时前端可降级展示这批档案，因此这里刻意不抛错、不 fetch。
 * 遗留数据没有的分面（科举/史料/关系）一律记为"已加载但为空"而非"加载失败"，
 * 以免降级视图被校验层误报成数据损坏。
 */
export function fromLegacyCharacter(c: Character): CharacterProfile {
  const m = /(\d+)/.exec(c.id ?? "");
  const id = m ? Number(m[1]) : 0;
  const name = (c.name ?? "").trim();
  const birthYear = parseLegacyYear(c.birth);
  const deathYear = parseLegacyYear(c.death);

  const altnames: AltnameEntry[] = [];
  if ((c.zi ?? "").trim()) altnames.push({ name: c.zi.trim(), type: "字" });
  if ((c.alias ?? "").trim()) altnames.push({ name: c.alias.trim(), type: "號" });

  const offices: OfficeTenure[] = (c.office ?? "").trim()
    ? [{ office: c.office.trim(), firstYear: 0, lastYear: 0, appt: "" }]
    : [];
  const texts: WorkRecord[] = (c.books ?? []).map((t) => ({ title: t, role: "", year: 0 }));

  const profile = buildCharacterProfile({
    person: [
      id,
      name,
      "", // 遗留数据无拼音
      birthYear ?? 0,
      deathYear ?? 0,
      0, // 遗留数据无指数年（0 会被 normYear 折成 null）
      0,
      (c.dynasty ?? "").trim(),
      (c.native ?? "").trim(),
    ],
    source: CBDB_SOURCE_REF,
    altnames,
    entries: [],
    offices,
    texts,
    kin: [],
    assoc: [],
    sources: [],
  });

  // 遗留数据没有性别字段，不能沿用元组默认值（0→male）误导读者
  return { ...profile, identity: { ...profile.identity, gender: "unknown" as const } };
}

// ============ 重名消歧 ============

export interface CandidateHit {
  id: number;
  name: string;
  matched: "name" | "alias";
  alias?: string;
  dynasty?: string;
  indexYear?: number | null;
  nativePlace?: string;
}

export interface Distinguisher {
  field: "dynasty" | "indexYear" | "nativePlace";
  label: string;
  sample: string[];
}

/** 指数年按 50 年分桶：相邻几年的差异不构成有效区分，只有跨代才算 */
function yearBucket(year: number): number {
  return Math.floor(year / 50) * 50;
}

function distinctNonEmpty(values: (string | undefined | null)[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    const s = (v ?? "").trim();
    if (!s) continue; // 空值不参与"取值多样性"判断，避免"有/无"造成伪区分
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

/**
 * 为一组重名候选挑出具备区分能力的字段。
 * 判定标准：该字段在候选集中出现 ≥2 种不同取值（缺失值不计入，
 * 否则"一个人有朝代、另一个没有"会被误判为可区分）。
 * 候选少于 2 条时无需消歧，直接返回空数组。
 */
export function pickDistinguishers(hits: CandidateHit[]): Distinguisher[] {
  if (!hits || hits.length < 2) return [];
  const out: Distinguisher[] = [];

  const dynasties = distinctNonEmpty(hits.map((h) => h.dynasty));
  if (dynasties.length > 1) {
    out.push({ field: "dynasty", label: "朝代", sample: dynasties.slice(0, 3) });
  }

  const years = hits
    .map((h) => (typeof h.indexYear === "number" && Number.isFinite(h.indexYear) && h.indexYear !== 0 ? h.indexYear : null))
    .filter((y): y is number => y !== null);
  const buckets: number[] = [];
  for (const y of years) {
    const b = yearBucket(y);
    if (!buckets.includes(b)) buckets.push(b);
  }
  if (buckets.length > 1) {
    out.push({
      field: "indexYear",
      label: "活跃年代",
      sample: buckets
        .slice(0, 3)
        .sort((a, b) => a - b)
        .map((b) => `${b}–${b + 49}`),
    });
  }

  const places = distinctNonEmpty(hits.map((h) => h.nativePlace));
  if (places.length > 1) {
    out.push({ field: "nativePlace", label: "籍贯", sample: places.slice(0, 3) });
  }

  return out;
}
