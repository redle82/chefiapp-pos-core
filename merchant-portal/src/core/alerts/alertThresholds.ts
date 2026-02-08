/**
 * Limiares de alerta operacionais (contrato).
 *
 * Fonte única para valores de deteção de eventos (order_delayed, table_unattended, etc.).
 * Contrato: docs/ops/ALERT_THRESHOLDS_CONTRACT.md
 *
 * Hoje: defaults fixos. Futuro: override por restaurantId via RPC ou tenant_settings.
 */

export interface AlertThresholds {
  /** Pedido ativo há mais de X minutos → order_delayed */
  order_delayed_minutes: number;
  /** Pedido excedeu tempo máximo de espera (min) → order_sla_breach */
  order_sla_breach_minutes: number;
  /** Mesa ocupada sem atendimento há mais de X minutos → table_unattended */
  table_unattended_minutes: number;
  /** Intervalo de polling para verificação de eventos (ms) */
  event_check_interval_ms: number;
  /** Tempo desde último pedido (min) acima do qual se emite RESTAURANT_IDLE (CONTRATO_DE_ATIVIDADE_OPERACIONAL) */
  restaurant_idle_minutes: number;
}

/** Valores padrão conforme ALERT_THRESHOLDS_CONTRACT.md e CONTRATO_DE_ATIVIDADE_OPERACIONAL */
export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  order_delayed_minutes: 15,
  order_sla_breach_minutes: 30,
  table_unattended_minutes: 10,
  event_check_interval_ms: 60_000,
  restaurant_idle_minutes: 15,
};

/**
 * Devolve os limiares em vigor.
 * Por agora sempre os defaults; depois pode aceitar override por restaurantId (RPC / tenant_settings).
 */
export function getAlertThresholds(_restaurantId?: string): AlertThresholds {
  return { ...DEFAULT_ALERT_THRESHOLDS };
}
