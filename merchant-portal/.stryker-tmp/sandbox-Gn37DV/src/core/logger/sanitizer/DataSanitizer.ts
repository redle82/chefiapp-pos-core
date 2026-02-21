/**
 * Sanitiza dados antes de enviar para transports (evitar PII em logs).
 */
export function sanitize<T extends Record<string, unknown>>(obj: T): T {
  if (obj == null || typeof obj !== "object") return obj;
  const out = { ...obj } as T;
  for (const key of Object.keys(out)) {
    if (key.toLowerCase().includes("password") || key.toLowerCase().includes("token")) {
      (out as Record<string, unknown>)[key] = "[REDACTED]";
    }
  }
  return out;
}
