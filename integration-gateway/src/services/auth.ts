export type HeaderValue = string | string[] | undefined;

function firstHeaderValue(value: HeaderValue): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }
  return typeof value === "string" ? value : null;
}

/**
 * Supports both modern bearer auth and legacy x-internal-token for
 * compatibility during MRP-001 gateway authority migration.
 */
export function extractInternalToken(
  headers: Record<string, HeaderValue>,
): string | null {
  const authorization = firstHeaderValue(headers.authorization)?.trim();
  if (authorization && /^Bearer\s+/i.test(authorization)) {
    return authorization.replace(/^Bearer\s+/i, "").trim() || null;
  }

  const legacyToken = firstHeaderValue(headers["x-internal-token"]);
  return legacyToken?.trim() || null;
}
