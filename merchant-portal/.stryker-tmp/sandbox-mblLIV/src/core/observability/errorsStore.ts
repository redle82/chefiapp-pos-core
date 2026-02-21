/**
 * errorsStore — In-memory store de erros/avisos para painel de observabilidade (esta sessão)
 *
 * Fase 2 (1000-ready). Logger chama addEntry em warn/error/critical;
 * ObservabilityPage lê getErrorsLast24hCount(restaurantId).
 * Limitação: reseta ao recarregar; evolução futura = gm_app_logs no Core.
 */

const MAX_ENTRIES = 500;
const MS_24H = 24 * 60 * 60 * 1000;

interface ErrorEntry {
  restaurantId: string | null;
  level: string;
  timestamp: number;
}

const entries: ErrorEntry[] = [];

/**
 * Regista um aviso/erro (chamado pelo Logger em warn/error/critical).
 */
export function addEntry(restaurantId: string | null, level: string): void {
  entries.push({
    restaurantId,
    level,
    timestamp: Date.now(),
  });
  while (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
}

/**
 * Conta entradas nas últimas 24h para o restaurante.
 * Síncrono; usado pelo painel de observabilidade.
 */
export function getErrorsLast24hCount(restaurantId: string): number {
  const cutoff = Date.now() - MS_24H;
  return entries.filter(
    (e) => e.timestamp >= cutoff && e.restaurantId === restaurantId,
  ).length;
}
