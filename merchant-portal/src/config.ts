/**
 * Global Configuration Strategy
 *
 * Centralizes environment variables and defaults.
 * Follows "Fail Loud" for critical missing vars in production.
 *
 * NOTE: Vite uses import.meta.env, NOT process.env
 */

export const CONFIG = {
  // API (Web Module)
  API_BASE: import.meta.env.VITE_API_BASE || "http://localhost:4320",

  // Supabase
  SUPABASE_URL: (function () {
    const raw =
      (import.meta.env.VITE_SUPABASE_URL || "").replace(
        /https?:\/\/(localhost|127\.0\.0\.1):3001/,
        "/rest",
      ) || "/rest";
    if (raw.startsWith("/") && typeof window !== "undefined") {
      return `${window.location.origin}${raw}`;
    }
    return raw;
  })(),
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "",

  // Stripe (billing: checkout + portal)
  STRIPE_PUBLIC_KEY:
    import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "",
  STRIPE_PRICE_ID: import.meta.env.VITE_STRIPE_PRICE_ID || "",

  // Percepção Operacional — LLM Vision (análise de cena; legado)
  LLM_VISION_ENDPOINT: import.meta.env.VITE_LLM_VISION_ENDPOINT || "",

  // AI Gateway — uma IA, vários papéis (ver docs/CHEFIAPP_AI_GATEWAY_SPEC.md)
  AI_GATEWAY_ENDPOINT: import.meta.env.VITE_AI_GATEWAY_ENDPOINT || "",

  // Environment
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE || "development",
};

// Runtime Check (Fail Loud in PROD)
if (import.meta.env.PROD) {
  if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === "/rest") {
    console.error("❌ CRITICAL: Missing or invalid VITE_SUPABASE_URL");
  }
  if (!CONFIG.SUPABASE_ANON_KEY) {
    console.error("❌ CRITICAL: Missing VITE_SUPABASE_ANON_KEY");
  }
}

// DEV: Log config status
if (import.meta.env.DEV) {
  console.log("[CONFIG] Loaded:", {
    SUPABASE_URL: CONFIG.SUPABASE_URL,
    API_BASE: CONFIG.API_BASE,
    MODE: CONFIG.MODE,
  });
}
