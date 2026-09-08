/**
 * 带超时的 fetch 封装（AbortController）
 * 用于远程书原文加载等可能耗时的网络请求
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number; // 毫秒，默认 30000
  onProgress?: (loaded: number, total: number) => void; // 下载进度回调
}

export class FetchTimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`请求超时（${timeout}ms）：${url}`);
    this.name = "FetchTimeoutError";
  }
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 30000, onProgress, ...init } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);

    // 如果需要进度，包装 response.body
    if (onProgress && resp.body) {
      const total = parseInt(resp.headers.get("Content-Length") || "0", 10);
      const reader = resp.body.getReader();
      let loaded = 0;
      const stream = new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.byteLength;
            onProgress(loaded, total);
            controller.enqueue(value);
          }
          controller.close();
        },
      });
      return new Response(stream, {
        status: resp.status,
        statusText: resp.statusText,
        headers: resp.headers,
      });
    }

    return resp;
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name === "AbortError") {
      throw new FetchTimeoutError(url, timeout);
    }
    throw e;
  }
}

/** 带超时 + 进度的文本获取 */
export async function fetchTextWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<string> {
  const resp = await fetchWithTimeout(url, options);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  return resp.text();
}
