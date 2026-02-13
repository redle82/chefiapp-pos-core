/**
 * AT QR Code URL (Portugal)
 *
 * Constrói o URL de validação da AT para o QR code no recibo fiscal.
 * Referência: Portaria n.º 195/2020; info.portaldasfinancas.gov.pt — Código QR.
 * Base: https://www.portaldasfinancas.gov.pt/at/qa
 */

export interface AtQrParams {
  /** NIF do emitente (9 dígitos) */
  nif: string;
  /** ATCUD (Código Único de Documento) — ex: FT-2026-000001 */
  atcud: string;
  /** Data de emissão ISO (YYYY-MM-DD) */
  documentDate: string;
  /** Total do documento em euros (2 decimais) */
  total: number;
  /** Hash/assinatura do documento (opcional) */
  hash?: string;
}

const AT_QA_BASE = "https://www.portaldasfinancas.gov.pt/at/qa";

/**
 * Devolve o URL completo para o QR code AT (Portugal).
 * O QR code deve codificar este URL para validação no Portal das Finanças.
 */
export function buildAtQrUrl(params: AtQrParams): string {
  const { nif, atcud, documentDate, total, hash } = params;
  const nifClean = String(nif || "").replace(/\D/g, "").slice(0, 9);
  const datePart = documentDate.slice(0, 10);
  const totalStr = typeof total === "number" ? total.toFixed(2) : String(total);
  const search = new URLSearchParams();
  search.set("nif", nifClean);
  search.set("atcud", atcud);
  search.set("d", datePart);
  search.set("t", totalStr);
  if (hash) search.set("h", hash);
  return `${AT_QA_BASE}?${search.toString()}`;
}
