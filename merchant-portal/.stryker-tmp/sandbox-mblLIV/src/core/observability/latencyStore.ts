/**
 * latencyStore — In-memory store de latências para painel de observabilidade (esta sessão)
 *
 * Fase 2 (1000-ready). CoreOrdersApi e OrderWriter chamam addSample em create_order_atomic;
 * ObservabilityPage lê getAverageLatencyMs(restaurantId).
 * Limitação: reseta ao recarregar; evolução futura = métricas no Core ou Prometheus.
 */

const MAX_SAMPLES = 50;

interface LatencySample {
  restaurantId: string | null;
  operation: string;
  durationMs: number;
}

const samples: LatencySample[] = [];

/**
 * Regista uma amostra de latência (chamado pelos writers após create_order_atomic).
 */
export function addSample(
  restaurantId: string | null,
  operation: string,
  durationMs: number,
): void {
  samples.push({ restaurantId, operation, durationMs });
  while (samples.length > MAX_SAMPLES) {
    samples.shift();
  }
}

/**
 * Média simples das amostras na janela para o restaurante e operação.
 * Síncrono; usado pelo painel de observabilidade.
 */
export function getAverageLatencyMs(
  restaurantId: string,
  operation: string = "create_order_atomic",
): number {
  const matching = samples.filter(
    (s) => s.restaurantId === restaurantId && s.operation === operation,
  );
  if (matching.length === 0) return 0;
  const sum = matching.reduce((a, s) => a + s.durationMs, 0);
  return sum / matching.length;
}
