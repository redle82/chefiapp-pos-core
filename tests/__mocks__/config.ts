/**
 * Mock for merchant-portal/src/config.ts (uses import.meta.env; not available in Jest/Node).
 * Used when Jest runs tests that pull in code paths that depend on config.
 */
export const CONFIG = {
  INSFORGE_URL: "",
  INSFORGE_ANON_KEY: "",
  API_BASE: "http://localhost:4320",
  INTERNAL_API_TOKEN: "",
  CORE_URL: "http://localhost:3001",
  CORE_ANON_KEY: "",
  STRIPE_PUBLIC_KEY: "",
  STRIPE_PRICE_ID: "",
  STRIPE_IS_TEST: false,
  LLM_VISION_ENDPOINT: "",
  AI_GATEWAY_ENDPOINT: "",
  IS_DEV: true,
  IS_PROD: false,
  MODE: "test",
  DEBUG_DIRECT_FLOW: false,
  UI_MODE: "OPERATIONAL_OS",
  TERMINAL_INSTALLATION_TRACK: false,
  ALLOW_STAFF_ROLE_QUERY: false,
  SUPPORT_WHATSAPP_NUMBER: "",
};
