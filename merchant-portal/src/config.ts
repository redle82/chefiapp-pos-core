/**
 * Global Configuration Strategy
 *
 * Centralizes environment variables and defaults.
 * Follows "Fail Loud" for critical missing vars in production.
 */

type EnvLike = {
  DEV?: boolean;
  PROD?: boolean;
  MODE?: string;
  [key: string]: string | boolean | undefined;
};

const ENV: EnvLike = import.meta.env;

const getEnvString = (key: string): string => {
  const value = ENV[key];
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
};

const getEnvBool = (key: string, fallback = false): boolean => {
  const value = ENV[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1";
  return fallback;
};

const assertEnv = (name: string, value: string): string => {
  if (!value) {
    throw new Error(`[CONFIG] Missing ${name}`);
  }
  return value;
};

const normalizeUrl = (value: string): string =>
  value.endsWith("/") ? value.slice(0, -1) : value;

// Permitir boot sem Core (trial/landing na Vercel); rotas operacionais exigem env vars.
// Supabase: quando só VITE_SUPABASE_* estão definidos, usamos como CORE (mesmo PostgREST).
const MODE = getEnvString("VITE_MODE") || "trial";
const CORE_URL = normalizeUrl(
  getEnvString("VITE_CORE_URL") || getEnvString("VITE_SUPABASE_URL") || ""
);
const CORE_ANON_KEY =
  getEnvString("VITE_CORE_ANON_KEY") || getEnvString("VITE_SUPABASE_ANON_KEY") || "";
const API_BASE = normalizeUrl(getEnvString("VITE_API_BASE") || "");

const IS_DEV = MODE !== "production";
const IS_PROD = MODE === "production";

// Stripe key fora do objeto para evitar getter que referencia CONFIG (evita "Cannot access before initialization" em chunks)
const STRIPE_PUBLIC_KEY_RAW = (() => {
  const raw =
    getEnvString("VITE_STRIPE_PUBLIC_KEY") ||
    getEnvString("VITE_STRIPE_PUBLISHABLE_KEY") ||
    "";
  if (!raw || raw.includes("placeholder") || raw.includes("forensic")) return "";
  return raw;
})();

export const CONFIG = {
  // ─── InsForge (Production BaaS) ─────────────────────────────
  /** InsForge project URL. When set, InsForge is the active backend. */
  INSFORGE_URL: getEnvString("VITE_INSFORGE_URL"),
  /** InsForge anonymous/public key for client-side access. */
  INSFORGE_ANON_KEY: getEnvString("VITE_INSFORGE_ANON_KEY"),

  // API (Web Module)
  API_BASE,
  INTERNAL_API_TOKEN: getEnvString("VITE_INTERNAL_API_TOKEN"),

  // Docker Core (PostgREST). Backend unico.
  CORE_URL,
  CORE_ANON_KEY,

  // Stripe (billing: checkout + portal)
  STRIPE_PUBLIC_KEY: STRIPE_PUBLIC_KEY_RAW,
  STRIPE_PRICE_ID: getEnvString("VITE_STRIPE_PRICE_ID"),
  /** true quando a chave pública começa por pk_test_ (modo demo/teste Stripe) */
  get STRIPE_IS_TEST(): boolean {
    return typeof STRIPE_PUBLIC_KEY_RAW === "string" && STRIPE_PUBLIC_KEY_RAW.startsWith("pk_test_");
  },

  /** LLM Vision (legado). Data de remoção prevista: após confirmação de não uso. */
  LLM_VISION_ENDPOINT: getEnvString("VITE_LLM_VISION_ENDPOINT"),

  // AI Gateway — uma IA, vários papéis (ver docs/CHEFIAPP_AI_GATEWAY_SPEC.md)
  AI_GATEWAY_ENDPOINT: getEnvString("VITE_AI_GATEWAY_ENDPOINT"),

  // Environment
  IS_DEV,
  IS_PROD,
  MODE,

  /**
   * DEBUG_DIRECT_FLOW — Vertical slice brutal (temporário).
   * Quando true: TPV/KDS/Dashboard ignoram Turno, ORE, Wizard.
   * Leitura/escrita direta: create_order_atomic → gm_orders → KDS/Dashboard leem direto.
   * Objetivo: provar que o sistema ainda respira (nervo vivo).
   * Desligar em produção. Data de remoção prevista: TBD (ver LEGACY_CODE_BLACKLIST §3).
   * Ver docs/pilots/DIAGNOSTICO_CADEIA_ATIVIDADE_OPERACIONAL.md.
   */
  DEBUG_DIRECT_FLOW: getEnvBool("VITE_DEBUG_DIRECT_FLOW"),

  /**
   * UI_MODE — Modo de apresentação do dashboard.
   * OPERATIONAL_OS: Painel de Comando (contrato OPERATIONAL_DASHBOARD_V2); esconde trial, primeira venda, atalhos.
   * default: layout legado. Por defeito usamos OPERATIONAL_OS; para legado: VITE_UI_MODE=default.
   */
  UI_MODE: getEnvString("VITE_UI_MODE") || "OPERATIONAL_OS",

  /**
   * TERMINAL_INSTALLATION_TRACK — Trilho de instalação de terminais (gm_terminals, device_id) existe.
   * false: TPV/KDS mostram "Não instalado" + CTA "Instalar terminal" (Gap A do ROADMAP_POS_FREEZE).
   * true: TPV/KDS habilitados/desabilitados conforme ORE.
   */
  TERMINAL_INSTALLATION_TRACK: getEnvBool("VITE_TERMINAL_INSTALLATION_TRACK"),

  /**
   * ALLOW_STAFF_ROLE_QUERY — Permite definir role do AppStaff via query ?role= (abas paralelas por papel).
   * true: TRIAL, PILOT, LOCAL; false em produção desativa leitura de ?role= (role só por login/tab).
   * Ref: APPSTAFF_RUNTIME_MODEL.md
   */
  ALLOW_STAFF_ROLE_QUERY:
    getEnvString("VITE_ALLOW_STAFF_ROLE_QUERY") !== "false" &&
    getEnvString("VITE_ALLOW_STAFF_ROLE_QUERY") !== "0",

  /**
   * SUPPORT_WHATSAPP_NUMBER — Número WhatsApp para suporte ao utilizador.
   * Formato internacional sem + (e.g., "351912345678").
   * Env var: VITE_SUPPORT_WHATSAPP_NUMBER
   */
  SUPPORT_WHATSAPP_NUMBER: getEnvString("VITE_SUPPORT_WHATSAPP_NUMBER"),

  /**
   * Indica se a venda da plataforma (checkout/assinatura) está permitida nesta origem.
   * Apenas chefiapp.com pode vender; outros domínios (white-label) não mostram/ativam checkout.
   */
  get canSellPlatform(): boolean {
    const list: string[] = [
      "https://www.chefiapp.com",
      "https://chefiapp.com",
    ];
    if (IS_DEV) {
      list.push(
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      );
    }
    const custom = getEnvString("VITE_PLATFORM_SALE_ORIGINS").split(",")
      .map((o) => o.trim().toLowerCase())
      .filter(Boolean);
    const origins = custom.length > 0 ? custom : list.map((o) => o.toLowerCase());
    return origins.includes((typeof window !== "undefined" ? window.location.origin : "").toLowerCase());
  },
};

console.log("[CONFIG] Loaded", {
  CORE_URL: CONFIG.CORE_URL,
  API_BASE: CONFIG.API_BASE,
  MODE: CONFIG.MODE,
});
