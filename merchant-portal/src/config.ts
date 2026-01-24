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
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "",

  // Stripe
  STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY || "",

  // Environment
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE || "development",
};

// Runtime Check (Fail Loud in PROD)
if (import.meta.env.PROD) {
  if (!CONFIG.SUPABASE_URL) {
    console.error("❌ CRITICAL: Missing VITE_SUPABASE_URL");
  }
  if (!CONFIG.SUPABASE_ANON_KEY) {
    console.error("❌ CRITICAL: Missing VITE_SUPABASE_ANON_KEY");
  }
}

// DEV: Log config status
if (import.meta.env.DEV) {
  console.log("[CONFIG] Loaded:", {
    SUPABASE_URL: CONFIG.SUPABASE_URL ? "✅ Set" : "❌ Missing",
    API_BASE: CONFIG.API_BASE,
    MODE: CONFIG.MODE,
  });
}
