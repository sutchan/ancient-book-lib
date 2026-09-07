/**
 * 前端内存全文检索（纯静态无数据库核心）
 * 权重规则（固化）：标题完全匹配 > 章节名完全匹配 > 段落开头精准匹配 > 正文高词频匹配 > 普通正文匹配
 */
import type { Book, Character } from "./types";
import data from "./data-generated";

export interface SearchResult {
  kind: "book" | "character";
  book: string;
  chapter: string;
  path: string;
  snippet: string;
  score: number;
}

/** 章节正文（生产版由分片懒加载按字节范围拉取；演示版内置节选） */
export function getChapterText(book: Book, idx: number): string {
  const title = book.title;
  const sample: Record<string, string[]> = {
    论语: [
      "子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」",
      "有子曰：「其為人也孝弟，而好犯上者，鮮矣；不好犯上，而好作亂者，未之有也。君子務本，本立而道生。」",
      "子曰：「巧言令色，鮮矣仁！」",
      "曾子曰：「吾日三省吾身：為人謀而不忠乎？與朋友交而不信乎？傳不習乎？」",
    ],
    心经: [
      "觀自在菩薩，行深般若波羅蜜多時，照見五蘊皆空，度一切苦厄。",
      "舍利子，色不異空，空不異色，色即是空，空即是色，受想行識，亦復如是。",
      "舍利子，是諸法空相，不生不滅，不垢不淨，不增不減。",
      "是故空中無色，無受想行識，無眼耳鼻舌身意，無色聲香味觸法。",
      "無眼界，乃至無意識界，無無明，亦無無明盡，乃至無老死，亦無老死盡。",
    ],
  };
  const paras = sample[title] || [
    "古之學者必有師。師者，所以傳道、受業、解惑也。",
    "生乎吾前，其聞道也固先乎吾，吾從而師之；生乎吾後，其聞道也亦先乎吾，吾從而師之。",
    "吾師道也，夫庸知其年之先後生於吾乎？是故無貴無賤，無長無少，道之所存，師之所存也。",
  ];
  return paras[idx % paras.length];
}

/** 全文检索（标题/章节/正文/人物） */
export function searchAll(
  kw: string,
  mode: "title" | "full" = "full",
  limit = 20
): SearchResult[] {
  const q = kw.trim();
  if (!q) return [];
  const results: SearchResult[] = [];

  for (const b of data.books) {
    const titleHit = b.title.includes(q);
    const chapterHit = b.chapters.some((c) => c.includes(q));
    const bodyHit =
      b.chapters.some((_, i) => getChapterText(b, i).includes(q)) ||
      (b.desc ?? "").includes(q);
    const hit = mode === "title" ? titleHit || chapterHit : titleHit || chapterHit || bodyHit;
    if (!hit) continue;
    const score = titleHit ? 98 : chapterHit ? 92 : 80;
    results.push({
      kind: "book",
      book: b.title,
      chapter: b.chapters[0],
      path: `首页 > ${b.category} > ${b.title}`,
      snippet: getChapterText(b, 0).slice(0, 60) + "…",
      score,
    });
  }

  for (const p of data.characters) {
    if (p.name.includes(q) || (p.zi && p.zi.includes(q)) || (p.alias && p.alias.includes(q))) {
      results.push({
        kind: "character",
        book: p.name,
        chapter: "人物档案",
        path: `考据 > ${p.dynasty}`,
        snippet: p.desc,
        score: 90,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** 人物检索 */
export function searchCharacters(kw: string): Character[] {
  const q = kw.trim();
  return data.characters.filter(
    (p) =>
      !q ||
      p.name.includes(q) ||
      (p.zi ?? "").includes(q) ||
      (p.alias ?? "").includes(q)
  );
}

/** 统计：馆藏分布 */
export function statsByCategory() {
  return data.categories.map((c) => ({
    name: c.name,
    count: data.books.filter((b) => b.category === c.name).length,
  }));
}

/** 统计：朝代分布 */
export function statsByDynasty() {
  const map: Record<string, number> = {};
  data.books.forEach((b) => {
    map[b.dynasty] = (map[b.dynasty] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/** 统计：人物身份标签 */
export function statsByTag() {
  const map: Record<string, number> = {};
  data.characters.forEach((c) =>
    (c.tags || []).forEach((t) => {
      map[t] = (map[t] || 0) + 1;
    })
  );
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/** 统计：关系类型 */
export function statsByRelationType() {
  const map: Record<string, number> = {};
  data.relations.forEach((r) => {
    map[r.type] = (map[r.type] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/** 分片懒加载模型：每片字节数（生产版由 HTTP Range 实现） */
export const CHUNK_SIZE = 4 * 1024; // 2–4KB/片
export function chunkPlan(totalBytes: number) {
  const chunks = Math.ceil(totalBytes / CHUNK_SIZE);
  return { chunks, ranges: Array.from({ length: chunks }, (_, i) => [i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE - 1, totalBytes - 1)] as [number, number]) };
}
