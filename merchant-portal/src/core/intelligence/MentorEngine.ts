// MentorEngine.ts — Onda 6: Motor Cognitivo / IA
// Detecta padrões, analisa contexto, decide timing, coleta feedback

import {
  ContextAnalyzer,
  type EnvironmentState,
  type MentorContext,
  type OperatorProfile,
} from "./ContextAnalyzer";
import {
  FeedbackLoop,
  type FeedbackEntry,
  type FeedbackStats,
} from "./FeedbackLoop";
import { TimingEngine, type TimingConfig } from "./TimingEngine";

export type MentorshipEvent =
  | { type: "SLA_VIOLATED"; orderId: string; timestamp: number }
  | { type: "STOCK_ZEROED"; productId: string; timestamp: number }
  | {
      type: "ORDER_DELAYED";
      orderId: string;
      delayMinutes: number;
      timestamp: number;
    };

export type MentorshipMessage = {
  id: string;
  type: "suggestion" | "alert";
  text: string;
  context?: Record<string, unknown>;
  timestamp: number;
  /** Tipo de mentoria recomendado pelo ContextAnalyzer */
  mentorshipType?: MentorContext["recommendedMentorshipType"];
};

export class MentorEngine {
  private events: MentorshipEvent[] = [];
  private messages: MentorshipMessage[] = [];

  private contextAnalyzer = new ContextAnalyzer();
  private timingEngine: TimingEngine;
  private feedbackLoop = new FeedbackLoop();

  private currentContext: MentorContext | null = null;

  constructor(timingConfig?: Partial<TimingConfig>) {
    this.timingEngine = new TimingEngine(timingConfig);
  }

  /**
   * Atualiza o contexto operacional (perfil + ambiente).
   */
  setContext(operator: OperatorProfile, env?: Partial<EnvironmentState>): void {
    this.currentContext = this.contextAnalyzer.analyze(operator, env ?? {});
  }

  /**
   * Adiciona um evento e regenera mensagens filtradas por timing.
   */
  addEvent(event: MentorshipEvent): void {
    this.events.push(event);
    this.generateMessages();
  }

  getMessages(): MentorshipMessage[] {
    return this.messages;
  }

  getContext(): MentorContext | null {
    return this.currentContext;
  }

  /**
   * Registra feedback sobre uma mensagem.
   */
  addFeedback(messageId: string, rating: FeedbackEntry["rating"]): void {
    this.feedbackLoop.record({
      messageId,
      rating,
      timestamp: Date.now(),
      operatorRole: this.currentContext?.operator.role,
    });
  }

  getFeedbackStats(): FeedbackStats {
    return this.feedbackLoop.getStats();
  }

  private generateMessages(): void {
    const raw = this.events
      .map((event) => {
        if (event.type === "SLA_VIOLATED") {
          return {
            id: `sla-${event.orderId}-${event.timestamp}`,
            type: "alert" as const,
            text: `SLA violado no pedido ${event.orderId}. Avalie causas e ajuste processos.`,
            context: { orderId: event.orderId },
            timestamp: event.timestamp,
          };
        }
        if (event.type === "STOCK_ZEROED") {
          return {
            id: `stock-${event.productId}-${event.timestamp}`,
            type: "suggestion" as const,
            text: `Estoque zerado para o produto ${event.productId}. Considere reposição automática.`,
            context: { productId: event.productId },
            timestamp: event.timestamp,
          };
        }
        if (event.type === "ORDER_DELAYED") {
          return {
            id: `delay-${event.orderId}-${event.timestamp}`,
            type: "alert" as const,
            text: `Pedido ${event.orderId} atrasado em ${event.delayMinutes} min. Avalie reforço de staff.`,
            context: { orderId: event.orderId, delay: event.delayMinutes },
            timestamp: event.timestamp,
          };
        }
        return null;
      })
      .filter((msg): msg is MentorshipMessage => msg !== null);

    // Enriquecer com tipo de mentoria do contexto
    if (this.currentContext) {
      for (const msg of raw) {
        msg.mentorshipType = this.currentContext.recommendedMentorshipType;
      }
    }

    // Filtrar por feedback: suprimir padrões com taxa de aprovação baixa
    const filtered = raw.filter((msg) => {
      const prefix = msg.id.split("-")[0];
      return !this.feedbackLoop.shouldSuppressPattern(prefix);
    });

    // Filtrar por timing (se contexto disponível)
    if (this.currentContext) {
      this.messages = filtered.filter((msg) => {
        const decision = this.timingEngine.evaluate(msg, this.currentContext!);
        if (decision.shouldDeliver) {
          this.timingEngine.recordDelivery();
          return true;
        }
        return false;
      });
    } else {
      this.messages = filtered;
    }
  }
}
