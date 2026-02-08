// MentorEngine.ts — Onda 6: Motor Cognitivo / IA
// Esqueleto inicial para detecção de padrões e geração de sugestões

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
  context?: any;
  timestamp: number;
};

export class MentorEngine {
  private events: MentorshipEvent[] = [];
  private messages: MentorshipMessage[] = [];

  addEvent(event: MentorshipEvent) {
    this.events.push(event);
    this.generateMessages();
  }

  getMessages(): MentorshipMessage[] {
    return this.messages;
  }

  private generateMessages() {
    // Corrigido: sempre retorna array plano de MentorshipMessage
    this.messages = this.events
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
  }
}

// Futuro: feedback loop, aprendizado de padrões, integração com perfis
