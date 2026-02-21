/**
 * Ligação alertas críticos → runbooks (contrato O5.10).
 *
 * Contrato: docs/ops/ALERT_ACTION_CONTRACT.md
 * Base URL: VITE_DOCS_BASE_URL (ex.: repo GitHub ou docs publicados).
 */
// @ts-nocheck


const DOCS_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_DOCS_BASE_URL) ||
  "https://github.com/chefiapp/chefiapp-pos-core/blob/main/docs";

/** Caminho do índice de runbooks (ops). */
const RUNBOOKS_INDEX = "ops/RUNBOOKS.md";

/**
 * Devolve a URL do runbook adequado ao tipo de alerta.
 * Por defeito: índice RUNBOOKS.md. Futuro: mapear alertType → runbook específico.
 */
export function getRunbookUrl(alertType?: string): string {
  const base = DOCS_BASE.replace(/\/$/, "");
  // Por agora um único índice; depois pode haver alertType → path
  const path = RUNBOOKS_INDEX;
  return `${base}/${path}`;
}
