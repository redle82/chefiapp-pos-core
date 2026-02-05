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

  // Docker Core (PostgREST). Backend único. VITE_CORE_* canónico; VITE_SUPABASE_* fallback @legacy-remove
  CORE_URL: (function () {
    const coreUrl = import.meta.env.VITE_CORE_URL;
    const legacyUrl = import.meta.env.VITE_SUPABASE_URL;
    const envUrl = coreUrl || legacyUrl || "";
    if (!coreUrl && legacyUrl && typeof console !== "undefined") {
      console.warn("[CONFIG] @legacy-remove: Using VITE_SUPABASE_URL. Prefer VITE_CORE_URL.");
    }
    const raw = envUrl || (import.meta.env.PROD ? "" : "/rest");

    // Dev + browser: sempre usar proxy (same-origin) para evitar CORS com Core em 3001
    if (import.meta.env.DEV && typeof window !== "undefined") {
      return window.location.origin;
    }

    if (raw.startsWith("http") && !raw.includes("localhost:3001")) return raw;

    if (raw.includes("localhost:3001")) {
      return typeof window !== "undefined" ? window.location.origin : "";
    }

    if (raw === "") return "";

    if (typeof window !== "undefined") {
      return `${window.location.origin}${raw}`;
    }

    return `http://localhost:5175${raw}`;
  })(),
  CORE_ANON_KEY: (function () {
    const coreKey = import.meta.env.VITE_CORE_ANON_KEY;
    const legacyKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!coreKey && legacyKey && typeof console !== "undefined") {
      console.warn("[CONFIG] @legacy-remove: Using VITE_SUPABASE_ANON_KEY. Prefer VITE_CORE_ANON_KEY.");
    }
    return coreKey || legacyKey || "";
  })(),

  // Stripe (billing: checkout + portal)
  STRIPE_PUBLIC_KEY:
    import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "",
  STRIPE_PRICE_ID: import.meta.env.VITE_STRIPE_PRICE_ID || "",

  /** LLM Vision (legado). Data de remoção prevista: após confirmação de não uso. */
  LLM_VISION_ENDPOINT: import.meta.env.VITE_LLM_VISION_ENDPOINT || "",

  // AI Gateway — uma IA, vários papéis (ver docs/CHEFIAPP_AI_GATEWAY_SPEC.md)
  AI_GATEWAY_ENDPOINT: import.meta.env.VITE_AI_GATEWAY_ENDPOINT || "",

  // Environment
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE || "development",

  /**
   * DEBUG_DIRECT_FLOW — Vertical slice brutal (temporário).
   * Quando true: TPV/KDS/Dashboard ignoram Turno, ORE, Wizard.
   * Leitura/escrita direta: create_order_atomic → gm_orders → KDS/Dashboard leem direto.
   * Objetivo: provar que o sistema ainda respira (nervo vivo).
   * Desligar em produção. Data de remoção prevista: TBD (ver LEGACY_CODE_BLACKLIST §3).
   * Ver docs/pilots/DIAGNOSTICO_CADEIA_ATIVIDADE_OPERACIONAL.md.
   */
  DEBUG_DIRECT_FLOW:
    import.meta.env.VITE_DEBUG_DIRECT_FLOW === "true" ||
    import.meta.env.VITE_DEBUG_DIRECT_FLOW === "1",

  /**
   * UI_MODE — Modo de apresentação do dashboard.
   * OPERATIONAL_OS: Painel de Comando (contrato OPERATIONAL_DASHBOARD_V2); esconde trial, primeira venda, atalhos.
   * default: layout legado. Por defeito usamos OPERATIONAL_OS; para legado: VITE_UI_MODE=default.
   */
  UI_MODE: import.meta.env.VITE_UI_MODE || "OPERATIONAL_OS",

  /**
   * TERMINAL_INSTALLATION_TRACK — Trilho de instalação de terminais (gm_terminals, device_id) existe.
   * false: TPV/KDS mostram "Não instalado" + CTA "Instalar terminal" (Gap A do ROADMAP_POS_FREEZE).
   * true: TPV/KDS habilitados/desabilitados conforme ORE.
   */
  TERMINAL_INSTALLATION_TRACK:
    import.meta.env.VITE_TERMINAL_INSTALLATION_TRACK === "true" ||
    import.meta.env.VITE_TERMINAL_INSTALLATION_TRACK === "1",
};

// Runtime Check (Fail Loud in PROD)
if (import.meta.env.PROD) {
  if (!CONFIG.CORE_URL || CONFIG.CORE_URL === "/rest") {
    console.error("❌ CRITICAL: Missing or invalid VITE_CORE_URL");
  }
  if (!CONFIG.CORE_ANON_KEY) {
    console.error("❌ CRITICAL: Missing VITE_CORE_ANON_KEY");
  }
}

// Log config status (apenas em builds não-produção)
if (import.meta.env.DEV) {
  console.log("[CONFIG] Loaded:", {
    CORE_URL: CONFIG.CORE_URL,
    API_BASE: CONFIG.API_BASE,
    MODE: CONFIG.MODE === "production" ? "production" : "local",
  });
}
