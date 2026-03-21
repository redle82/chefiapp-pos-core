/**
 * Device detection helper for commercial tracking.
 * Simple UA-based heuristic — no external deps.
 */

export function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (
    /mobile|iphone|ipod|android.*mobile|windows phone|bb10|blackberry/i.test(ua)
  )
    return "mobile";
  return "desktop";
}
