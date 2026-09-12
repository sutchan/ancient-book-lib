// components/ScrollProgress.tsx v1.4.4
"use client";

import { useEffect, useRef } from "react";

/**
 * 卷首进度：阅读页顶部朱砂细条随滚动生长（愉悦体验层 #7）。
 * 固定定位、pointer-events:none，不占布局；rAF 节流监听 scroll/resize；
 * 无障碍：aria-hidden 纯视觉装饰，reduced-motion 时 CSS 关闭过渡（宽度仍实时更新）。
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const bar = barRef.current;
      const fill = bar?.firstElementChild as HTMLElement | null;
      if (!bar || !fill) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 40 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.width = (p * 100).toFixed(2) + "%";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="scroll-progress" ref={barRef} aria-hidden="true">
      <span className="sp-fill" />
    </div>
  );
}
