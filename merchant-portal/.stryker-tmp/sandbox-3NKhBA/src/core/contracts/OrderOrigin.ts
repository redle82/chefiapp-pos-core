/**
 * ORDER ORIGIN — Contrato Centralizado
 *
 * FASE 3.2: Isolamento de Contratos
 *
 * ÚNICA fonte de verdade para origem de pedidos.
 *
 * REGRAS:
 * - Incluir TODOS os valores já usados no sistema
 * - Não remover valores existentes (compatibilidade)
 * - Não adicionar novos valores sem necessidade
 */
// @ts-nocheck


/**
 * Origem do pedido conforme usado em todo o sistema.
 *
 * Valores consolidados de:
 * - Core: CAIXA, WEB, QR_MESA, GARCOM
 * - UI: TPV, WEB_PUBLIC, GARÇOM, MOBILE, APPSTAFF, APPSTAFF_MANAGER, APPSTAFF_OWNER
 * - Legacy: web, local, external
 */
export type OrderOrigin =
  // Core (schema do banco)
  | "CAIXA"
  | "WEB"
  | "QR_MESA"
  | "GARCOM"
  // Sandbox piloto (SANDBOX_TPV_PILOT_CONTRACT: pedidos de teste marcados no Core)
  | "pilot"
  // UI (variantes)
  | "TPV" // Sinônimo de CAIXA
  | "WEB_PUBLIC" // Variante de WEB
  | "GARÇOM" // Variante de GARCOM (com acento)
  | "MOBILE" // Variante de GARCOM/Mobile
  | "APPSTAFF" // AppStaff genérico
  | "APPSTAFF_MANAGER" // AppStaff com role manager
  | "APPSTAFF_OWNER" // AppStaff com role owner
  // Legacy (compatibilidade)
  | "web" // lowercase
  | "local" // Sinônimo de CAIXA
  | "external"; // Externo

/**
 * Normaliza origem para valor canônico do Core.
 *
 * @param origin Origem a normalizar
 * @returns Origem normalizada (uppercase, sem acentos)
 */
export function normalizeOrderOrigin(
  origin: OrderOrigin | string | null | undefined,
): OrderOrigin {
  if (!origin) {
    return "CAIXA"; // Default
  }

  const upper = origin.toUpperCase();

  // Mapeamento de variantes para canônicos
  const mapping: Record<string, OrderOrigin> = {
    TPV: "CAIXA",
    PILOT: "pilot",
    LOCAL: "CAIXA",
    WEB_PUBLIC: "WEB",
    GARÇOM: "GARCOM",
    MOBILE: "GARCOM",
    APPSTAFF: "APPSTAFF", // Mantém como está
    APPSTAFF_MANAGER: "APPSTAFF_MANAGER",
    APPSTAFF_OWNER: "APPSTAFF_OWNER",
    EXTERNAL: "external",
    WEB: "WEB",
    CAIXA: "CAIXA",
    QR_MESA: "QR_MESA",
    GARCOM: "GARCOM",
  };

  return (mapping[upper] || upper) as OrderOrigin;
}
