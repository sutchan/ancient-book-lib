// app/global-error.tsx v1.15.7
"use client";

/**
 * 全局错误边界：仅在根布局自身崩溃时触发（此时 <html>/<body> 尚未就绪，
 * 必须在此自行提供。无法使用 Navbar/Footer 等依赖布局的组件）。
 */
import ErrorBlock from "@/components/ErrorBlock";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 40, color: "#333" }}>
        <ErrorBlock
          title="应用出错了"
          message="发生了一个严重错误，请刷新页面重试。"
          errorRef={error?.digest}
          onRetry={reset}
          showHome={false}
        />
      </body>
    </html>
  );
}
