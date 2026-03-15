/**
 * Global Configuration Strategy
 *
 * Centralizes environment variables and defaults.
 * Follows "Fail Loud" for critical missing vars in production.
 * @version 2026-02-26 — cache-bust for corrected Supabase anon key
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
// Supabase: quando VITE_SUPABASE_URL está definido e é supabase.co, usamos como CORE (fluxo soberano P0).
// Assim o portal usa login email/password e PostgREST do Supabase mesmo que VITE_CORE_URL exista (ex.: .env.local com Docker).
const MODE = getEnvString("VITE_MODE") || "trial";
const SUPABASE_URL_RAW = getEnvString("VITE_SUPABASE_URL");
const USE_SUPABASE_AS_CORE =
  typeof SUPABASE_URL_RAW === "string" && SUPABASE_URL_RAW.includes("supabase.co");
const CORE_URL = normalizeUrl(
  USE_SUPABASE_AS_CORE
    ? SUPABASE_URL_RAW
    : getEnvString("VITE_CORE_URL") || SUPABASE_URL_RAW || ""
);
const CORE_ANON_KEY = USE_SUPABASE_AS_CORE
  ? getEnvString("VITE_SUPABASE_ANON_KEY") || getEnvString("VITE_CORE_ANON_KEY") || ""
  : getEnvString("VITE_CORE_ANON_KEY") || getEnvString("VITE_SUPABASE_ANON_KEY") || "";
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
  /** True when VITE_API_BASE points to Supabase Edge (paths are function names). See docs/ops/MIGRATION_RENDER_TO_EDGE.md */
  get isEdgeGateway(): boolean {
    const base = getEnvString("VITE_API_BASE") || "";
    return base.includes("supabase.co/functions/v1");
  },
  /**
   * True when gateway is configured and reachable (not placeholder).
   * When false: hide checkout/PIX/SumUp/card; show only cash in TPV; billing shows "em breve".
   * See docs/ops/PLANO_48H_OPERACAO_SEM_GATEWAY.md
   */
  get isGatewayAvailable(): boolean {
    const base = getEnvString("VITE_API_BASE") || "";
    if (!base) return false;
    if (/your-gateway-url|placeholder/i.test(base)) return false;
    return true;
  },
  INTERNAL_API_TOKEN: getEnvString("VITE_INTERNAL_API_TOKEN"),

  // Docker Core (PostgREST). Backend unico.
  CORE_URL,
  CORE_ANON_KEY,
  /** True when CORE is a Supabase project (sovereign flow P0: email/password login). */
  get isSupabaseBackend(): boolean {
    return typeof CORE_URL === "string" && CORE_URL.includes("supabase.co");
  },
  /** Em dev+Supabase: true = não chama APIs (usa seed), zero 400. Default true em dev. Para forçar API: VITE_SUPABASE_SKIP_RESTAURANT_API=false */
  get SUPABASE_SKIP_RESTAURANT_API(): boolean {
    const v = getEnvString("VITE_SUPABASE_SKIP_RESTAURANT_API");
    if (v === "false" || v === "0") return false;
    if (v === "true" || v === "1") return true;
    return IS_DEV;
  },

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
   * BLOCK_DIRECT_WRITES — Bloqueia writes directos em gm_orders, gm_order_items, gm_payments.
   * Quando true, lança DirectWriteBlockedError; usar Core RPCs exclusivamente.
   * Activar apenas em CI/testes para validar ausência de violações. Env: VITE_BLOCK_DIRECT_WRITES ou BLOCK_DIRECT_WRITES (Node).
   */
  get BLOCK_DIRECT_WRITES(): boolean {
    const v = getEnvString("VITE_BLOCK_DIRECT_WRITES");
    if (v === "true" || v === "1") return true;
    if (typeof process !== "undefined" && process.env?.BLOCK_DIRECT_WRITES === "true") return true;
    return false;
  },

  /**
   * SUPPORT_WHATSAPP_NUMBER — Número WhatsApp para suporte ao utilizador.
   * Formato internacional sem + (e.g., "351912345678").
   * Env var: VITE_SUPPORT_WHATSAPP_NUMBER
   */
  SUPPORT_WHATSAPP_NUMBER: getEnvString("VITE_SUPPORT_WHATSAPP_NUMBER"),

  /**
   * Enterprise Dashboard — feature flag for safe rollout.
   * true in dev by default; false in prod unless VITE_ENTERPRISE_DASHBOARD_ENABLED=true.
   */
  get ENTERPRISE_DASHBOARD_ENABLED(): boolean {
    const v = getEnvString("VITE_ENTERPRISE_DASHBOARD_ENABLED");
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
    return IS_DEV;
  },

  /**
   * Offline strategy: heartbeat ao Core para deteção de conectividade fiável.
   * Quando ativo, após N falhas consecutivas considera "degraded" mesmo com navigator.onLine.
   * Env: VITE_OFFLINE_HEARTBEAT_ENABLED (default true), VITE_OFFLINE_HEARTBEAT_INTERVAL_MS (default 30000), VITE_OFFLINE_HEARTBEAT_FAILURES (default 2).
   */
  OFFLINE_HEARTBEAT_ENABLED: getEnvBool("VITE_OFFLINE_HEARTBEAT_ENABLED", true),
  OFFLINE_HEARTBEAT_INTERVAL_MS: Math.max(5000, parseInt(getEnvString("VITE_OFFLINE_HEARTBEAT_INTERVAL_MS") || "30000", 10)),
  OFFLINE_HEARTBEAT_FAILURES: Math.max(1, parseInt(getEnvString("VITE_OFFLINE_HEARTBEAT_FAILURES") || "2", 10)),

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
  isSupabaseBackend: CONFIG.isSupabaseBackend,
});
