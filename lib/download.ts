/**
 * 合规下载工具（PRD §4.7 资源下载模块）
 * - 单章节/单本/单馆藏三级粒度
 * - 全部下载入口附带开源协议与非商用免责声明（downloadNotice）
 * - 文本按当前繁简模式导出
 */

/** 下载免责声明（所有下载入口统一挂载） */
export const DOWNLOAD_NOTICE =
  "本资源仅供学术研究与个人学习使用，禁止商用、二次售卖或篡改后伪造成原创资料库。古籍原文版权归原始数据源所有，请遵守上游开源协议。";

/** 触发下载前展示免责确认，返回是否继续 */
export function confirmDownload(): boolean {
  try {
    return window.confirm(DOWNLOAD_NOTICE + "\n\n是否继续下载？");
  } catch {
    return true; // 无 window 环境（SSG 构建）不拦截
  }
}

/** 净化文件名：去除路径分隔符、控制字符与首尾空白点，避免路径穿越与非法文件名 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 200) || "download";
}

/** 生成 TXT 文件并触发浏览器下载（UTF-8 BOM，保证 Windows 记事本正确识别） */
export function downloadText(filename: string, text: string): void {
  const safeName = sanitizeFilename(filename);
  const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 组装书籍整本 TXT 内容（书名 + 逐章正文） */
export function buildBookTxt(
  bookTitle: string,
  bookMeta: string,
  chapters: { title: string; text: string }[]
): string {
  const head = `${bookTitle}\n${bookMeta}\n${"=".repeat(30)}\n\n`;
  const body = chapters
    .map((c) => `【${c.title}】\n\n${c.text}\n\n`)
    .join("");
  return head + body + `\n${DOWNLOAD_NOTICE}\n`;
}

/** 组装馆藏批量 TXT（多本书） */
export function buildCategoryTxt(
  categoryName: string,
  books: { title: string; meta: string; body: string }[]
): string {
  const head = `${categoryName}·馆藏合集\n（古籍通 AncientBook 演示预览版导出）\n${"=".repeat(30)}\n\n`;
  return (
    head +
    books.map((b) => `# ${b.title}\n${b.meta}\n\n${b.body}\n`).join("") +
    `\n${DOWNLOAD_NOTICE}\n`
  );
}

/** 书单导出行（仅元数据与原文直链，不含正文，符合零复制架构） */
export interface BooklistRow {
  title: string;
  category: string;
  subcategories: string[];
  size: number;
  rawUrl: string;
  mirrors: string[];
}

/** 将书单导出为 CSV（UTF-8 BOM，Excel 友好），含书名/馆藏/子类/大小/原文直链/镜像直链 */
export function exportBooklistCsv(rows: BooklistRow[], filename: string): void {
  const csvCell = (s: string): string => {
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = ["书名", "馆藏", "子类", "大小(B)", "原文直链", "镜像直链"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const cells = [
      r.title,
      r.category,
      r.subcategories.join("/"),
      String(r.size),
      r.rawUrl,
      (r.mirrors || []).join(" "),
    ].map(csvCell);
    lines.push(cells.join(","));
  }
  downloadText(filename, lines.join("\n"));
}
