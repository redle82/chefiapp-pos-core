export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function fetchJson(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  const base = typeof baseUrl === "string" ? baseUrl.trim() : "";
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${base.replace(/\/$/, "")}${p}`;
  const res = await fetch(url, init);
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const bodyObj =
      body && typeof body === "object"
        ? (body as Record<string, unknown>)
        : null;
    const rawMsg =
      bodyObj && (bodyObj.message != null || bodyObj.error != null)
        ? bodyObj.message ?? bodyObj.error
        : null;
    const msg = rawMsg != null ? String(rawMsg) : `HTTP_${res.status}`;
    throw new ApiError(msg, res.status, body);
  }
  return body;
}

export function internalHeaders(token: string): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) h["X-Internal-Token"] = token;
  return h;
}
