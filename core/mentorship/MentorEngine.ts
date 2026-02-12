// MentorEngine.ts
// Phase C: Mentoria IA baseada em eventos reais

export type MentorshipEvent = {
  type: "SLA_VIOLATION" | "STOCKOUT" | "DELAY" | "ORDER_CREATED";
  timestamp: string;
  details: Record<string, any>;
};

export type MentorshipMessage = {
  id: string;
  message: string;
  context: string;
  eventRefs: string[];
  createdAt: string;
};

export class MentorEngine {
  private events: MentorshipEvent[] = [];
  private messages: MentorshipMessage[] = [];

  constructor(events: MentorshipEvent[] = []) {
    this.events = events;
    this.generateMessages();
  }

  addEvent(event: MentorshipEvent) {
    this.events.push(event);
    this.generateMessages();
  }

  getMessages(): MentorshipMessage[] {
    return this.messages;
  }

  // Core logic: pattern detection and message generation
  private generateMessages() {
    const messages: MentorshipMessage[] = [];
    const now = new Date().toISOString();

    // Example: SLA violations
    const slaViolations = this.events.filter((e) => e.type === "SLA_VIOLATION");
    if (slaViolations.length > 0) {
      messages.push({
        id: "sla-violation-summary",
        message: `Você teve ${slaViolations.length} SLAs violados hoje. Analise horários e equipe para evitar recorrência.`,
        context: "SLA",
        eventRefs: slaViolations.map((e) => e.timestamp),
        createdAt: now,
      });
    }

    // Example: Stockouts
    const stockouts = this.events.filter((e) => e.type === "STOCKOUT");
    if (stockouts.length > 0) {
      messages.push({
        id: "stockout-summary",
        message: `Estoque zerado em ${stockouts.length} itens. Considere configurar reposição automática.`,
        context: "Stock",
        eventRefs: stockouts.map((e) => e.timestamp),
        createdAt: now,
      });
    }

    // Example: Delays
    const delays = this.events.filter((e) => e.type === "DELAY");
    if (delays.length > 0) {
      messages.push({
        id: "delay-summary",
        message: `Atrasos detectados em ${delays.length} pedidos. Avalie causas e ajuste processos.`,
        context: "Delay",
        eventRefs: delays.map((e) => e.timestamp),
        createdAt: now,
      });
    }

    // Example: First order
    const firstOrder = this.events.find((e) => e.type === "ORDER_CREATED");
    if (firstOrder) {
      messages.push({
        id: "first-order",
        message:
          "Seu primeiro pedido foi criado! Veja no KDS e acompanhe o fluxo.",
        context: "Onboarding",
        eventRefs: [firstOrder.timestamp],
        createdAt: now,
      });
    }

    this.messages = messages;
  }
}
