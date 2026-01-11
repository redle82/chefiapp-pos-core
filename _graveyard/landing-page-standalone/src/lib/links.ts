/**
 * Build a URL to the merchant portal.
 * In production, `/app` should be served under the same origin.
 * In development, set `VITE_APP_ORIGIN` (e.g., http://localhost:5174) to route correctly.
 */
export function appLink(path: string = ""): string {
  const origin = (import.meta as any).env?.VITE_APP_ORIGIN as string | undefined;
  const base = origin ? origin.replace(/\/$/, "") + "/app" : "/app";
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${suffix}`;
}
