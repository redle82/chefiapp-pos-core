/**
 * EmployeeProfileEngine - Engine de Perfil Operacional
 *
 * Gerencia perfis operacionais de funcionários
 * (velocidade, multitarefa, autonomia, confiabilidade)
 *
 * IMPORTANTE (PURE DOCKER / DEV_STABLE):
 * - Módulo `people` está marcado como dataSource: "mock" em `moduleCatalog`.
 * - Esta engine NÃO deve chamar Supabase nem RPCs reais.
 * - Implementação atual: store in-memory por sessão, suficiente para análise qualitativa.
 */
// @ts-nocheck


export interface EmployeeProfile {
  id: string;
  employeeId: string;
  restaurantId: string;
  speedRating: number; // 0.5-2.0
  multitaskCapability: number; // 0.5-2.0
  autonomyLevel: "low" | "medium" | "high";
  reliabilityScore: number; // 0-1.0
  totalTasksCompleted: number;
  totalTasksOnTime: number;
  totalTasksDelayed: number;
  averageTaskCompletionTime: number;
  averageDelayMinutes: number;
  learningCurveData: Array<{ date: string; performanceScore: number }>;
  currentPerformanceLevel: "beginner" | "intermediate" | "advanced" | "expert";
  impactScore: number;
}

type ProfileKey = string;

function makeKey(employeeId: string, restaurantId: string): ProfileKey {
  return `${restaurantId}::${employeeId}`;
}

const profilesStore = new Map<ProfileKey, EmployeeProfile>();

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `emp_profile_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export class EmployeeProfileEngine {
  /**
   * Criar ou atualizar perfil
   */
  async upsert(profile: {
    employeeId: string;
    restaurantId: string;
    speedRating?: number;
    multitaskCapability?: number;
    autonomyLevel?: "low" | "medium" | "high";
    reliabilityScore?: number;
  }): Promise<string> {
    const key = makeKey(profile.employeeId, profile.restaurantId);
    const existing = profilesStore.get(key);

    const now = new Date().toISOString();
    const base: EmployeeProfile =
      existing ?? {
        id: generateId(),
        employeeId: profile.employeeId,
        restaurantId: profile.restaurantId,
        speedRating: profile.speedRating ?? 1.0,
        multitaskCapability: profile.multitaskCapability ?? 1.0,
        autonomyLevel: profile.autonomyLevel ?? "medium",
        reliabilityScore: profile.reliabilityScore ?? 0.8,
        totalTasksCompleted: 0,
        totalTasksOnTime: 0,
        totalTasksDelayed: 0,
        averageTaskCompletionTime: 0,
        averageDelayMinutes: 0,
        learningCurveData: [{ date: now, performanceScore: 0.8 }],
        currentPerformanceLevel: "intermediate",
        impactScore: 0,
      };

    const merged: EmployeeProfile = {
      ...base,
      speedRating: profile.speedRating ?? base.speedRating,
      multitaskCapability:
        profile.multitaskCapability ?? base.multitaskCapability,
      autonomyLevel: profile.autonomyLevel ?? base.autonomyLevel,
      reliabilityScore: profile.reliabilityScore ?? base.reliabilityScore,
    };

    merged.currentPerformanceLevel = this.calculatePerformanceLevel(merged);
    merged.impactScore = this.calculateImpactScore(merged);

    profilesStore.set(key, merged);
    return merged.id;
  }

  /**
   * Buscar perfil
   */
  async get(
    employeeId: string,
    restaurantId: string,
  ): Promise<EmployeeProfile | null> {
    const key = makeKey(employeeId, restaurantId);
    return profilesStore.get(key) ?? null;
  }

  /**
   * Listar perfis de um restaurante
   */
  async list(restaurantId: string): Promise<EmployeeProfile[]> {
    const all = Array.from(profilesStore.values()).filter(
      (p) => p.restaurantId === restaurantId,
    );
    return all.sort(
      (a, b) => b.reliabilityScore - a.reliabilityScore,
    );
  }

  /**
   * Atualizar perfil baseado em tarefa
   */
  async updateFromTask(
    employeeId: string,
    restaurantId: string,
    taskId: string,
    completedAt: Date,
    wasOnTime: boolean,
    delayMinutes: number = 0,
  ): Promise<void> {
    const key = makeKey(employeeId, restaurantId);
    const existing = profilesStore.get(key);
    if (!existing) {
      // Se não existir, cria um perfil básico primeiro.
      await this.upsert({ employeeId, restaurantId });
    }

    const profile = profilesStore.get(key)!;

    const totalTasksCompleted = profile.totalTasksCompleted + 1;
    const totalTasksOnTime = profile.totalTasksOnTime + (wasOnTime ? 1 : 0);
    const totalTasksDelayed = profile.totalTasksDelayed + (wasOnTime ? 0 : 1);

    const totalDelayMinutes =
      profile.averageDelayMinutes * profile.totalTasksDelayed + delayMinutes;
    const newAverageDelayMinutes =
      totalTasksDelayed > 0 ? totalDelayMinutes / totalTasksDelayed : 0;

    const updated: EmployeeProfile = {
      ...profile,
      totalTasksCompleted,
      totalTasksOnTime,
      totalTasksDelayed,
      averageDelayMinutes: newAverageDelayMinutes,
      learningCurveData: [
        ...profile.learningCurveData,
        {
          date: completedAt.toISOString(),
          performanceScore: wasOnTime ? 1 : Math.max(0.4, 1 - delayMinutes / 60),
        },
      ],
    };

    updated.currentPerformanceLevel = this.calculatePerformanceLevel(updated);
    updated.impactScore = this.calculateImpactScore(updated);

    profilesStore.set(key, updated);
  }

  /**
   * Calcular nível de performance atual
   */
  calculatePerformanceLevel(
    profile: EmployeeProfile,
  ): "beginner" | "intermediate" | "advanced" | "expert" {
    const score =
      profile.reliabilityScore *
      profile.speedRating *
      profile.multitaskCapability;

    if (score >= 1.5) return "expert";
    if (score >= 1.2) return "advanced";
    if (score >= 0.8) return "intermediate";
    return "beginner";
  }

  /**
   * Calcular score de impacto
   */
  calculateImpactScore(profile: EmployeeProfile): number {
    const reliabilityWeight = 0.4;
    const speedWeight = 0.3;
    const multitaskWeight = 0.2;
    const autonomyWeight = 0.1;

    const autonomyScore =
      profile.autonomyLevel === "high"
        ? 1.0
        : profile.autonomyLevel === "medium"
        ? 0.7
        : 0.4;

    return (
      (profile.reliabilityScore * reliabilityWeight +
        profile.speedRating * speedWeight +
        profile.multitaskCapability * multitaskWeight +
        autonomyScore * autonomyWeight) *
      100
    );
  }

  // mapToProfile removido – armazenamento agora é puramente in-memory.
}

export const employeeProfileEngine = new EmployeeProfileEngine();
