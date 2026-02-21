// @ts-nocheck
// TimingEngine.ts — Onda 6: Decide QUANDO exibir sugestões da IA
// Evita fadiga cognitiva, respeita momento operacional

import type { MentorContext } from "./ContextAnalyzer";
import type { MentorshipMessage } from "./MentorEngine";

export type TimingDecision = {
  shouldDeliver: boolean;
  /** Delay em ms antes de exibir (0 = imediato) */
  delayMs: number;
  reason: string;
};

export type TimingConfig = {
  /** Intervalo mínimo entre sugestões em ms (default 60s) */
  minIntervalMs: number;
  /** Máximo de sugestões por hora (default 5) */
  maxPerHour: number;
  /** Suprimir durante pico intenso (default false) */
  suppressDuringPeak: boolean;
  /** Agrupar alertas do mesmo tipo (default true) */
  batchSimilar: boolean;
};

const DEFAULT_CONFIG: TimingConfig = {
  minIntervalMs: 60_000,
  maxPerHour: 5,
  suppressDuringPeak: false,
  batchSimilar: true,
};

export class TimingEngine {
  private config: TimingConfig;
  private deliveryLog: number[] = [];
  private lastDelivery = 0;

  constructor(config?: Partial<TimingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Decide se uma mensagem pode ser entregue agora, dado o contexto.
   */
  evaluate(message: MentorshipMessage, context: MentorContext): TimingDecision {
    const now = Date.now();

    // Regra 1: intervalo mínimo entre entregas
    if (now - this.lastDelivery < this.config.minIntervalMs) {
      return {
        shouldDeliver: false,
        delayMs: this.config.minIntervalMs - (now - this.lastDelivery),
        reason: "interval_too_short",
      };
    }

    // Regra 2: limite por hora
    const oneHourAgo = now - 3_600_000;
    const recentDeliveries = this.deliveryLog.filter((t) => t > oneHourAgo);
    if (recentDeliveries.length >= this.config.maxPerHour) {
      return {
        shouldDeliver: false,
        delayMs: 0,
        reason: "hourly_limit_reached",
      };
    }

    // Regra 3: suprimir em pico intenso (se configurado)
    if (
      this.config.suppressDuringPeak &&
      context.environment.isPeakHour &&
      message.type === "suggestion"
    ) {
      return {
        shouldDeliver: false,
        delayMs: 0,
        reason: "peak_hour_suppressed",
      };
    }

    // Regra 4: alertas sempre passam (com possível delay para agrupar)
    if (message.type === "alert") {
      return {
        shouldDeliver: true,
        delayMs: 0,
        reason: "alert_priority",
      };
    }

    // Regra 5: sugestões para iniciantes — delay menor para educar
    if (context.operator.experience === "beginner") {
      return {
        shouldDeliver: true,
        delayMs: 2_000,
        reason: "beginner_educational",
      };
    }

    // Regra 6: fora de pico → entrega com delay breve
    if (!context.environment.isPeakHour) {
      return {
        shouldDeliver: true,
        delayMs: 5_000,
        reason: "off_peak_suggestion",
      };
    }

    // Default: entrega com delay médio
    return {
      shouldDeliver: true,
      delayMs: 10_000,
      reason: "standard_delivery",
    };
  }

  /**
   * Registra que uma mensagem foi entregue.
   */
  recordDelivery(): void {
    const now = Date.now();
    this.lastDelivery = now;
    this.deliveryLog.push(now);

    // Limpa log com mais de 2h
    const twoHoursAgo = now - 7_200_000;
    this.deliveryLog = this.deliveryLog.filter((t) => t > twoHoursAgo);
  }

  /**
   * Reset para testes.
   */
  reset(): void {
    this.deliveryLog = [];
    this.lastDelivery = 0;
  }
}
