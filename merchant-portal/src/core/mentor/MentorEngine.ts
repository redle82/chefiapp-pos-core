/**
 * MentorEngine - Engine de Mentoria IA
 *
 * Analisa o sistema e gera sugestões, recomendações e orientações.
 *
 * IMPORTANTE (PURE DOCKER / DEV_STABLE):
 * - Módulo `mentor` está marcado como dataSource: "mock" em `moduleCatalog`.
 * - Esta engine NÃO deve chamar Supabase nem RPCs reais.
 * - Implementação atual: store in-memory por sessão, suficiente para narrativa de mentoria.
 */
import { alertEngine } from "../alerts/AlertEngine";
import { healthEngine } from "../health/HealthEngine";

export type SuggestionType =
  | "optimization"
  | "alert"
  | "evolution"
  | "task"
  | "system";
export type SuggestionCategory =
  | "operational"
  | "financial"
  | "human"
  | "system"
  | "growth";
export type SuggestionPriority = "low" | "medium" | "high" | "critical";
export type SuggestionStatus =
  | "pending"
  | "acknowledged"
  | "applied"
  | "dismissed"
  | "expired";

export interface MentorSuggestion {
  id: string;
  restaurantId: string;
  suggestionType: SuggestionType;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  title: string;
  message: string;
  details: Record<string, any>;
  reasoning?: string;
  status: SuggestionStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  appliedAt?: Date;
  dismissedAt?: Date;
  dismissedReason?: string;
  context: Record<string, any>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type RecommendationType =
  | "install_module"
  | "optimize_config"
  | "add_feature"
  | "improve_health"
  | "scale_operation";
export type RecommendationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "postponed";
export type EstimatedImpact = "low" | "medium" | "high" | "transformative";

export interface MentorRecommendation {
  id: string;
  restaurantId: string;
  recommendationType: RecommendationType;
  target: string;
  title: string;
  description: string;
  benefits: string[];
  requirements: string[];
  estimatedImpact: EstimatedImpact;
  status: RecommendationStatus;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectedReason?: string;
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

type SuggestionKey = string;
type RecommendationKey = string;

const suggestionsStore = new Map<SuggestionKey, MentorSuggestion>();
const recommendationsStore = new Map<RecommendationKey, MentorRecommendation>();
const mentorConfigStore = new Map<string, MentorConfig>(); // por restaurantId

function generateId(prefix: string): string {
  // UUID simplificado para ambiente mock; evita depender de globals específicos.
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export interface MentorConfig {
  id: string;
  restaurantId: string;
  mentorActive: boolean;
  mentorTone: "friendly" | "professional" | "direct" | "supportive";
  mentorFrequency: "minimal" | "moderate" | "frequent" | "aggressive";
  mentorAuthority: "suggestive" | "advisory" | "directive";
  categoriesEnabled: SuggestionCategory[];
  minPriority: SuggestionPriority;
}

export class MentorEngine {
  /**
   * Criar sugestão
   */
  async createSuggestion(suggestion: {
    restaurantId: string;
    suggestionType: SuggestionType;
    title: string;
    message: string;
    category?: SuggestionCategory;
    priority?: SuggestionPriority;
    details?: Record<string, any>;
    reasoning?: string;
    context?: Record<string, any>;
    relatedEntityType?: string;
    relatedEntityId?: string;
    expiresAt?: Date;
  }): Promise<string> {
    const id = generateId("mentor_suggestion");
    const now = new Date();

    const entry: MentorSuggestion = {
      id,
      restaurantId: suggestion.restaurantId,
      suggestionType: suggestion.suggestionType,
      category: suggestion.category || "operational",
      priority: suggestion.priority || "medium",
      title: suggestion.title,
      message: suggestion.message,
      details: suggestion.details || {},
      reasoning: suggestion.reasoning,
      status: "pending",
      context: suggestion.context || {},
      relatedEntityType: suggestion.relatedEntityType,
      relatedEntityId: suggestion.relatedEntityId,
      expiresAt: suggestion.expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    suggestionsStore.set(id, entry);
    return id;
  }

  /**
   * Listar sugestões
   */
  async listSuggestions(
    restaurantId: string,
    filters?: {
      status?: SuggestionStatus[];
      category?: SuggestionCategory[];
      priority?: SuggestionPriority[];
      limit?: number;
    },
  ): Promise<MentorSuggestion[]> {
    let items = Array.from(suggestionsStore.values()).filter(
      (s) => s.restaurantId === restaurantId,
    );

    if (filters?.status && filters.status.length > 0) {
      items = items.filter((s) => filters.status!.includes(s.status));
    }

    if (filters?.category && filters.category.length > 0) {
      items = items.filter((s) => filters.category!.includes(s.category));
    }

    if (filters?.priority && filters.priority.length > 0) {
      items = items.filter((s) => filters.priority!.includes(s.priority));
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (filters?.limit) {
      items = items.slice(0, filters.limit);
    }

    return items;
  }

  /**
   * Atualizar status da sugestão
   */
  async updateSuggestionStatus(
    suggestionId: string,
    newStatus: SuggestionStatus,
    actorId?: string,
    notes?: string,
  ): Promise<void> {
    const existing = suggestionsStore.get(suggestionId);
    if (!existing) {
      console.warn(
        "[MentorEngine] updateSuggestionStatus: sugestão não encontrada",
        suggestionId,
      );
      return;
    }

    const now = new Date();
    const updated: MentorSuggestion = {
      ...existing,
      status: newStatus,
      updatedAt: now,
      acknowledgedBy: actorId ?? existing.acknowledgedBy,
      acknowledgedAt:
        newStatus === "acknowledged" ? now : existing.acknowledgedAt,
      appliedAt: newStatus === "applied" ? now : existing.appliedAt,
      dismissedAt: newStatus === "dismissed" ? now : existing.dismissedAt,
      dismissedReason:
        newStatus === "dismissed" ? notes : existing.dismissedReason,
    };

    suggestionsStore.set(suggestionId, updated);
  }

  /**
   * Criar recomendação
   */
  async createRecommendation(recommendation: {
    restaurantId: string;
    recommendationType: RecommendationType;
    target: string;
    title: string;
    description: string;
    benefits?: string[];
    requirements?: string[];
    estimatedImpact?: EstimatedImpact;
    context?: Record<string, any>;
  }): Promise<string> {
    const id = generateId("mentor_recommendation");
    const now = new Date();

    const entry: MentorRecommendation = {
      id,
      restaurantId: recommendation.restaurantId,
      recommendationType: recommendation.recommendationType,
      target: recommendation.target,
      title: recommendation.title,
      description: recommendation.description,
      benefits: recommendation.benefits || [],
      requirements: recommendation.requirements || [],
      estimatedImpact: recommendation.estimatedImpact || "medium",
      status: "pending",
      context: recommendation.context || {},
      createdAt: now,
      updatedAt: now,
    };

    recommendationsStore.set(id, entry);
    return id;
  }

  /**
   * Listar recomendações
   */
  async listRecommendations(
    restaurantId: string,
    filters?: {
      status?: RecommendationStatus[];
      limit?: number;
    },
  ): Promise<MentorRecommendation[]> {
    let items = Array.from(recommendationsStore.values()).filter(
      (r) => r.restaurantId === restaurantId,
    );

    if (filters?.status && filters.status.length > 0) {
      items = items.filter((r) => filters.status!.includes(r.status));
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (filters?.limit) {
      items = items.slice(0, filters.limit);
    }

    return items;
  }

  /**
   * Atualizar status da recomendação
   */
  async updateRecommendationStatus(
    recommendationId: string,
    newStatus: RecommendationStatus,
    actorId?: string,
    notes?: string,
  ): Promise<void> {
    const existing = recommendationsStore.get(recommendationId);
    if (!existing) {
      console.warn(
        "[MentorEngine] updateRecommendationStatus: recomendação não encontrada",
        recommendationId,
      );
      return;
    }

    const now = new Date();
    const updated: MentorRecommendation = {
      ...existing,
      status: newStatus,
      updatedAt: now,
      acceptedAt: newStatus === "accepted" ? now : existing.acceptedAt,
      rejectedAt: newStatus === "rejected" ? now : existing.rejectedAt,
      rejectedReason:
        newStatus === "rejected" ? notes : existing.rejectedReason,
    };

    recommendationsStore.set(recommendationId, updated);
  }

  /**
   * Analisar sistema e gerar sugestões automaticamente
   */
  async analyzeAndSuggest(restaurantId: string): Promise<{
    suggestionsCreated: number;
    healthScore: any;
    activeAlerts: number;
    pendingTasks: number;
  }> {
    // PURE DOCKER / DEV_STABLE:
    // Em vez de RPC, usamos healthEngine + alertEngine diretamente.
    const healthScore = await healthEngine.getCurrentHealthScore(restaurantId);
    const activeAlerts = await alertEngine.getActive(restaurantId);

    // Em PURE DOCKER / DEV_STABLE não dependemos ainda do TaskReader real aqui.
    // Mantemos pendingTasks como métrica mock para não travar o bundle.
    const pendingTasks = 0;

    if (healthScore && healthScore.overallScore < 0.7) {
      await this.createSuggestion({
        restaurantId,
        suggestionType: "optimization",
        title: "Melhorar saúde operacional",
        message:
          "Seu score de saúde está abaixo do ideal. Considere revisar gargalos operacionais.",
        category: "operational",
        priority: "high",
        details: { overallScore: healthScore.overallScore },
        context: { source: "analyzeAndSuggest" },
      });
    }

    if (activeAlerts.length > 0) {
      await this.createSuggestion({
        restaurantId,
        suggestionType: "alert",
        title: "Alertas ativos na operação",
        message: "Há alertas ativos que precisam de atenção.",
        category: "system",
        priority: "medium",
        details: { activeAlerts: activeAlerts.length },
        context: { source: "analyzeAndSuggest" },
      });
    }

    return {
      suggestionsCreated: suggestionsStore.size,
      healthScore,
      activeAlerts: activeAlerts.length,
      pendingTasks,
    };
  }

  /**
   * Buscar configuração da mentoria
   */
  async getConfig(restaurantId: string): Promise<MentorConfig | null> {
    const existing = mentorConfigStore.get(restaurantId);
    if (existing) return existing;
    return null;
  }

  /**
   * Criar ou atualizar configuração
   */
  async upsertConfig(config: {
    restaurantId: string;
    mentorActive?: boolean;
    mentorTone?: "friendly" | "professional" | "direct" | "supportive";
    mentorFrequency?: "minimal" | "moderate" | "frequent" | "aggressive";
    mentorAuthority?: "suggestive" | "advisory" | "directive";
    categoriesEnabled?: SuggestionCategory[];
    minPriority?: SuggestionPriority;
  }): Promise<void> {
    const current: MentorConfig = mentorConfigStore.get(
      config.restaurantId,
    ) ?? {
      id: generateId("mentor_config"),
      restaurantId: config.restaurantId,
      mentorActive: true,
      mentorTone: "professional",
      mentorFrequency: "moderate",
      mentorAuthority: "suggestive",
      categoriesEnabled: [
        "operational",
        "financial",
        "human",
        "system",
        "growth",
      ],
      minPriority: "low",
    };

    const updated: MentorConfig = {
      ...current,
      mentorActive: config.mentorActive ?? current.mentorActive,
      mentorTone: config.mentorTone ?? current.mentorTone,
      mentorFrequency: config.mentorFrequency ?? current.mentorFrequency,
      mentorAuthority: config.mentorAuthority ?? current.mentorAuthority,
      categoriesEnabled: config.categoriesEnabled ?? current.categoriesEnabled,
      minPriority: config.minPriority ?? current.minPriority,
    };

    mentorConfigStore.set(config.restaurantId, updated);
  }

  /**
   * Gerar recomendações baseadas no estado do sistema
   */
  async generateRecommendations(restaurantId: string): Promise<string[]> {
    const recommendations: string[] = [];

    // Buscar health score
    const healthScore = await healthEngine.getCurrentHealthScore(restaurantId);
    if (healthScore && healthScore.overallScore < 0.7) {
      recommendations.push(
        await this.createRecommendation({
          restaurantId,
          recommendationType: "improve_health",
          target: "health_score",
          title: "Melhorar Saúde do Restaurante",
          description:
            "O score de saúde está abaixo do ideal. Considere revisar operações, pessoas e finanças.",
          benefits: [
            "Melhor performance operacional",
            "Redução de custos",
            "Maior satisfação",
          ],
          requirements: ["Revisar métricas de saúde", "Identificar gargalos"],
          estimatedImpact: "high",
          context: { currentScore: healthScore.overallScore },
        }),
      );
    }

    // Buscar módulos instalados — em PURE DOCKER já temos isso no runtime/Core.
    let installedModuleIds: string[] = [];
    try {
      const { RestaurantRuntimeContext } = await import(
        "../../context/RestaurantRuntimeContext"
      );
      // Em tempo de execução real isso viria via hook/context; aqui focamos em demo,
      // então usamos um default seguro com TPV ausente.
      installedModuleIds = ["tasks", "health", "dashboard"];
    } catch {
      installedModuleIds = ["tasks", "health", "dashboard"];
    }

    // Recomendar TPV se não estiver instalado
    if (!installedModuleIds.includes("tpv")) {
      recommendations.push(
        await this.createRecommendation({
          restaurantId,
          recommendationType: "install_module",
          target: "tpv",
          title: "Instalar Módulo TPV",
          description:
            "O módulo TPV permite gerenciar pedidos e vendas de forma integrada.",
          benefits: [
            "Gestão de pedidos",
            "Controle de vendas",
            "Integração com KDS",
          ],
          requirements: ["Restaurante publicado"],
          estimatedImpact: "transformative",
          context: { missingModule: "tpv" },
        }),
      );
    }

    return recommendations;
  }
}

export const mentorEngine = new MentorEngine();
