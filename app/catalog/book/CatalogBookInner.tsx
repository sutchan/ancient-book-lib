"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadCatalog, findBookById, formatSize, type CatalogEntry } from "@/lib/catalog";
import { fetchTextWithTimeout } from "@/lib/fetchWithTimeout";
import { getCachedBook } from "@/lib/idb";

export default function CatalogBookInner() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  const [book, setBook] = useState<CatalogEntry | null>(null);
  const [chapters, setChapters] = useState<{ title: string; count: number }[] | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadCatalog().then((cat) => {
      const b = findBookById(cat, id);
      setBook(b || null);
      if (!b) setError("未找到该书目");
    }).catch((e) => setError(String(e)));
  }, [id]);

  const loadChapters = useCallback(async () => {
    if (!book || chapters) return;
    setLoadingChapters(true);
    try {
      let text = await getCachedBook(book.id);
      if (!text) {
        const urls = [book.rawUrl, ...(book.mirrors || [])];
        for (const url of urls) {
          try {
            text = await fetchTextWithTimeout(url, { timeout: 30000 });
            break;
          } catch { /* 尝试下一个镜像 */ }
        }
      }
      if (!text) throw new Error("加载失败");
      const lines = text.replace(/\r\n/g, "\n").split("\n");
      const titles: { title: string; count: number }[] = [];
      let currentTitle = "";
      let paraCount = 0;
      for (const line of lines) {
        const t = line.trim();
        if (t && t.length >= 2 && t.length <= 20 && !line.startsWith("　") && !line.startsWith(" ") &&
            (/^卷[之其]?[一二三四五六七八九十百千零\d]+/.test(t) ||
             /^第[一二三四五六七八九十百千零\d]+[回卷章节篇折]/.test(t) ||
             /^[甲乙丙丁戊己庚辛壬癸]/.test(t))) {
          if (currentTitle) titles.push({ title: currentTitle, count: paraCount });
          currentTitle = t;
          paraCount = 0;
        } else if (t) {
          paraCount++;
        }
      }
      if (currentTitle) titles.push({ title: currentTitle, count: paraCount });
      setChapters(titles.length > 0 ? titles : [{ title: book.title, count: lines.filter(l => l.trim()).length }]);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoadingChapters(false);
    }
  }, [book, chapters]);

  if (error) return (
    <section style={{ padding: 40 }}>
      <h3>加载失败</h3>
      <p style={{ color: "#c00" }}>{error}</p>
      <Link href="/catalog" className="btn btn-secondary">返回书目</Link>
    </section>
  );

  if (!book) return <div style={{ padding: 60, textAlign: "center" }}>加载中...</div>;

  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link><span className="sep">/</span>
        <Link href="/catalog">全馆藏</Link><span className="sep">/</span>
        <span>{book.title}</span>
      </div>

      <div className="book-detail">
        <h1 className="book-detail-title">{book.title}</h1>
        <div className="book-detail-meta">
          <span className="tag">{book.category}</span>
          {book.subcategories.map((s, i) => (
            <span key={i} className="tag">{s}</span>
          ))}
          <span className="tag">{formatSize(book.size)}</span>
        </div>
        <p className="book-detail-desc">
          本书来自殆知阁 v20 开源古籍库，原始 TXT 托管于 GitHub。阅读时按需加载原文，自动缓存至本地。
        </p>
        <div className="book-actions">
          <Link href={`/read/remote?id=${book.id}`} className="btn btn-primary">开始阅读</Link>
          <a href={book.rawUrl} target="_blank" rel="noopener" className="btn btn-secondary">上游原文</a>
          {book.mirrors?.[0] && (
            <a href={book.mirrors[0]} target="_blank" rel="noopener" className="btn btn-secondary">CDN 镜像</a>
          )}
          <button className="btn btn-secondary" onClick={loadChapters} disabled={loadingChapters || !!chapters}>
            {loadingChapters ? "加载目录中..." : chapters ? "目录已加载" : "查看目录"}
          </button>
        </div>
      </div>

      {chapters && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12 }}>章节目录（{chapters.length} 章）</h3>
          <div className="chapter-list">
            {chapters.map((c, i) => (
              <Link
                key={i}
                href={`/read/remote?id=${book.id}`}
                className="chapter-item"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span className="chapter-index">{i + 1}</span>
                <span style={{ flex: 1 }}>{c.title}</span>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{c.count} 段</span>
                <span className="chapter-arrow">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
