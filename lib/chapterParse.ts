/**
 * 章节解析（纯函数，客户端与构建脚本共用）
 * - CHAPTER_PATTERNS / NON_CHAPTER_KEYWORDS / isChapterTitle：章节标题识别
 * - parseChapters：将整本 TXT 解析为章节数组（客户端无清单时的回退路径）
 * - chapterBoundaries：返回各章节在原文中的字符区间（构建脚本据其换算字节偏移，
 *   生成 public/index/chapters/<id>.json 供阅读页做 Range 分片懒加载）
 */

/** 章节标题识别：卷X / 第X回 / 第X章 / 篇X / 学而第一 / 序品第一 / 寿量品第二 等短行 */
export const CHAPTER_PATTERNS = [
  /^卷[之其]?[一二三四五六七八九十百千零\d]+/,
  /^第[一二三四五六七八九十百千零\d]+[回卷章节篇折品]/,
  // 天干编号：要求天干后必须有数字或"集/部/篇/卷/之"，避免单独"甲"字误匹配
  /^[甲乙丙丁戊己庚辛壬癸][之]?[一二三四五六七八九十百千零\d]+/,
  /^[甲乙丙丁戊己庚辛壬癸][集部篇卷]/,
  // 品第X / XX品第X（佛经、子书常见，如 序品第一、寿量品第二、忏悔品第三）
  /^[^\s　]*品[之第]?[一二三四五六七八九十百千零\d]+/,
];

// 正文中可能出现但不是章节标题的引用词（移除过于宽泛的"如""见"）
export const NON_CHAPTER_KEYWORDS = ["参阅", "参考", "参见", "详见", "另见", "又见", "语见", "出自"];

export function isChapterTitle(line: string, prevLine?: string, nextLine?: string): boolean {
  const t = line.trim();
  // 长度限制：2-20 字
  if (!t || t.length < 2 || t.length > 20) return false;
  // 不以缩进开头（正文通常缩进）
  if (line.startsWith("　") || line.startsWith(" ")) return false;
  // 排除含正文引用关键词的行
  if (NON_CHAPTER_KEYWORDS.some((k) => t.includes(k))) return false;
  // 排除含标点的行（章节标题通常无标点）
  if (/[，。！？；：、""''（）【】]/.test(t)) return false;

  const matched = CHAPTER_PATTERNS.some((p) => p.test(t));
  if (!matched) return false;

  // 上下文校验：标题后应为缩进正文或空行；或上一行为空行。
  // 古籍常见「标题行 / 缩进正文」无空行分隔，故以「下一行缩进或空行 / 上一行空行」判定，
  // 避免要求两侧空行导致漏检（如 序品第一 紧跟缩进正文）。
  const nextIndented = nextLine != null && (nextLine.startsWith("　") || nextLine.startsWith(" "));
  const nextEmpty = !nextLine || !nextLine.trim();
  const prevEmpty = !prevLine || !prevLine.trim();
  if (!nextIndented && !nextEmpty && !prevEmpty) return false;

  return true;
}

/** 解析 TXT 为章节数组 */
export function parseChapters(
  text: string,
  bookTitle: string
): { title: string; paragraphs: string[] }[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const chapters: { title: string; paragraphs: string[] }[] = [];
  let current: { title: string; paragraphs: string[] } | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (current && buf.length > 0) {
      current.paragraphs.push(...buf.filter((p) => p.trim()));
      buf = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : undefined;
    const nextLine = i < lines.length - 1 ? lines[i + 1] : undefined;
    if (isChapterTitle(line, prevLine, nextLine)) {
      flush();
      if (current) chapters.push(current);
      current = { title: line.trim(), paragraphs: [] };
    } else {
      const trimmed = line.trim();
      if (trimmed) buf.push(trimmed);
    }
  }
  flush();
  if (current) chapters.push(current);

  // 无法识别章节时，整书作为一章
  if (chapters.length === 0) {
    return [{ title: bookTitle, paragraphs: lines.map((l) => l.trim()).filter(Boolean) }];
  }
  // 过滤掉只有标题无正文的空章节
  return chapters.filter((c) => c.paragraphs.length > 0);
}

export interface ChapterBoundary {
  title: string;
  charStart: number;
  charEnd: number;
}

/**
 * 计算各章节在原文中的字符区间（[charStart, charEnd)，基于原始文本字符偏移）。
 * 构建脚本据其结合 Buffer.byteLength 换算为 UTF-8 字节偏移，
 * 生成 chapter 清单供阅读页 Range 分片加载。
 * 注意：直接使用原始文本（含 \r\n）计算偏移，保证与 CDN 返回的字节区间一致。
 */
export function chapterBoundaries(text: string): ChapterBoundary[] {
  const lines = text.split("\n"); // 保留 \r，使字符偏移与原始文本对齐
  const bounds: ChapterBoundary[] = [];
  let pendingStart: number | null = null;
  let pendingTitle = "";
  let charPos = 0; // 当前行首在原始文本中的字符偏移

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = charPos;
    const prevLine = i > 0 ? lines[i - 1] : undefined;
    const nextLine = i < lines.length - 1 ? lines[i + 1] : undefined;
    if (isChapterTitle(line, prevLine, nextLine)) {
      if (pendingStart !== null) {
        bounds.push({ title: pendingTitle, charStart: pendingStart, charEnd: lineStart });
      }
      pendingStart = lineStart;
      pendingTitle = line.trim();
    }
    charPos += line.length + 1; // +1 为被 split 丢弃的 \n
  }
  if (pendingStart !== null) {
    bounds.push({ title: pendingTitle, charStart: pendingStart, charEnd: charPos });
  }
  return bounds;
}

/** 将单章文本切分为非空段落（用于分页展示） */
export function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
