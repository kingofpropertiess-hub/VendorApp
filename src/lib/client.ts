/**
 * Thin fetch wrapper — Bearer auth, timeout, one automatic retry on
 * network-class failures, global 401 handling.
 *
 * Mirrors the Client App's client.ts so behaviour stays identical across
 * the platform, while holding an independent session.
 */

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "./config";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  isNetwork: boolean;

  constructor(
    message: string,
    options: { status?: number; data?: unknown; isNetwork?: boolean } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.data = options.data;
    this.isNetwork = options.isNetwork ?? false;
  }
}

type TokenProvider = () => Promise<string | null>;
type UnauthorizedHandler = () => void;

let tokenProvider: TokenProvider = async () => null;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setTokenProvider(fn: TokenProvider) {
  tokenProvider = fn;
}

export function setUnauthorizedHandler(fn: UnauthorizedHandler) {
  onUnauthorized = fn;
}

function errorMessageFromBody(body: any): string {
  if (!body) return "Something went wrong.";
  return (
    body.message ||
    body.error ||
    (typeof body === "string" ? body : "") ||
    "Something went wrong."
  );
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) return err.isNetwork;
  const raw = String((err as any)?.message ?? err ?? "");
  return (
    /network/i.test(raw) ||
    /timeout/i.test(raw) ||
    /aborted/i.test(raw) ||
    /failed to fetch/i.test(raw) ||
    /connection/i.test(raw)
  );
}

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  timeoutMs?: number;
  auth?: boolean;
  skipGuard?: boolean;
  headers?: Record<string, string>;
}

let inFlight401: boolean = false;

async function request<T>(
  path: string,
  options: RequestOptions = {},
  retry: boolean = true,
): Promise<T> {
  const method = options.method ?? "GET";
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (options.auth !== false) {
    const token = await tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let body: FormData | string | undefined;
  if (options.body instanceof FormData) {
    body = options.body; // let RN set the multipart boundary
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include",
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (retry && isNetworkError(err)) {
      await new Promise((res) => setTimeout(res, 1200));
      return request<T>(path, options, false);
    }
    throw new ApiError(
      "No connection to the King of Properties servers. Please check your internet and try again.",
      { isNetwork: true },
    );
  }
  clearTimeout(timer);

  let data: any = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message = errorMessageFromBody(data);
    if (response.status === 401 && !options.skipGuard) {
      if (!inFlight401 && onUnauthorized) {
        inFlight401 = true;
        setTimeout(() => {
          inFlight401 = false;
          onUnauthorized?.();
        }, 0);
      }
    }
    throw new ApiError(message, { status: response.status, data });
  }

  return (data as T) ?? ({} as T);
}

export const client = {
  get<T = any>(path: string, options?: Omit<RequestOptions, "method">) {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T = any>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "POST", body });
  },
  put<T = any>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "PUT", body });
  },
  patch<T = any>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "PATCH", body });
  },
  del<T = any>(path: string, options?: Omit<RequestOptions, "method">) {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};

export const BASE = API_BASE_URL;
export const API_URL = API_BASE_URL;
