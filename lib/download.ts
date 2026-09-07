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

/** 生成 TXT 文件并触发浏览器下载（UTF-8 BOM，保证 Windows 记事本正确识别） */
export function downloadText(filename: string, text: string): void {
  const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
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
