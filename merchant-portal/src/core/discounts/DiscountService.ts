/**
 * DiscountService — Create, validate and apply discount rules.
 *
 * Discount types:
 *   - percentage: X% off subtotal or specific item
 *   - fixed: flat amount off subtotal
 *   - bogo: Buy One Get One (buy X get Y free)
 *   - bundle: combo for fixed price
 *   - employee: configurable staff discount
 *   - loyalty: loyalty points redemption
 *
 * Discounts are applied BEFORE tax (fiscal compliance).
 * Storage: `gm_discounts` table via Docker Core.
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";
import { Logger } from "../logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiscountType =
  | "percentage"
  | "fixed"
  | "bogo"
  | "bundle"
  | "employee"
  | "loyalty";

export type DiscountStatus = "active" | "paused" | "expired" | "deleted";

export interface DiscountRule {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  type: DiscountType;
  /** For percentage: 0-100. For fixed: amount in cents. */
  value: number;
  /** Minimum order amount in cents to qualify. */
  min_order_cents: number;
  /** Maximum number of total uses (0 = unlimited). */
  max_uses: number;
  /** Current number of uses. */
  current_uses: number;
  /** Maximum uses per customer (0 = unlimited). */
  max_uses_per_customer: number;
  /** ISO date — start of validity. */
  valid_from: string;
  /** ISO date — end of validity (null = no expiry). */
  valid_until: string | null;
  /** Product IDs this discount applies to (empty = all products). */
  product_ids: string[];
  /** Category IDs this discount applies to (empty = all categories). */
  category_ids: string[];
  /** BOGO config: buy X items... */
  bogo_buy_quantity?: number;
  /** BOGO config: ...get Y free. */
  bogo_get_quantity?: number;
  /** Bundle: fixed price in cents for the bundle. */
  bundle_price_cents?: number;
  /** Employee discount: configurable percentage override. */
  employee_discount_pct?: number;
  /** Loyalty: points required for redemption. */
  loyalty_points_required?: number;
  /** Loyalty: discount value in cents when redeemed. */
  loyalty_discount_cents?: number;
  status: DiscountStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateDiscountInput {
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  min_order_cents?: number;
  max_uses?: number;
  max_uses_per_customer?: number;
  valid_from?: string;
  valid_until?: string | null;
  product_ids?: string[];
  category_ids?: string[];
  bogo_buy_quantity?: number;
  bogo_get_quantity?: number;
  bundle_price_cents?: number;
  employee_discount_pct?: number;
  loyalty_points_required?: number;
  loyalty_discount_cents?: number;
}

export interface OrderItem {
  product_id: string;
  category_id?: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

export interface DiscountValidationResult {
  valid: boolean;
  discount?: DiscountRule;
  discountCents: number;
  reason?: string;
  /** For BOGO: which items get free. */
  freeItems?: Array<{ product_id: string; quantity: number }>;
}

export interface ApplyDiscountResult {
  success: boolean;
  discountCents: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Discount calculation (pure — no DB)
// ---------------------------------------------------------------------------

/**
 * Calculate the discount amount for given items and discount rule.
 * This is a pure function — no side effects.
 */
export function calculateDiscountAmount(
  discount: DiscountRule,
  items: OrderItem[],
  subtotalCents: number,
): number {
  switch (discount.type) {
    case "percentage": {
      const applicableTotal = getApplicableTotal(discount, items, subtotalCents);
      return Math.round(applicableTotal * (discount.value / 100));
    }
    case "fixed":
      return Math.min(discount.value, subtotalCents);
    case "employee": {
      const pct = discount.employee_discount_pct ?? discount.value;
      return Math.round(subtotalCents * (pct / 100));
    }
    case "bogo": {
      const buyQty = discount.bogo_buy_quantity ?? 2;
      const getQty = discount.bogo_get_quantity ?? 1;
      // Find cheapest qualifying item to make free
      const qualifying = items.filter(
        (i) =>
          discount.product_ids.length === 0 ||
          discount.product_ids.includes(i.product_id),
      );
      const sorted = qualifying
        .flatMap((i) =>
          Array.from({ length: i.quantity }, () => i.unit_price_cents),
        )
        .sort((a, b) => a - b);
      const totalQualifying = sorted.length;
      if (totalQualifying < buyQty + getQty) return 0;
      // Free items are the cheapest ones
      const freeCount = Math.min(
        getQty,
        Math.floor(totalQualifying / (buyQty + getQty)) * getQty,
      );
      return sorted.slice(0, freeCount).reduce((sum, p) => sum + p, 0);
    }
    case "bundle": {
      if (!discount.bundle_price_cents) return 0;
      const bundleItems = items.filter(
        (i) => discount.product_ids.includes(i.product_id),
      );
      const bundleTotal = bundleItems.reduce(
        (sum, i) => sum + i.line_total_cents,
        0,
      );
      return Math.max(0, bundleTotal - discount.bundle_price_cents);
    }
    case "loyalty":
      return discount.loyalty_discount_cents ?? 0;
    default:
      return 0;
  }
}

function getApplicableTotal(
  discount: DiscountRule,
  items: OrderItem[],
  subtotalCents: number,
): number {
  // If no product/category restrictions, apply to full subtotal
  if (
    discount.product_ids.length === 0 &&
    discount.category_ids.length === 0
  ) {
    return subtotalCents;
  }
  // Otherwise sum only matching items
  return items
    .filter(
      (i) =>
        discount.product_ids.includes(i.product_id) ||
        (i.category_id && discount.category_ids.includes(i.category_id)),
    )
    .reduce((sum, i) => sum + i.line_total_cents, 0);
}

// ---------------------------------------------------------------------------
// Validation (pure — checks rules without DB)
// ---------------------------------------------------------------------------

/**
 * Validate whether a discount can be applied to the current order.
 */
export function validateDiscountRules(
  discount: DiscountRule,
  items: OrderItem[],
  subtotalCents: number,
  _customerId?: string,
): DiscountValidationResult {
  const now = new Date();

  // Status check
  if (discount.status !== "active") {
    return { valid: false, discountCents: 0, reason: "discount_inactive" };
  }

  // Date range
  const from = new Date(discount.valid_from);
  if (now < from) {
    return { valid: false, discountCents: 0, reason: "discount_not_started" };
  }
  if (discount.valid_until) {
    const until = new Date(discount.valid_until);
    if (now > until) {
      return { valid: false, discountCents: 0, reason: "discount_expired" };
    }
  }

  // Usage limit
  if (discount.max_uses > 0 && discount.current_uses >= discount.max_uses) {
    return { valid: false, discountCents: 0, reason: "max_uses_reached" };
  }

  // Minimum order
  if (subtotalCents < discount.min_order_cents) {
    return { valid: false, discountCents: 0, reason: "min_order_not_met" };
  }

  // Calculate amount
  const discountCents = calculateDiscountAmount(discount, items, subtotalCents);
  if (discountCents <= 0) {
    return { valid: false, discountCents: 0, reason: "zero_discount" };
  }

  return { valid: true, discount, discountCents };
}

// ---------------------------------------------------------------------------
// CRUD operations (DB)
// ---------------------------------------------------------------------------

/**
 * Create a new discount rule in the database.
 */
export async function createDiscount(
  restaurantId: string,
  input: CreateDiscountInput,
): Promise<DiscountRule | null> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_discounts")
      .insert({
        restaurant_id: restaurantId,
        name: input.name,
        description: input.description ?? null,
        type: input.type,
        value: input.value,
        min_order_cents: input.min_order_cents ?? 0,
        max_uses: input.max_uses ?? 0,
        current_uses: 0,
        max_uses_per_customer: input.max_uses_per_customer ?? 0,
        valid_from: input.valid_from ?? new Date().toISOString(),
        valid_until: input.valid_until ?? null,
        product_ids: input.product_ids ?? [],
        category_ids: input.category_ids ?? [],
        bogo_buy_quantity: input.bogo_buy_quantity ?? null,
        bogo_get_quantity: input.bogo_get_quantity ?? null,
        bundle_price_cents: input.bundle_price_cents ?? null,
        employee_discount_pct: input.employee_discount_pct ?? null,
        loyalty_points_required: input.loyalty_points_required ?? null,
        loyalty_discount_cents: input.loyalty_discount_cents ?? null,
        status: "active",
      })
      .select("*")
      .single();

    if (error) {
      Logger.warn("[DiscountService] createDiscount error", {
        error: error.message,
      });
      return null;
    }

    return data as DiscountRule;
  } catch (err) {
    Logger.warn("[DiscountService] createDiscount error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Get all active discounts for a restaurant.
 */
export async function getActiveDiscounts(
  restaurantId: string,
): Promise<DiscountRule[]> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_discounts")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: false });

    if (error || !data) {
      Logger.warn("[DiscountService] getActiveDiscounts error", {
        error: error?.message,
      });
      return [];
    }

    return data as DiscountRule[];
  } catch (err) {
    Logger.warn("[DiscountService] getActiveDiscounts error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

/**
 * Get a single discount by ID.
 */
export async function getDiscount(
  discountId: string,
): Promise<DiscountRule | null> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_discounts")
      .select("*")
      .eq("id", discountId)
      .single();

    if (error || !data) return null;
    return data as DiscountRule;
  } catch {
    return null;
  }
}

/**
 * Update a discount rule.
 */
export async function updateDiscount(
  discountId: string,
  updates: Partial<CreateDiscountInput> & { status?: DiscountStatus },
): Promise<DiscountRule | null> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_discounts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", discountId)
      .select("*")
      .single();

    if (error || !data) {
      Logger.warn("[DiscountService] updateDiscount error", {
        error: error?.message,
      });
      return null;
    }

    return data as DiscountRule;
  } catch (err) {
    Logger.warn("[DiscountService] updateDiscount error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Soft-delete a discount (set status to "deleted").
 */
export async function deleteDiscount(discountId: string): Promise<boolean> {
  try {
    const { error } = await dockerCoreClient
      .from("gm_discounts")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", discountId);

    if (error) {
      Logger.warn("[DiscountService] deleteDiscount error", {
        error: error.message,
      });
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Increment usage counter for a discount.
 */
export async function incrementDiscountUsage(
  discountId: string,
): Promise<void> {
  try {
    // Use RPC or manual increment
    const discount = await getDiscount(discountId);
    if (!discount) return;

    await dockerCoreClient
      .from("gm_discounts")
      .update({
        current_uses: discount.current_uses + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", discountId);
  } catch (err) {
    Logger.warn("[DiscountService] incrementDiscountUsage error", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ---------------------------------------------------------------------------
// Apply / Remove discount on order
// ---------------------------------------------------------------------------

/**
 * Apply a validated discount to an order (increments usage, logs).
 */
export async function applyDiscountToOrder(
  _orderId: string,
  discountId: string,
  items: OrderItem[],
  subtotalCents: number,
  customerId?: string,
): Promise<ApplyDiscountResult> {
  const discount = await getDiscount(discountId);
  if (!discount) {
    return { success: false, discountCents: 0, error: "discount_not_found" };
  }

  const validation = validateDiscountRules(
    discount,
    items,
    subtotalCents,
    customerId,
  );
  if (!validation.valid) {
    return {
      success: false,
      discountCents: 0,
      error: validation.reason ?? "invalid_discount",
    };
  }

  // Increment usage
  await incrementDiscountUsage(discountId);

  return { success: true, discountCents: validation.discountCents };
}

// ---------------------------------------------------------------------------
// Usage analytics
// ---------------------------------------------------------------------------

export interface DiscountUsageStats {
  discountId: string;
  name: string;
  type: DiscountType;
  timesUsed: number;
  totalDiscountCents: number;
  status: DiscountStatus;
}

/**
 * Get usage statistics for all discounts in a restaurant.
 */
export async function getDiscountUsageStats(
  restaurantId: string,
): Promise<DiscountUsageStats[]> {
  try {
    const discounts = await getActiveDiscounts(restaurantId);
    return discounts.map((d) => ({
      discountId: d.id,
      name: d.name,
      type: d.type,
      timesUsed: d.current_uses,
      totalDiscountCents: 0, // Would need order-level tracking for revenue impact
      status: d.status,
    }));
  } catch {
    return [];
  }
}
