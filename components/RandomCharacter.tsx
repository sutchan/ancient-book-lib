// components/RandomCharacter.tsx v1.4.3
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Character } from "@/lib/types";

/**
 * 首页「随机一人」趣味模块。
 * 从 public/index/characters.json（CBDB 导入的 28 位历史名人）中随机取一位，
 * 点击「换一位」可重新抽取（不重复上一条）。跳转至人物考据页对应锚点。
 */
export default function RandomCharacter() {
  const [chars, setChars] = useState<Character[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/index/characters.json")
      .then((r) => r.json())
      .then((arr: Character[]) => {
        if (!alive) return;
        setChars(arr);
        setIdx(arr.length ? Math.floor(Math.random() * arr.length) : 0);
      })
      .catch(() => alive && setChars([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const pick = () => {
    if (chars.length <= 1) return;
    let n = idx;
    while (n === idx) n = Math.floor(Math.random() * chars.length);
    setIdx(n);
  };

  const c = chars[idx];

  return (
    <div className="card random-card" id="random-character">
      <div className="rc-head">
        <span className="rc-emoji">👤</span>
        <span>随机一人</span>
      </div>
      {loading ? (
        <div className="rc-loading">正在翻阅人物志…</div>
      ) : c ? (
        <>
          {/* key 随抽取变化，重放入场轻弹动画（愉悦体验层 #6） */}
          <div className="rc-swap" key={idx}>
            <Link href={`/character#character-${c.id}`} className="rc-title">
              {c.name}
              {c.zi && <span className="rc-zi">（字 {c.zi}）</span>}
            </Link>
            <div className="rc-meta">
              {c.dynasty && <span className="tag">{c.dynasty}</span>}
              {c.books?.length > 0 && <span className="tag">{c.books.length} 部著述</span>}
            </div>
          </div>
          <div className="rc-actions">
            <Link href={`/character#character-${c.id}`} className="btn btn-primary btn-sm">
              看考据
            </Link>
            <button id="random-character-refresh" className="btn btn-secondary btn-sm" onClick={pick}>
              🎲 换一位
            </button>
          </div>
        </>
      ) : (
        <div className="rc-loading">暂无人物数据</div>
      )}
    </div>
  );
}
