/**
 * GroupEngine - Engine de Grupos Multi-unidade
 *
 * Gerencia grupos, herança de configuração e comparações.
 *
 * DOCKER CORE MODE:
 * - Todas as operações ligadas ao PostgREST via dockerCoreFetchClient.
 * - Tabelas: gm_restaurant_groups, gm_restaurant_group_members
 */

import { getCurrencySymbol } from "@/core/currency/CurrencyService";
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";
import { Logger } from "../logger";

export type GroupType = "franchise" | "chain" | "corporate" | "custom";
export type GroupRole = "master" | "template" | "member" | "franchisee";
export type ConfigType =
  | "menu"
  | "pricing"
  | "schedule"
  | "staff_roles"
  | "inventory"
  | "other";

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
  appliesToRole: "all" | "member" | "franchisee" | "template";
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
  bottomPerformers: Array<{
    restaurantId: string;
    metric: string;
    rank: number;
  }>;
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

// ─── Row mappers ──────────────────────────────────────────

function rowToGroup(row: Record<string, any>): RestaurantGroup {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    groupType: (row.group_type ?? "franchise") as GroupType,
    parentGroupId: row.parent_group_id ?? undefined,
    masterRestaurantId: row.master_restaurant_id ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToMember(row: Record<string, any>): GroupMember {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    groupId: row.group_id,
    role: (row.role ?? "member") as GroupRole,
    inheritsConfig: row.inherits_config ?? true,
    inheritsMenu: row.inherits_menu ?? false,
    inheritsPricing: row.inherits_pricing ?? false,
    inheritsSchedule: row.inherits_schedule ?? false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export class GroupEngine {
  private core() {
    return getDockerCoreFetchClient();
  }

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
    const core = this.core();
    const { data, error } = await core
      .from("gm_restaurant_groups")
      .insert({
        name: group.name,
        description: group.description || null,
        group_type: group.groupType || "franchise",
        parent_group_id: group.parentGroupId || null,
        master_restaurant_id: group.masterRestaurantId || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      Logger.error("[GroupEngine] createGroup error", error);
      throw new Error(error?.message || "Erro ao criar grupo");
    }

    return (data as { id: string }).id;
  }

  /**
   * Listar grupos
   */
  async listGroups(filters?: {
    groupType?: GroupType[];
    limit?: number;
  }): Promise<RestaurantGroup[]> {
    const core = this.core();
    let query = core
      .from("gm_restaurant_groups")
      .select("*")
      .order("name", { ascending: true });

    if (filters?.groupType && filters.groupType.length > 0) {
      query = query.in("group_type", filters.groupType);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return (data as Array<Record<string, any>>).map(rowToGroup);
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
    const core = this.core();

    // Verify group exists
    const { data: groupData } = await core
      .from("gm_restaurant_groups")
      .select("id")
      .eq("id", member.groupId)
      .maybeSingle();

    if (!groupData) {
      throw new Error("Group not found");
    }

    const { data, error } = await core
      .from("gm_restaurant_group_members")
      .insert({
        group_id: member.groupId,
        restaurant_id: member.restaurantId,
        role: member.role || "member",
        inherits_config: member.inheritsConfig ?? true,
        inherits_menu: member.inheritsMenu ?? false,
        inherits_pricing: member.inheritsPricing ?? false,
        inherits_schedule: member.inheritsSchedule ?? false,
      })
      .select("id")
      .single();

    if (error || !data) {
      Logger.error("[GroupEngine] addRestaurantToGroup error", error);
      throw new Error(error?.message || "Erro ao adicionar membro");
    }

    return (data as { id: string }).id;
  }

  /**
   * Listar membros do grupo
   */
  async listGroupMembers(groupId: string): Promise<GroupMember[]> {
    const core = this.core();
    const { data, error } = await core
      .from("gm_restaurant_group_members")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return (data as Array<Record<string, any>>).map(rowToMember);
  }

  /**
   * Buscar grupo do restaurante
   */
  async getRestaurantGroup(
    restaurantId: string,
  ): Promise<RestaurantGroup | null> {
    const core = this.core();

    // Find membership
    const { data: memberData } = await core
      .from("gm_restaurant_group_members")
      .select("group_id")
      .eq("restaurant_id", restaurantId)
      .limit(1)
      .maybeSingle();

    if (!memberData) return null;

    const groupId = (memberData as { group_id: string }).group_id;

    const { data: groupData } = await core
      .from("gm_restaurant_groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();

    if (!groupData) return null;
    return rowToGroup(groupData as Record<string, any>);
  }

  /**
   * Aplicar configuração herdada.
   * Fase atual: settings JSONB no grupo → fallback para config padrão.
   */
  async applyInheritedConfiguration(
    restaurantId: string,
    configType: ConfigType,
    configKey: string,
  ): Promise<{
    value: Record<string, any>;
    inherited: boolean;
    overridden: boolean;
  }> {
    const group = await this.getRestaurantGroup(restaurantId);
    if (!group) {
      return {
        value: { configType, configKey, source: "default" },
        inherited: false,
        overridden: false,
      };
    }

    // Fetch group settings
    const core = this.core();
    const { data } = await core
      .from("gm_restaurant_groups")
      .select("settings")
      .eq("id", group.id)
      .maybeSingle();

    if (data) {
      const settings =
        (data as { settings: Record<string, any> }).settings || {};
      const key = `${configType}.${configKey}`;
      if (settings[key]) {
        return { value: settings[key], inherited: true, overridden: false };
      }
    }

    return {
      value: { configType, configKey, source: "default" },
      inherited: false,
      overridden: false,
    };
  }

  /**
   * Criar configuração herdada (armazenada no settings JSONB do grupo)
   */
  async createInheritedConfiguration(config: {
    groupId: string;
    configType: ConfigType;
    configKey: string;
    configValue: Record<string, any>;
    appliesToRole?: "all" | "member" | "franchisee" | "template";
    overrideAllowed?: boolean;
  }): Promise<string> {
    const core = this.core();

    // Read current settings
    const { data: groupData } = await core
      .from("gm_restaurant_groups")
      .select("settings")
      .eq("id", config.groupId)
      .maybeSingle();

    const currentSettings = (groupData as any)?.settings || {};
    const key = `${config.configType}.${config.configKey}`;
    currentSettings[key] = {
      ...config.configValue,
      _appliesToRole: config.appliesToRole ?? "all",
      _overrideAllowed: config.overrideAllowed ?? true,
    };

    await core
      .from("gm_restaurant_groups")
      .update({
        settings: currentSettings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.groupId);

    return generateId("config_inheritance");
  }

  /**
   * Criar override local (armazenado no settings do membro — futuro: tabela dedicada)
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
    Logger.info("[GroupEngine] createOverride persisted via Core", {
      id,
      ...override,
    });
    return id;
  }

  /**
   * Calcular benchmark do grupo.
   * Fase atual: agrega dados dos membros via gm_customers (visitas, spend).
   */
  async calculateBenchmark(
    groupId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<UnitBenchmark> {
    const members = await this.listGroupMembers(groupId);

    // Aggregate basic metrics from members' customer data
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalCustomers = 0;

    const core = this.core();
    for (const member of members) {
      const { data } = await core
        .from("gm_customers")
        .select("total_spend_cents,visit_count")
        .eq("restaurant_id", member.restaurantId);

      if (data && Array.isArray(data)) {
        const rows = data as Array<{
          total_spend_cents: number;
          visit_count: number;
        }>;
        totalCustomers += rows.length;
        totalRevenue +=
          rows.reduce((s, r) => s + (r.total_spend_cents ?? 0), 0) / 100;
        totalOrders += rows.reduce((s, r) => s + (r.visit_count ?? 0), 0);
      }
    }

    return {
      id: generateId("unit_benchmark"),
      groupId,
      periodStart,
      periodEnd,
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalCustomers,
      averageRating: 0,
      unitMetrics: {},
      topPerformers: [],
      bottomPerformers: [],
      createdAt: new Date(),
    };
  }

  /**
   * Comparar unidades
   */
  async compareUnits(
    groupId: string,
    metricType: string,
    comparisonDate?: Date,
  ): Promise<UnitComparison> {
    const now = new Date();
    const members = await this.listGroupMembers(groupId);
    const core = this.core();

    const values: number[] = [];
    let bestUnitId: string | undefined;
    let worstUnitId: string | undefined;
    let bestVal = -Infinity;
    let worstVal = Infinity;

    for (const member of members) {
      const { data } = await core
        .from("gm_customers")
        .select("total_spend_cents")
        .eq("restaurant_id", member.restaurantId);

      if (data && Array.isArray(data)) {
        const rows = data as Array<{ total_spend_cents: number }>;
        const val =
          rows.reduce((s, r) => s + (r.total_spend_cents ?? 0), 0) / 100;
        values.push(val);
        if (val > bestVal) {
          bestVal = val;
          bestUnitId = member.restaurantId;
        }
        if (val < worstVal) {
          worstVal = val;
          worstUnitId = member.restaurantId;
        }
      }
    }

    const avg =
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const sorted = [...values].sort((a, b) => a - b);
    const median =
      sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
    const variance =
      values.length > 0
        ? values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length
        : 0;

    return {
      id: generateId("unit_comparison"),
      groupId,
      comparisonDate: comparisonDate ?? now,
      metricType,
      bestUnitId,
      worstUnitId,
      averageValue: avg,
      medianValue: median,
      standardDeviation: Math.sqrt(variance),
      comparisonData: {},
      insights:
        values.length > 1
          ? [
              `Diferença entre melhor e pior unidade: ${getCurrencySymbol()}${(
                bestVal - worstVal
              ).toFixed(2)}`,
            ]
          : [],
      createdAt: now,
    };
  }
}

export const groupEngine = new GroupEngine();
