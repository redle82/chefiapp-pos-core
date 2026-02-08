/**
 * GroupEngine - Engine de Grupos Multi-unidade
 *
 * Gerencia grupos, herança de configuração e comparações.
 *
 * IMPORTANTE (PURE DOCKER / DEV_STABLE):
 * - Módulo `groups` está marcado como dataSource: "mock" em `moduleCatalog`.
 * - Esta engine NÃO deve chamar Supabase nem RPCs reais.
 * - Implementação atual: store in-memory por sessão, suficiente para narrativa multi-unidade.
 */

export type GroupType = 'franchise' | 'chain' | 'corporate' | 'custom';
export type GroupRole = 'master' | 'template' | 'member' | 'franchisee';
export type ConfigType = 'menu' | 'pricing' | 'schedule' | 'staff_roles' | 'inventory' | 'other';

export interface RestaurantGroup {
  id: string;
  name: string;
  description?: string;
  groupType: GroupType;
  parentGroupId?: string;
  masterRestaurantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  restaurantId: string;
  groupId: string;
  role: GroupRole;
  inheritsConfig: boolean;
  inheritsMenu: boolean;
  inheritsPricing: boolean;
  inheritsSchedule: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigurationInheritance {
  id: string;
  groupId: string;
  configType: ConfigType;
  configKey: string;
  configValue: Record<string, any>;
  appliesToRole: 'all' | 'member' | 'franchisee' | 'template';
  overrideAllowed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigurationOverride {
  id: string;
  restaurantId: string;
  inheritedConfigId?: string;
  configType: ConfigType;
  configKey: string;
  overrideValue: Record<string, any>;
  overrideReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnitBenchmark {
  id: string;
  groupId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  averageRating: number;
  unitMetrics: Record<string, any>;
  topPerformers: Array<{ restaurantId: string; metric: string; rank: number }>;
  bottomPerformers: Array<{ restaurantId: string; metric: string; rank: number }>;
  createdAt: Date;
}

export interface UnitComparison {
  id: string;
  groupId: string;
  comparisonDate: Date;
  metricType: string;
  bestUnitId?: string;
  worstUnitId?: string;
  averageValue: number;
  medianValue: number;
  standardDeviation: number;
  comparisonData: Record<string, any>;
  insights: string[];
  createdAt: Date;
}

const groupsStore = new Map<string, RestaurantGroup>();
const groupMembersStore = new Map<string, GroupMember[]>(); // key: groupId
const unitBenchmarksStore = new Map<string, UnitBenchmark>(); // key: groupId::period
const unitComparisonsStore = new Map<string, UnitComparison>(); // key: groupId::metricType

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export class GroupEngine {
  /**
   * Criar grupo
   */
  async createGroup(group: {
    name: string;
    description?: string;
    groupType?: GroupType;
    parentGroupId?: string;
    masterRestaurantId?: string;
  }): Promise<string> {
    const id = generateId("restaurant_group");
    const now = new Date();

    const entry: RestaurantGroup = {
      id,
      name: group.name,
      description: group.description,
      groupType: group.groupType || "franchise",
      parentGroupId: group.parentGroupId,
      masterRestaurantId: group.masterRestaurantId,
      createdAt: now,
      updatedAt: now,
    };

    groupsStore.set(id, entry);
    groupMembersStore.set(id, []);
    return id;
  }

  /**
   * Listar grupos
   */
  async listGroups(filters?: {
    groupType?: GroupType[];
    limit?: number;
  }): Promise<RestaurantGroup[]> {
    let groups = Array.from(groupsStore.values());

    if (filters?.groupType && filters.groupType.length > 0) {
      groups = groups.filter((g) => filters.groupType!.includes(g.groupType));
    }

    groups.sort((a, b) => a.name.localeCompare(b.name));

    if (filters?.limit) {
      groups = groups.slice(0, filters.limit);
    }

    return groups;
  }

  /**
   * Adicionar restaurante ao grupo
   */
  async addRestaurantToGroup(member: {
    restaurantId: string;
    groupId: string;
    role?: GroupRole;
    inheritsConfig?: boolean;
    inheritsMenu?: boolean;
    inheritsPricing?: boolean;
    inheritsSchedule?: boolean;
  }): Promise<string> {
    const group = groupsStore.get(member.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const id = generateId("group_member");
    const now = new Date();

    const entry: GroupMember = {
      id,
      restaurantId: member.restaurantId,
      groupId: member.groupId,
      role: member.role || "member",
      inheritsConfig: member.inheritsConfig ?? true,
      inheritsMenu: member.inheritsMenu ?? false,
      inheritsPricing: member.inheritsPricing ?? false,
      inheritsSchedule: member.inheritsSchedule ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const members = groupMembersStore.get(member.groupId) ?? [];
    members.push(entry);
    groupMembersStore.set(member.groupId, members);

    return id;
  }

  /**
   * Listar membros do grupo
   */
  async listGroupMembers(groupId: string): Promise<GroupMember[]> {
    const members = groupMembersStore.get(groupId) ?? [];
    return [...members].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  /**
   * Buscar grupo do restaurante
   */
  async getRestaurantGroup(restaurantId: string): Promise<RestaurantGroup | null> {
    for (const group of groupsStore.values()) {
      const members = groupMembersStore.get(group.id) ?? [];
      if (members.some((m) => m.restaurantId === restaurantId)) {
        return group;
      }
    }
    return null;
  }

  /**
   * Aplicar configuração herdada
   */
  async applyInheritedConfiguration(
    restaurantId: string,
    configType: ConfigType,
    configKey: string
  ): Promise<{
    value: Record<string, any>;
    inherited: boolean;
    overridden: boolean;
  }> {
    // Em modo mock, apenas devolve uma configuração sintética.
    return {
      value: { configType, configKey, source: "mock" },
      inherited: true,
      overridden: false,
    };
  }

  /**
   * Criar configuração herdada
   */
  async createInheritedConfiguration(config: {
    groupId: string;
    configType: ConfigType;
    configKey: string;
    configValue: Record<string, any>;
    appliesToRole?: 'all' | 'member' | 'franchisee' | 'template';
    overrideAllowed?: boolean;
  }): Promise<string> {
    // Em modo mock, não persistimos inheritance detalhada.
    const id = generateId("config_inheritance");
    console.info("[GroupEngine] createInheritedConfiguration (mock)", {
      id,
      ...config,
    });
    return id;
  }

  /**
   * Criar override local
   */
  async createOverride(override: {
    restaurantId: string;
    inheritedConfigId?: string;
    configType: ConfigType;
    configKey: string;
    overrideValue: Record<string, any>;
    overrideReason?: string;
  }): Promise<string> {
    const id = generateId("config_override");
    console.info("[GroupEngine] createOverride (mock)", {
      id,
      ...override,
    });
    return id;
  }

  /**
   * Calcular benchmark do grupo
   */
  async calculateBenchmark(
    groupId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UnitBenchmark> {
    const key = `${groupId}::${periodStart.toISOString().split("T")[0]}::${periodEnd
      .toISOString()
      .split("T")[0]}`;

    const existing = unitBenchmarksStore.get(key);
    if (existing) return existing;

    const benchmark: UnitBenchmark = {
      id: generateId("unit_benchmark"),
      groupId,
      periodStart,
      periodEnd,
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalCustomers: 0,
      averageRating: 0,
      unitMetrics: {},
      topPerformers: [],
      bottomPerformers: [],
      createdAt: new Date(),
    };

    unitBenchmarksStore.set(key, benchmark);
    return benchmark;
  }

  /**
   * Comparar unidades
   */
  async compareUnits(
    groupId: string,
    metricType: string,
    comparisonDate?: Date
  ): Promise<UnitComparison> {
    const key = `${groupId}::${metricType}`;
    const now = new Date();

    const existing = unitComparisonsStore.get(key);
    if (existing) return existing;

    const comparison: UnitComparison = {
      id: generateId("unit_comparison"),
      groupId,
      comparisonDate: comparisonDate ?? now,
      metricType,
      bestUnitId: undefined,
      worstUnitId: undefined,
      averageValue: 0,
      medianValue: 0,
      standardDeviation: 0,
      comparisonData: {},
      insights: [],
      createdAt: now,
    };

    unitComparisonsStore.set(key, comparison);
    return comparison;
  }
}

export const groupEngine = new GroupEngine();
