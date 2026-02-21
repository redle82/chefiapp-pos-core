export type Json = any;

export class ApiError extends Error {
  status: number;
  body: any;

  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function fetchJson(baseUrl: string, path: string, init?: RequestInit): Promise<any> {
  const base = typeof baseUrl === 'string' ? baseUrl.trim() : '';
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = `${base.replace(/\/$/, '')}${p}`;
  const res = await fetch(url, init);
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg = (body && (body.message || body.error)) ? String(body.message || body.error) : `HTTP_${res.status}`;
    throw new ApiError(msg, res.status, body);
  }
  return body;
}

export function internalHeaders(token: string): HeadersInit {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) h['X-Internal-Token'] = token;
  return h;
}
