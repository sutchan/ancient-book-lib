// components/EasterEgg.tsx v1.4.4
"use client";

import { useEffect } from "react";

const CHARS = ["卷", "册", "簡", "墨", "書", "紙", "硯"];

/**
 * 页脚彩蛋（愉悦体验层 #8）：2 秒内连点页脚统计 5 次 → 篆字飞舞 + 雅句 toast。
 * 交互设计：第 3 次点击给「再点两下」渐进提示；reduced-motion 用户只出 toast 不撒字；
 * toast 走 role=status，对读屏友好。组件自身不渲染任何 DOM，仅做事件委托。
 */
export default function EasterEgg() {
  useEffect(() => {
    let clicks: number[] = [];

    const spawnChar = () => {
      const el = document.createElement("span");
      el.className = "eg-float";
      el.setAttribute("aria-hidden", "true");
      el.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
      el.style.left = 10 + Math.random() * 80 + "vw";
      el.style.fontSize = 16 + Math.random() * 14 + "px";
      el.style.setProperty("--eg-rot", (Math.random() * 60 - 30).toFixed(0) + "deg");
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    };

    const toast = (msg: string) => {
      document.querySelectorAll(".eg-toast").forEach((n) => n.remove());
      const el = document.createElement("div");
      el.className = "eg-toast";
      el.setAttribute("role", "status");
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2900);
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest || !t.closest(".footer-stats")) return;
      const now = Date.now();
      clicks = clicks.filter((c) => now - c < 2000);
      clicks.push(now);
      if (clicks.length < 5) {
        if (clicks.length === 3) toast("再点两下，有惊喜…");
        return;
      }
      clicks = [];
      const reduce =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        for (let i = 0; i < 12; i++) setTimeout(spawnChar, i * 90);
      }
      toast("文脉绵延，与君共读");
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
