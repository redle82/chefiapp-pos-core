// @ts-nocheck
// FeedbackLoop.ts — Onda 6: Coleta feedback do operador sobre sugestões (útil / não útil)
// Permite aprender quais sugestões são valiosas ao longo do tempo

export type FeedbackEntry = {
  messageId: string;
  rating: "useful" | "not_useful" | "dismissed";
  timestamp: number;
  /** Contexto opcional (ex: quem deu feedback, role) */
  operatorRole?: string;
};

export type FeedbackStats = {
  totalFeedback: number;
  usefulCount: number;
  notUsefulCount: number;
  dismissedCount: number;
  /** Percentual de feedbacks "útil" (0-100) */
  usefulRate: number;
  /** Padrões detectados por tipo de mensagem */
  patternsByPrefix: Record<string, { useful: number; total: number }>;
};

export class FeedbackLoop {
  private entries: FeedbackEntry[] = [];

  /**
   * Registra feedback de um operador sobre uma mensagem.
   */
  record(entry: FeedbackEntry): void {
    this.entries.push(entry);
  }

  /**
   * Retorna estatísticas agregadas de feedback.
   */
  getStats(): FeedbackStats {
    const total = this.entries.length;
    const useful = this.entries.filter((e) => e.rating === "useful").length;
    const notUseful = this.entries.filter(
      (e) => e.rating === "not_useful",
    ).length;
    const dismissed = this.entries.filter(
      (e) => e.rating === "dismissed",
    ).length;

    return {
      totalFeedback: total,
      usefulCount: useful,
      notUsefulCount: notUseful,
      dismissedCount: dismissed,
      usefulRate: total > 0 ? Math.round((useful / total) * 100) : 0,
      patternsByPrefix: this.analyzePatterns(),
    };
  }

  /**
   * Verifica se um tipo de mensagem (por prefixo de ID) tende a ser útil ou não.
   * Útil para auto-ajuste: suprimir padrões com taxa de aprovação < 30%.
   */
  shouldSuppressPattern(prefix: string): boolean {
    const patterns = this.analyzePatterns();
    const pattern = patterns[prefix];
    if (!pattern || pattern.total < 3) return false; // pouco dado
    return pattern.useful / pattern.total < 0.3;
  }

  /**
   * Retorna todas as entradas de feedback (para exportação/análise).
   */
  getEntries(): FeedbackEntry[] {
    return [...this.entries];
  }

  /**
   * Limpa feedback antigo (> 30 dias).
   */
  prune(olderThanMs: number = 30 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.entries = this.entries.filter((e) => e.timestamp > cutoff);
  }

  private analyzePatterns(): Record<string, { useful: number; total: number }> {
    const patterns: Record<string, { useful: number; total: number }> = {};

    for (const entry of this.entries) {
      // Extrai prefixo do messageId: "sla-xxx" → "sla", "stock-yyy" → "stock"
      const prefix = entry.messageId.split("-")[0];
      if (!patterns[prefix]) {
        patterns[prefix] = { useful: 0, total: 0 };
      }
      patterns[prefix].total++;
      if (entry.rating === "useful") {
        patterns[prefix].useful++;
      }
    }

    return patterns;
  }
}
