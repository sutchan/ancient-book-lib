// app/error.tsx v1.15.7
"use client";

import { useEffect } from "react";
import ErrorBlock from "@/components/ErrorBlock";

/**
 * 路由级错误边界（App Router）。任一页面渲染/数据加载抛错时，
 * 不再白屏整站，而是展示可重试的提示，并保留导航以便用户脱困。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route-error]", error);
  }, [error]);

  return (
    <main className="main-content" id="app-error-boundary" style={{ padding: 40, maxWidth: 720, margin: "0 auto" }}>
      <div className="card" style={{ padding: 24 }}>
        <ErrorBlock
          title="页面出错了"
          message="阅读或检索过程中出现了意外错误。可尝试重新加载，或返回首页继续浏览。"
          errorRef={error?.digest}
          onRetry={reset}
        />
      </div>
    </main>
  );
}
