/**
 * Normalização única de path para o sistema de papéis.
 * Remove query (?x), hash (#x) e trailing slash (exceto "/").
 */
// @ts-nocheck


export function normalizePath(path: string): string {
  if (typeof path !== "string" || path === "") return "/";
  const withoutHash = path.split("#")[0];
  const withoutQuery = withoutHash.split("?")[0];
  const trimmed = withoutQuery.trim();
  const withoutTrailing = trimmed.replace(/\/+$/, "") || "/";
  return withoutTrailing || "/";
}
