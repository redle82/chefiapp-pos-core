/**
 * SPONSORSHIP SERVICE
 *
 * Manages brand sponsorships with ethical visibility rules.
 * Integrates with Dynamic Menu for contextual amplification.
 */
// @ts-nocheck


// LEGACY / LAB — blocked in Docker mode via core/supabase shim
import { supabase } from "../../supabase";
import { getCurrentTimeSlot } from "../DynamicMenu/scoring";
import type {
  CampaignMetrics,
  MenuContext,
  ProductSponsorship,
  VisibilityRules,
} from "./types";

export class SponsorshipService {
  /**
   * Get active sponsorships for a restaurant
   */
  public static async getActiveSponsorships(
    restaurantId: string,
    context: MenuContext,
  ): Promise<Map<string, ProductSponsorship>> {
    const { data, error } = await supabase
      .from("product_sponsorships")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .eq("owner_approved", true);

    if (error) {
      console.warn("[SponsorshipService] Failed to load sponsorships:", error);
      return new Map();
    }

    // Filter by visibility rules
    const visible = (data || []).filter((s: Record<string, any>) =>
      this.isVisible(s as ProductSponsorship, context),
    );

    // Map by product_id for easy lookup
    return new Map(
      visible.map((s: Record<string, any>) => [
        s.product_id,
        s as ProductSponsorship,
      ]),
    );
  }

  /**
   * Check if sponsorship is visible in current context
   */
  public static isVisible(
    sponsorship: ProductSponsorship,
    context: MenuContext,
  ): boolean {
    const rules: VisibilityRules = sponsorship.visibility_rules;

    // Channel check
    if (!rules.channels?.includes(context.channel)) {
      return false;
    }

    // Time slot check
    if (rules.time_slots && rules.time_slots.length > 0) {
      const currentSlot = getCurrentTimeSlot(context.hour);
      if (!rules.time_slots.includes(currentSlot)) {
        return false;
      }
    }

    // Day of week check
    if (rules.days_of_week && rules.days_of_week.length > 0) {
      if (!rules.days_of_week.includes(context.day)) {
        return false;
      }
    }

    // Date range check
    if (rules.date_range) {
      const [startStr, endStr] = rules.date_range;
      const start = new Date(startStr);
      const end = new Date(endStr);

      if (context.date < start || context.date > end) {
        return false;
      }
    }

    // Minimum order value check
    if (rules.min_order_value && context.cart_value_cents) {
      if (context.cart_value_cents < rules.min_order_value) {
        return false;
      }
    }

    // Campaign date range check
    if (sponsorship.starts_at) {
      const starts = new Date(sponsorship.starts_at);
      if (context.date < starts) return false;
    }

    if (sponsorship.ends_at) {
      const ends = new Date(sponsorship.ends_at);
      if (context.date > ends) return false;
    }

    return true;
  }

  /**
   * Calculate sponsored price after discount
   */
  public static calculateSponsoredPrice(
    originalPrice: number,
    sponsorship: ProductSponsorship,
  ): number {
    const { incentive_type, incentive_value } = sponsorship;

    if (incentive_type === "discount") {
      if (incentive_value.type === "percentage") {
        const discount = originalPrice * (incentive_value.value! / 100);
        return Math.max(0, originalPrice - discount);
      } else if (incentive_value.type === "fixed_amount") {
        return Math.max(0, originalPrice - incentive_value.value!);
      }
    }

    // For combo/cashback/gift, price stays the same
    return originalPrice;
  }

  /**
   * Track sponsorship event (impression, click, conversion, sale)
   */
  public static async trackEvent(
    sponsorshipId: string,
    eventType: "impression" | "click" | "conversion" | "sale",
    payload: {
      product_id: string;
      channel: "web" | "qr" | "waiter";
      session_id: string;
      order_id?: string;
      revenue_cents?: number;
    },
  ): Promise<void> {
    try {
      const { error } = await supabase.from("sponsorship_events").insert({
        sponsorship_id: sponsorshipId,
        event_type: eventType,
        payload: {
          ...payload,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) {
        console.warn(
          `[SponsorshipService] Failed to track ${eventType}:`,
          error,
        );
      }
    } catch (err) {
      console.error(`[SponsorshipService] Event tracking error:`, err);
    }
  }

  /**
   * Get campaign metrics for owner dashboard
   */
  public static async getCampaignMetrics(
    restaurantId: string,
    campaignId?: string,
  ): Promise<CampaignMetrics[]> {
    let query = supabase
      .from("product_sponsorships")
      .select("*")
      .eq("restaurant_id", restaurantId);

    if (campaignId) {
      query = query.eq("campaign_id", campaignId);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.warn("[SponsorshipService] Failed to load metrics:", error);
      return [];
    }

    // Calculate derived metrics
    return data.map((s: Record<string, any>) => ({
      campaign_id: s.campaign_id,
      brand_name: s.brand_name,
      impressions: s.impressions,
      clicks: s.clicks,
      conversions: s.conversions,
      revenue_cents: s.revenue_cents,
      ctr: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0,
      conversion_rate: s.clicks > 0 ? (s.conversions / s.clicks) * 100 : 0,
      avg_order_value: s.conversions > 0 ? s.revenue_cents / s.conversions : 0,
    }));
  }

  /**
   * Approve/reject campaign
   */
  public static async updateApproval(
    sponsorshipId: string,
    approved: boolean,
  ): Promise<void> {
    const { error } = await supabase
      .from("product_sponsorships")
      .update({
        owner_approved: approved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sponsorshipId);

    if (error) {
      throw new Error("Failed to update approval: " + error.message);
    }
  }

  /**
   * Pause/resume campaign
   */
  public static async toggleActive(
    sponsorshipId: string,
    active: boolean,
  ): Promise<void> {
    const { error } = await supabase
      .from("product_sponsorships")
      .update({
        active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sponsorshipId);

    if (error) {
      throw new Error("Failed to toggle campaign: " + error.message);
    }
  }

  /**
   * Create sponsorship campaign (admin/brand use)
   */
  public static async createCampaign(
    campaign: Omit<
      ProductSponsorship,
      | "id"
      | "created_at"
      | "updated_at"
      | "impressions"
      | "clicks"
      | "conversions"
      | "revenue_cents"
    >,
  ): Promise<ProductSponsorship> {
    const { data, error } = await supabase
      .from("product_sponsorships")
      .insert(campaign)
      .select()
      .single();

    if (error) {
      throw new Error("Failed to create campaign: " + error.message);
    }

    return data as ProductSponsorship;
  }
}
