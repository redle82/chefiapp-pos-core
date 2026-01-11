/**
 * Phase 3 — Autonomous Rules System
 *
 * Allows restaurants to define rules that ChefIApp uses to automatically
 * accept/reject orders, adjust pricing, manage inventory, etc.
 *
 * Core principle: Rules are suggestions until explicitly approved by restaurant.
 * Once approved, ChefIApp auto-executes without further confirmation.
 */

import { UUID, ISOTimestamp } from '../shared/types';

/**
 * Rule Types: What ChefIApp can autonomously decide
 */
export enum AutonomousRuleType {
  ORDER_ACCEPTANCE = 'order_acceptance',
  PRICING = 'pricing',
  PROMOTION = 'promotion',
  INVENTORY = 'inventory',
  SCHEDULING = 'scheduling',
}

/**
 * Rule Condition: Logical expression that ChefIApp evaluates
 *
 * Examples:
 * - margin < 15% → auto-reject order
 * - demand > 80th percentile → increase price by 10%
 * - stock < reorder_level → auto-order from supplier
 */
export interface RuleCondition {
  field: string; // 'order.margin', 'forecast.demand', 'inventory.stock'
  operator: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'nin';
  value: string | number | boolean | string[];
  logicalOperator?: 'AND' | 'OR'; // For chaining conditions
}

/**
 * Rule Action: What ChefIApp does when condition is met
 */
export interface RuleAction {
  type: string; // 'reject_order', 'adjust_price', 'create_promotion', 'auto_order'
  parameters: Record<string, string | number | boolean>;
  confidence?: number; // 0–1, how confident ChefIApp is in this decision
}

/**
 * Core Autonomous Rule
 */
export interface AutonomousRule {
  id: UUID;
  restaurant_id: UUID;
  rule_type: AutonomousRuleType;
  name: string;
  description?: string;
  conditions: RuleCondition[]; // ALL must be true for rule to trigger
  action: RuleAction;
  priority: number; // 1–100, higher = execute first
  enabled: boolean;
  requires_approval: boolean; // If true, ChefIApp suggests but doesn't auto-execute
  auto_execute: boolean; // Once approved by restaurant, auto-execute without further confirmation
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

/**
 * Order Acceptance Rules (Sprint 1)
 *
 * ChefIApp can auto-accept or auto-reject orders based on margin, distance, time, etc.
 */
export interface OrderAcceptanceRule extends AutonomousRule {
  rule_type: AutonomousRuleType.ORDER_ACCEPTANCE;
  action: OrderAcceptanceAction;
}

export interface OrderAcceptanceAction extends RuleAction {
  type: 'auto_accept' | 'auto_reject';
  parameters: {
    reason?: string; // 'low_margin', 'too_far', 'kitchen_full'
    override_allowed?: boolean; // Can restaurant manually override?
  };
}

/**
 * Pricing Rules (Sprint 3)
 *
 * ChefIApp suggests or auto-adjusts prices based on:
 * - Margin target (e.g., "I want 32% margin")
 * - Demand forecast (high demand = higher price)
 * - Competitor prices (match/undercut)
 * - Time of day (happy hour discount, dinner premium)
 */
export interface PricingRule extends AutonomousRule {
  rule_type: AutonomousRuleType.PRICING;
  action: PricingAction;
}

export interface PricingAction extends RuleAction {
  type: 'suggest_price' | 'adjust_price' | 'apply_discount';
  parameters: {
    margin_target?: number; // e.g., 32 (percent)
    adjustment_percentage?: number; // e.g., +10% for high demand
    minimum_price?: number; // Floor price
    maximum_price?: number; // Ceiling price
    apply_to_items?: 'all' | 'category' | 'specific'; // Which items?
  };
}

/**
 * Inventory Rules (Sprint 2)
 *
 * ChefIApp auto-orders ingredients or removes items from menu
 * when stock levels hit threshold.
 */
export interface InventoryRule extends AutonomousRule {
  rule_type: AutonomousRuleType.INVENTORY;
  action: InventoryAction;
}

export interface InventoryAction extends RuleAction {
  type: 'auto_order' | 'remove_from_menu' | 'price_adjustment';
  parameters: {
    item_id?: UUID;
    supplier_id?: UUID;
    reorder_quantity?: number;
    auto_remove_at_quantity?: number; // If stock < this, remove from menu
  };
}

/**
 * Scheduling Rules (Sprint 4)
 *
 * ChefIApp auto-generates or adjusts staff schedules based on
 * demand forecast and staff availability.
 */
export interface SchedulingRule extends AutonomousRule {
  rule_type: AutonomousRuleType.SCHEDULING;
  action: SchedulingAction;
}

export interface SchedulingAction extends RuleAction {
  type: 'generate_schedule' | 'adjust_staffing' | 'notify_staff';
  parameters: {
    role?: 'kitchen' | 'counter' | 'delivery'; // Which roles?
    hours_needed?: number; // How many hours of coverage?
    on_demand_threshold?: number; // Call in extra staff if forecast > this
  };
}

/**
 * Rule Template: Pre-built rules for quick setup
 *
 * Examples:
 * - "Reject orders with margin < 15%"
 * - "Increase price by 10% during peak hours"
 * - "Auto-order flour when stock < 10kg"
 */
export interface RuleTemplate {
  id: UUID;
  name: string;
  description: string;
  rule_type: AutonomousRuleType;
  template_conditions: RuleCondition[];
  template_action: RuleAction;
  use_cases?: string[]; // "pizza_places", "fast_casual", "delivery"
  popularity_score?: number; // How many restaurants use this?
}

/**
 * Rule Decision Log: Audit trail of what ChefIApp decided
 */
export interface RuleDecisionLog {
  id: UUID;
  restaurant_id: UUID;
  order_id?: UUID; // Optional (not all rules apply to orders)
  rule_id: UUID;
  rule_name: string;
  suggested_action: RuleAction;
  actual_action?: RuleAction; // What actually happened (if overridden)
  was_overridden: boolean;
  override_reason?: string;
  confidence: number; // 0–1, how confident was ChefIApp?
  latency_ms: number; // How long did decision take?
  created_at: ISOTimestamp;
}

/**
 * Rule Validation: Checks rule is sensible before saving
 */
export interface RuleValidationError {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Autonomous Rules Service Interface
 */
export interface AutonomousRulesService {
  // CRUD
  createRule(input: CreateRuleInput): Promise<AutonomousRule>;
  getRule(ruleId: UUID): Promise<AutonomousRule | null>;
  listRules(restaurantId: UUID): Promise<AutonomousRule[]>;
  updateRule(ruleId: UUID, input: UpdateRuleInput): Promise<AutonomousRule>;
  deleteRule(ruleId: UUID): Promise<void>;

  // Rule Templates
  getTemplates(ruleType?: AutonomousRuleType): Promise<RuleTemplate[]>;
  createRuleFromTemplate(restaurantId: UUID, templateId: UUID): Promise<AutonomousRule>;

  // Validation
  validateRule(rule: Partial<AutonomousRule>): Promise<RuleValidationError[]>;

  // Execution
  evaluateRules(
    restaurantId: UUID,
    context: RuleEvaluationContext,
  ): Promise<RuleDecision[]>;

  // Audit
  getDecisionLog(restaurantId: UUID, limit?: number): Promise<RuleDecisionLog[]>;
  getDecisionLogForOrder(orderId: UUID): Promise<RuleDecisionLog[]>;
}

/**
 * Input/Output Contracts
 */

export interface CreateRuleInput {
  rule_type: AutonomousRuleType;
  name: string;
  description?: string;
  conditions: RuleCondition[];
  action: RuleAction;
  priority?: number;
  requires_approval?: boolean;
  auto_execute?: boolean;
}

export interface UpdateRuleInput {
  name?: string;
  description?: string;
  conditions?: RuleCondition[];
  action?: RuleAction;
  priority?: number;
  enabled?: boolean;
  requires_approval?: boolean;
  auto_execute?: boolean;
}

export interface RuleEvaluationContext {
  order?: {
    id: UUID;
    items: any[];
    margin: number;
    distance_km: number;
    customer_rating?: number;
  };
  restaurant?: {
    id: UUID;
    kitchen_load: number; // 0–1, how busy?
    forecast_demand: number; // Predicted orders in next hour
  };
  time?: {
    hour: number; // 0–23
    day_of_week: string;
    is_peak_hour: boolean;
  };
}

export interface RuleDecision {
  rule_id: UUID;
  rule_name: string;
  triggered: boolean;
  suggested_action?: RuleAction;
  confidence: number;
  explanation: string;
}

/**
 * Pre-built Rule Templates (Examples)
 */

export const DEFAULT_RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'template-001' as UUID,
    name: 'Reject Low-Margin Orders',
    description: 'Auto-reject orders where profit margin is below threshold',
    rule_type: AutonomousRuleType.ORDER_ACCEPTANCE,
    template_conditions: [
      {
        field: 'order.margin',
        operator: 'lt',
        value: 15,
      },
    ],
    template_action: {
      type: 'auto_reject',
      parameters: {
        reason: 'low_margin',
        override_allowed: true,
      },
    },
    use_cases: ['pizza_places', 'fast_casual'],
  },
  {
    id: 'template-002' as UUID,
    name: 'Reject Far Deliveries',
    description: 'Auto-reject orders too far from restaurant',
    rule_type: AutonomousRuleType.ORDER_ACCEPTANCE,
    template_conditions: [
      {
        field: 'order.distance_km',
        operator: 'gt',
        value: 10,
      },
    ],
    template_action: {
      type: 'auto_reject',
      parameters: {
        reason: 'too_far',
        override_allowed: true,
      },
    },
    use_cases: ['delivery_focused'],
  },
  {
    id: 'template-003' as UUID,
    name: 'Increase Price During Peak Hours',
    description: 'Boost price 10% during lunch/dinner rush',
    rule_type: AutonomousRuleType.PRICING,
    template_conditions: [
      {
        field: 'time.is_peak_hour',
        operator: 'eq',
        value: true,
      },
    ],
    template_action: {
      type: 'adjust_price',
      parameters: {
        adjustment_percentage: 10,
        apply_to_items: 'all',
      },
    },
    use_cases: ['all'],
  },
  {
    id: 'template-004' as UUID,
    name: 'Auto-Order When Stock Low',
    description: 'Automatically reorder ingredient when stock hits threshold',
    rule_type: AutonomousRuleType.INVENTORY,
    template_conditions: [
      {
        field: 'inventory.stock',
        operator: 'lt',
        value: 10,
      },
    ],
    template_action: {
      type: 'auto_order',
      parameters: {
        reorder_quantity: 50,
      },
    },
    use_cases: ['all'],
  },
];

/**
 * Factory Functions
 */

export function createRule(input: CreateRuleInput): AutonomousRule {
  return {
    id: crypto.randomUUID() as UUID,
    restaurant_id: '' as UUID, // Set by service
    rule_type: input.rule_type,
    name: input.name,
    description: input.description,
    conditions: input.conditions,
    action: input.action,
    priority: input.priority ?? 50,
    enabled: true,
    requires_approval: input.requires_approval ?? true,
    auto_execute: input.auto_execute ?? false,
    created_at: new Date().toISOString() as ISOTimestamp,
    updated_at: new Date().toISOString() as ISOTimestamp,
  };
}

export function evaluateCondition(
  condition: RuleCondition,
  value: any,
): boolean {
  switch (condition.operator) {
    case 'eq':
      return value === condition.value;
    case 'neq':
      return value !== condition.value;
    case 'lt':
      return value < condition.value;
    case 'lte':
      return value <= condition.value;
    case 'gt':
      return value > condition.value;
    case 'gte':
      return value >= condition.value;
    case 'in':
      return (condition.value as any[]).includes(value);
    case 'nin':
      return !(condition.value as any[]).includes(value);
    default:
      return false;
  }
}
