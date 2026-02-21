// @ts-nocheck
// ContextAnalyzer.ts — Onda 6: Analisa contexto do restaurante para personalizar mensagens
// Perfil do operador + estado do ambiente + momento operacional

export type OperatorProfile = {
  role: "employee" | "manager" | "owner";
  experience: "beginner" | "experienced" | "overloaded";
  /** Turnos completados no restaurante */
  shiftsCompleted: number;
};

export type EnvironmentState = {
  /** Número de pedidos ativos agora */
  activeOrders: number;
  /** Staff em turno ativo */
  activeStaff: number;
  /** Hora atual (0-23) */
  currentHour: number;
  /** Dia da semana (0=dom, 6=sab) */
  dayOfWeek: number;
  /** Período de pico detectado */
  isPeakHour: boolean;
};

export type MentorContext = {
  operator: OperatorProfile;
  environment: EnvironmentState;
  /** Nível de urgência derivado: 0-1 */
  urgencyScore: number;
  /** Tipo de mentoria recomendado */
  recommendedMentorshipType:
    | "preventive"
    | "corrective"
    | "educational"
    | "strategic";
};

export class ContextAnalyzer {
  /**
   * Analisa o contexto atual e retorna um perfil completo de mentoria.
   */
  analyze(
    operator: OperatorProfile,
    env: Partial<EnvironmentState>,
  ): MentorContext {
    const environment = this.buildEnvironment(env);
    const urgencyScore = this.calculateUrgency(operator, environment);
    const recommendedMentorshipType = this.selectMentorshipType(
      operator,
      environment,
      urgencyScore,
    );

    return { operator, environment, urgencyScore, recommendedMentorshipType };
  }

  private buildEnvironment(
    partial: Partial<EnvironmentState>,
  ): EnvironmentState {
    const now = new Date();
    return {
      activeOrders: partial.activeOrders ?? 0,
      activeStaff: partial.activeStaff ?? 1,
      currentHour: partial.currentHour ?? now.getHours(),
      dayOfWeek: partial.dayOfWeek ?? now.getDay(),
      isPeakHour:
        partial.isPeakHour ??
        this.detectPeakHour(
          partial.currentHour ?? now.getHours(),
          partial.dayOfWeek ?? now.getDay(),
        ),
    };
  }

  private detectPeakHour(hour: number, _dayOfWeek: number): boolean {
    // Picos típicos de restaurante: 11-14h (almoço), 18-22h (jantar)
    return (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 22);
  }

  private calculateUrgency(
    operator: OperatorProfile,
    env: EnvironmentState,
  ): number {
    let score = 0;

    // Fator 1: proporção pedidos/staff
    const orderStaffRatio =
      env.activeStaff > 0
        ? env.activeOrders / env.activeStaff
        : env.activeOrders;
    if (orderStaffRatio > 5) score += 0.3;
    else if (orderStaffRatio > 3) score += 0.15;

    // Fator 2: horário de pico
    if (env.isPeakHour) score += 0.2;

    // Fator 3: experiência do operador
    if (operator.experience === "beginner") score += 0.15;
    if (operator.experience === "overloaded") score += 0.25;

    // Fator 4: poucos turnos de experiência
    if (operator.shiftsCompleted < 5) score += 0.1;

    return Math.min(1, score);
  }

  private selectMentorshipType(
    operator: OperatorProfile,
    env: EnvironmentState,
    urgencyScore: number,
  ): MentorContext["recommendedMentorshipType"] {
    // Alta urgência → corretiva
    if (urgencyScore >= 0.7) return "corrective";

    // Iniciante / poucos turnos → educativa
    if (operator.experience === "beginner" || operator.shiftsCompleted < 3) {
      return "educational";
    }

    // Dono fora de pico → estratégica
    if (operator.role === "owner" && !env.isPeakHour) {
      return "strategic";
    }

    // Default → preventiva
    return "preventive";
  }
}
