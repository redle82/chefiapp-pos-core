/**
 * CouponService — Generate, validate and redeem coupon codes.
 *
 * Coupons are linked to a DiscountRule. Each coupon has a unique code
 * that can be entered at the POS to apply the associated discount.
 *
 * Storage: `gm_coupons` table via Docker Core.
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";
import { Logger } from "../logger";
import type { DiscountRule } from "./DiscountService";
import { getDiscount, validateDiscountRules } from "./DiscountService";
import type { OrderItem } from "./DiscountService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CouponStatus = "active" | "used" | "expired" | "revoked";

export interface Coupon {
  id: string;
  restaurant_id: string;
  discount_id: string;
  code: string;
  /** Maximum redemptions for this specific coupon (0 = unlimited). */
  max_redemptions: number;
  /** Current redemption count. */
  current_redemptions: number;
  status: CouponStatus;
  created_at: string;
  /** ISO date — when it was last redeemed. */
  last_redeemed_at: string | null;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  order_id: string;
  discount_cents: number;
  redeemed_at: string;
}

export interface GenerateCouponOptions {
  /** Custom code. If omitted, auto-generates. */
  code?: string;
  /** Max redemptions for this coupon (0 = unlimited, inherits from discount). */
  maxRedemptions?: number;
  /** Number of coupons to generate (for batch generation). */
  count?: number;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount?: DiscountRule;
  discountCents: number;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique coupon code.
 * Format: PREFIX + random alphanumeric (e.g., "WELCOME20", "SAVE-A3X7K9")
 */
function generateCode(prefix?: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars (0/O, 1/I)
  const random = Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
  return prefix ? `${prefix}-${random}` : random;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Generate one or more coupon codes for a discount.
 */
export async function generateCoupon(
  restaurantId: string,
  discountId: string,
  options: GenerateCouponOptions = {},
): Promise<Coupon[]> {
  const count = options.count ?? 1;
  const coupons: Coupon[] = [];

  try {
    for (let i = 0; i < count; i++) {
      const code = i === 0 && options.code ? options.code : generateCode();

      const { data, error } = await dockerCoreClient
        .from("gm_coupons")
        .insert({
          restaurant_id: restaurantId,
          discount_id: discountId,
          code: code.toUpperCase(),
          max_redemptions: options.maxRedemptions ?? 0,
          current_redemptions: 0,
          status: "active",
        })
        .select("*")
        .single();

      if (error) {
        Logger.warn("[CouponService] generateCoupon error", {
          code,
          error: error.message,
        });
        continue;
      }

      if (data) coupons.push(data as Coupon);
    }
  } catch (err) {
    Logger.warn("[CouponService] generateCoupon error", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return coupons;
}

/**
 * Validate a coupon code for a given restaurant and order.
 */
export async function validateCoupon(
  code: string,
  restaurantId: string,
  items: OrderItem[] = [],
  subtotalCents = 0,
  customerId?: string,
): Promise<CouponValidationResult> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_coupons")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("code", code.toUpperCase())
      .single();

    if (error || !data) {
      return { valid: false, discountCents: 0, reason: "coupon_not_found" };
    }

    const coupon = data as Coupon;

    // Status check
    if (coupon.status !== "active") {
      return {
        valid: false,
        coupon,
        discountCents: 0,
        reason:
          coupon.status === "used"
            ? "coupon_already_used"
            : coupon.status === "expired"
              ? "coupon_expired"
              : "coupon_revoked",
      };
    }

    // Redemption limit
    if (
      coupon.max_redemptions > 0 &&
      coupon.current_redemptions >= coupon.max_redemptions
    ) {
      return {
        valid: false,
        coupon,
        discountCents: 0,
        reason: "coupon_max_redemptions",
      };
    }

    // Validate the linked discount
    const discount = await getDiscount(coupon.discount_id);
    if (!discount) {
      return {
        valid: false,
        coupon,
        discountCents: 0,
        reason: "discount_not_found",
      };
    }

    const discountValidation = validateDiscountRules(
      discount,
      items,
      subtotalCents,
      customerId,
    );

    if (!discountValidation.valid) {
      return {
        valid: false,
        coupon,
        discount,
        discountCents: 0,
        reason: discountValidation.reason,
      };
    }

    return {
      valid: true,
      coupon,
      discount,
      discountCents: discountValidation.discountCents,
    };
  } catch (err) {
    Logger.warn("[CouponService] validateCoupon error", {
      code,
      error: err instanceof Error ? err.message : String(err),
    });
    return { valid: false, discountCents: 0, reason: "validation_error" };
  }
}

/**
 * Redeem a coupon: increment counters, log redemption.
 */
export async function redeemCoupon(
  code: string,
  restaurantId: string,
  orderId: string,
  discountCents: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find coupon
    const { data: couponData, error: findError } = await dockerCoreClient
      .from("gm_coupons")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("code", code.toUpperCase())
      .single();

    if (findError || !couponData) {
      return { success: false, error: "coupon_not_found" };
    }

    const coupon = couponData as Coupon;

    // Increment redemption count
    const newCount = coupon.current_redemptions + 1;
    const newStatus: CouponStatus =
      coupon.max_redemptions > 0 && newCount >= coupon.max_redemptions
        ? "used"
        : "active";

    await dockerCoreClient
      .from("gm_coupons")
      .update({
        current_redemptions: newCount,
        status: newStatus,
        last_redeemed_at: new Date().toISOString(),
      })
      .eq("id", coupon.id);

    // Log redemption
    await dockerCoreClient.from("gm_coupon_redemptions").insert({
      coupon_id: coupon.id,
      order_id: orderId,
      discount_cents: discountCents,
    });

    return { success: true };
  } catch (err) {
    Logger.warn("[CouponService] redeemCoupon error", {
      code,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "redemption_error" };
  }
}

/**
 * Get usage stats for a coupon code.
 */
export async function getCouponUsage(
  code: string,
  restaurantId: string,
): Promise<{
  coupon: Coupon | null;
  redemptions: CouponRedemption[];
  totalDiscountCents: number;
}> {
  try {
    const { data: couponData } = await dockerCoreClient
      .from("gm_coupons")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("code", code.toUpperCase())
      .single();

    if (!couponData) {
      return { coupon: null, redemptions: [], totalDiscountCents: 0 };
    }

    const coupon = couponData as Coupon;

    const { data: redemptionData } = await dockerCoreClient
      .from("gm_coupon_redemptions")
      .select("*")
      .eq("coupon_id", coupon.id)
      .order("redeemed_at", { ascending: false });

    const redemptions = (redemptionData ?? []) as CouponRedemption[];
    const totalDiscountCents = redemptions.reduce(
      (sum, r) => sum + r.discount_cents,
      0,
    );

    return { coupon, redemptions, totalDiscountCents };
  } catch {
    return { coupon: null, redemptions: [], totalDiscountCents: 0 };
  }
}

/**
 * List all coupons for a discount.
 */
export async function listCouponsForDiscount(
  discountId: string,
): Promise<Coupon[]> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_coupons")
      .select("*")
      .eq("discount_id", discountId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Coupon[];
  } catch {
    return [];
  }
}

/**
 * Revoke a coupon (set status to "revoked").
 */
export async function revokeCoupon(couponId: string): Promise<boolean> {
  try {
    const { error } = await dockerCoreClient
      .from("gm_coupons")
      .update({ status: "revoked" })
      .eq("id", couponId);

    return !error;
  } catch {
    return false;
  }
}
