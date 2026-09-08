// components/RandomBook.tsx v1.4.0
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SampleBook {
  id: string;
  title: string;
  category: string;
}

/**
 * 首页「随机一书」趣味模块。
 * 从预生成的轻量样本（public/index/book-samples.json）中随机取一部，
 * 避免加载 11MB 全量书目索引。点击「换一本」可重新抽取（不重复上一条）。
 */
export default function RandomBook() {
  const [books, setBooks] = useState<SampleBook[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/index/book-samples.json")
      .then((r) => r.json())
      .then((d: { books: SampleBook[] }) => {
        if (!alive) return;
        const arr = d.books || [];
        setBooks(arr);
        setIdx(arr.length ? Math.floor(Math.random() * arr.length) : 0);
      })
      .catch(() => alive && setBooks([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const pick = () => {
    if (books.length <= 1) return;
    let n = idx;
    while (n === idx) n = Math.floor(Math.random() * books.length);
    setIdx(n);
  };

  const book = books[idx];

  return (
    <div className="card random-card" id="random-book">
      <div className="rc-head">
        <span className="rc-emoji">📖</span>
        <span>随机一书</span>
      </div>
      {loading ? (
        <div className="rc-loading">正在翻阅卷库…</div>
      ) : book ? (
        <>
          <Link href={`/read/remote?id=${encodeURIComponent(book.id)}`} className="rc-title">
            {book.title}
          </Link>
          <div className="rc-meta">
            <span className="tag">{book.category}</span>
          </div>
          <div className="rc-actions">
            <Link href={`/read/remote?id=${encodeURIComponent(book.id)}`} className="btn btn-primary btn-sm">
              去阅读
            </Link>
            <button id="random-book-refresh" className="btn btn-secondary btn-sm" onClick={pick}>
              🎲 换一本
            </button>
          </div>
        </>
      ) : (
        <div className="rc-loading">暂无书目数据</div>
      )}
    </div>
  );
}
