// components/reader/download.ts v1.15.8
import { toSimplified } from "@/lib/t2s";
import { downloadText, confirmDownload } from "@/lib/download";
import type { CatalogEntry } from "@/lib/catalog";
import { LARGE_FILE_THRESHOLD, safeHttpUrl } from "./constants";

/**
 * 下载当前书正文：
 * 分片模式或大文件（>5MB）引导至上游原文另存为（避免浏览器内拼接超大文本），
 * 其余在浏览器内生成 txt（繁体原版 / 简体对照版）。
 */
export function downloadBookText(
  book: CatalogEntry,
  content: string | null,
  simple: boolean,
  usingManifest: boolean
): void {
  if (usingManifest) {
    const u = safeHttpUrl(book.rawUrl);
    if (u) window.open(u, "_blank", "noopener");
    return;
  }
  if (!content) return;
  if (book.size > LARGE_FILE_THRESHOLD) {
    const u = safeHttpUrl(book.rawUrl);
    if (u) window.open(u, "_blank", "noopener");
    return;
  }
  if (!confirmDownload()) return;
  const modeText = simple ? "简体对照版" : "繁体原版";
  const body = simple ? toSimplified(content) : content;
  downloadText(`${book.title}_${modeText}.txt`, body);
}
