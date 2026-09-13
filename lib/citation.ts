// lib/citation.ts v1.15.0
/** 学术引用格式与剪贴板工具（纯静态、无后端） */

export interface CitationParts {
  bookTitle: string;
  chapterTitle?: string;
  text: string;
}

/** 生成规范引用文本：《书名·章节》：原文 */
export function formatCitation({ bookTitle, chapterTitle, text }: CitationParts): string {
  const loc = chapterTitle ? `${bookTitle}·${chapterTitle}` : bookTitle;
  return `《${loc}》：${text.trim()}`;
}

/** 复制文本到剪贴板（优先 Clipboard API，降级 execCommand），返回是否成功 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* 降级到 execCommand */ }
  try {
    if (typeof document === "undefined") return false;
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
