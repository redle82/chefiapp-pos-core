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

declare const __VITE_ENV__: EnvLike | undefined;

const ENV: EnvLike =
  typeof __VITE_ENV__ !== "undefined"
    ? __VITE_ENV__
    : typeof process !== "undefined" && process.env
    ? (process.env as EnvLike)
    : {};

const getEnvString = (key: string, fallback = ""): string => {
  const value = ENV[key];
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  return fallback;
};

const getEnvBool = (key: string, fallback = false): boolean => {
  const value = ENV[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1";
  return fallback;
};

const MODE =
  (typeof ENV.MODE === "string" && ENV.MODE) ||
  (typeof process !== "undefined" ? process.env.NODE_ENV : undefined) ||
  "development";

const IS_DEV = typeof ENV.DEV === "boolean" ? ENV.DEV : MODE === "development";
const IS_PROD =
  typeof ENV.PROD === "boolean" ? ENV.PROD : MODE === "production";

export const CONFIG = {
  // ─── InsForge (Production BaaS) ─────────────────────────────
  /** InsForge project URL. When set, InsForge is the active backend. */
  INSFORGE_URL: getEnvString("VITE_INSFORGE_URL"),
  /** InsForge anonymous/public key for client-side access. */
  INSFORGE_ANON_KEY: getEnvString("VITE_INSFORGE_ANON_KEY"),

  // API (Web Module)
  API_BASE: getEnvString("VITE_API_BASE", "http://localhost:4320"),

  // Docker Core (PostgREST). Backend único.
  // Em DEV (browser): usa empty string → fetch relativo ao origin → passa pelo Vite proxy /rest → localhost:3001.
  // Em PROD: usa VITE_CORE_URL (URL absoluto do Core) ou empty string.
  get CORE_URL(): string {
    const envUrl = getEnvString("VITE_CORE_URL");
    if (envUrl) return envUrl;
    if (IS_DEV) return "";
    return "";
  },
  get CORE_ANON_KEY(): string {
    return getEnvString("VITE_CORE_ANON_KEY");
  },

  // Stripe (billing: checkout + portal)
  // Guard: reject placeholder keys that would trigger Stripe.js load + CORS errors in dev
  STRIPE_PUBLIC_KEY: (() => {
    const raw =
      getEnvString("VITE_STRIPE_PUBLIC_KEY") ||
      getEnvString("VITE_STRIPE_PUBLISHABLE_KEY") ||
      "";
    if (!raw || raw.includes("placeholder") || raw.includes("forensic")) {
      return "";
    }
    return raw;
  })(),
  STRIPE_PRICE_ID: getEnvString("VITE_STRIPE_PRICE_ID"),

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
  UI_MODE: getEnvString("VITE_UI_MODE", "OPERATIONAL_OS"),

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
    getEnvString("VITE_ALLOW_STAFF_ROLE_QUERY", "true") !== "false" &&
    getEnvString("VITE_ALLOW_STAFF_ROLE_QUERY", "true") !== "0",

  /**
   * SUPPORT_WHATSAPP_NUMBER — Número WhatsApp para suporte ao utilizador.
   * Formato internacional sem + (e.g., "351912345678").
   * Env var: VITE_SUPPORT_WHATSAPP_NUMBER
   */
  SUPPORT_WHATSAPP_NUMBER: getEnvString("VITE_SUPPORT_WHATSAPP_NUMBER"),
};

// Runtime Check (PROD: avisar se Core não configurado — permite landing-only)
if (IS_PROD) {
  const missingUrl = !CONFIG.CORE_URL || CONFIG.CORE_URL === "/rest";
  const missingKey = !CONFIG.CORE_ANON_KEY;
  if (missingUrl || missingKey) {
    const vars = [
      missingUrl && "VITE_CORE_URL",
      missingKey && "VITE_CORE_ANON_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    console.warn(
      `[CONFIG] Core não configurado (modo landing-only). Para operação completa, defina antes do build: ${vars}`,
    );
  }
}

// Log config status (apenas em builds não-produção)
if (IS_DEV) {
  console.log("[CONFIG] Loaded:", {
    CORE_URL: CONFIG.CORE_URL,
    API_BASE: CONFIG.API_BASE,
    MODE: CONFIG.MODE === "production" ? "production" : "local",
  });
}
