/**
 * GuardrailConfig — Default financial thresholds and per-restaurant overrides.
 *
 * Thresholds are stored as defaults here and can be overridden per restaurant
 * via the gm_restaurants.settings JSONB column (key: "guardrails").
 *
 * All monetary values are in cents to avoid floating point issues.
 */

import type { Role } from "./RBACService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscountThresholds {
  /** Up to this percentage, any operator can apply without audit. */
  auditLogAbovePercent: number;
  /** Above this percentage, manager/owner only. */
  managerRequiredAbovePercent: number;
  /** Above this percentage, owner only + confirmation dialog. */
  ownerOnlyAbovePercent: number;
  /** 100% discount always requires owner + reason. */
  fullDiscountRequiresReason: boolean;
}

export interface RefundThresholds {
  /** Refunds always require at least manager role. */
  managerRequired: boolean;
  /** Above this amount (cents), owner only + audit. */
  ownerOnlyAboveCents: number;
  /** Above this amount (cents), owner only + audit + reason required. */
  reasonRequiredAboveCents: number;
}

export interface CashRegisterThresholds {
  /** Opening balance difference above this percentage triggers warning. */
  openingBalanceWarningPercent: number;
  /** Closing balance difference above this amount (cents) triggers audit + notification. */
  closingBalanceAuditCents: number;
}

export interface OrderThresholds {
  /** Cancel order above this total (cents) requires manager/owner. */
  cancelManagerRequiredAboveCents: number;
}

export interface GuardrailConfig {
  discount: DiscountThresholds;
  refund: RefundThresholds;
  cashRegister: CashRegisterThresholds;
  order: OrderThresholds;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_GUARDRAIL_CONFIG: GuardrailConfig = {
  discount: {
    auditLogAbovePercent: 10,
    managerRequiredAbovePercent: 20,
    ownerOnlyAbovePercent: 50,
    fullDiscountRequiresReason: true,
  },
  refund: {
    managerRequired: true,
    ownerOnlyAboveCents: 10000, // > 100 EUR
    reasonRequiredAboveCents: 50000, // > 500 EUR
  },
  cashRegister: {
    openingBalanceWarningPercent: 20,
    closingBalanceAuditCents: 5000, // > 50 EUR
  },
  order: {
    cancelManagerRequiredAboveCents: 10000, // > 100 EUR
  },
};

// ---------------------------------------------------------------------------
// In-memory cache for restaurant configs
// ---------------------------------------------------------------------------

const configCache = new Map<string, GuardrailConfig>();

/**
 * Retrieve the guardrail configuration for a restaurant.
 * Falls back to defaults if no custom config is stored.
 *
 * For now, reads from localStorage (key: `chefiapp_guardrails_${restaurantId}`)
 * to support offline-first. A Supabase read can be layered on top.
 */
export function getGuardrailConfig(restaurantId?: string): GuardrailConfig {
  if (!restaurantId) return DEFAULT_GUARDRAIL_CONFIG;

  const cached = configCache.get(restaurantId);
  if (cached) return cached;

  try {
    const stored = localStorage.getItem(`chefiapp_guardrails_${restaurantId}`);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<GuardrailConfig>;
      const merged = mergeConfig(parsed);
      configCache.set(restaurantId, merged);
      return merged;
    }
  } catch {
    // Ignore parse errors — use defaults
  }

  return DEFAULT_GUARDRAIL_CONFIG;
}

/**
 * Persist custom guardrail config for a restaurant (local cache + localStorage).
 */
export function setGuardrailConfig(
  restaurantId: string,
  config: Partial<GuardrailConfig>,
): void {
  const merged = mergeConfig(config);
  configCache.set(restaurantId, merged);
  try {
    localStorage.setItem(
      `chefiapp_guardrails_${restaurantId}`,
      JSON.stringify(merged),
    );
  } catch {
    // localStorage full or unavailable — config still in memory cache
  }
}

/**
 * Clear cached config (e.g., after fetching fresh from DB).
 */
export function clearGuardrailConfigCache(restaurantId?: string): void {
  if (restaurantId) {
    configCache.delete(restaurantId);
  } else {
    configCache.clear();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mergeConfig(partial: Partial<GuardrailConfig>): GuardrailConfig {
  return {
    discount: {
      ...DEFAULT_GUARDRAIL_CONFIG.discount,
      ...partial.discount,
    },
    refund: {
      ...DEFAULT_GUARDRAIL_CONFIG.refund,
      ...partial.refund,
    },
    cashRegister: {
      ...DEFAULT_GUARDRAIL_CONFIG.cashRegister,
      ...partial.cashRegister,
    },
    order: {
      ...DEFAULT_GUARDRAIL_CONFIG.order,
      ...partial.order,
    },
  };
}

/**
 * Helper: is this role at least manager level?
 */
export function isManagerOrAbove(role: Role): boolean {
  return role === "manager" || role === "owner";
}

/**
 * Helper: is this role owner?
 */
export function isOwner(role: Role): boolean {
  return role === "owner";
}
