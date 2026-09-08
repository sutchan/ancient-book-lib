/**
 * 带超时的 fetch 封装（AbortController）
 * 用于远程书原文加载等可能耗时的网络请求
 * 支持 HTTP Range 分片（见 range 选项），用于超大书按需加载章节
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number; // 毫秒，默认 30000
  onProgress?: (loaded: number, total: number) => void; // 下载进度回调
  /** HTTP Range 字节区间，如 "0-1023" 或 "1024-"（超大书分片懒加载用） */
  range?: string;
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
  const { timeout = 30000, onProgress, range, ...init } = options;
  const headers: Record<string, string> = {};
  if (init.headers) {
    const h = init.headers;
    if (h instanceof Headers) h.forEach((v, k) => (headers[k] = v));
    else if (Array.isArray(h)) h.forEach(([k, v]) => (headers[k] = v));
    else Object.assign(headers, h);
  }
  if (range) headers["Range"] = `bytes=${range}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(url, { ...init, headers, signal: controller.signal });
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

/** 带超时 + 进度的文本获取（整本下载，小书用） */
export async function fetchTextWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<string> {
  const resp = await fetchWithTimeout(url, options);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  return resp.text();
}

/**
 * 按字节区间分片获取文本（超大书用）。
 * 支持 Range 的 CDN 返回 206 时仅返回区间内容；
 * 不支持 Range 的源返回 200 整文时降级为截取区间（功能可用，但失去分片收益）。
 */
export async function fetchRangeText(
  url: string,
  range: string,
  options: Omit<FetchWithTimeoutOptions, "range"> = {}
): Promise<string> {
  const resp = await fetchWithTimeout(url, { ...options, range });
  if (resp.status !== 206 && resp.status !== 200) {
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  }
  const text = await resp.text();
  if (resp.status === 200) {
    // 源未支持 Range：整文返回，按字节区间截取后返回
    const [startStr, endStr] = range.split("-");
    const start = parseInt(startStr, 10) || 0;
    const end = endStr ? parseInt(endStr, 10) : text.length;
    return text.slice(start, end + 1);
  }
  return text;
}
