/**
 * Campaign Service — CRUD and management for automated marketing campaigns.
 */
import { getDockerCoreFetchClient } from "../../infra/dockerCoreFetchClient";

export type CampaignType =
  | "welcome"
  | "win_back"
  | "birthday"
  | "promotion"
  | "feedback"
  | "loyalty_milestone";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface Campaign {
  id: string;
  restaurant_id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  audience_segment: string;
  subject: string;
  content: string;
  discount_code?: string;
  scheduled_at?: string;
  sent_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
}

export interface CreateCampaignInput {
  restaurant_id: string;
  name: string;
  type: CampaignType;
  audience_segment: string;
  subject: string;
  content: string;
  discount_code?: string;
  scheduled_at?: string;
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<Campaign | null> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db
      .from("gm_campaigns")
      .insert({
        ...input,
        status: "draft",
        sent_count: 0,
        open_count: 0,
        click_count: 0,
      })
      .select()
      .single();
    return data as Campaign | null;
  } catch {
    return null;
  }
}

export async function getCampaigns(
  restaurantId: string
): Promise<Campaign[]> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db
      .from("gm_campaigns")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    return (data as Campaign[]) || [];
  } catch {
    return [];
  }
}

export async function updateCampaign(
  id: string,
  updates: Partial<Campaign>
): Promise<boolean> {
  try {
    const db = await getDockerCoreFetchClient();
    const { error } = await db
      .from("gm_campaigns")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

export async function pauseCampaign(id: string): Promise<boolean> {
  return updateCampaign(id, { status: "paused" });
}

export async function resumeCampaign(id: string): Promise<boolean> {
  return updateCampaign(id, { status: "active" });
}

export async function deleteCampaign(id: string): Promise<boolean> {
  try {
    const db = await getDockerCoreFetchClient();
    const { error } = await db.from("gm_campaigns").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

export function getCampaignStats(campaign: Campaign): CampaignStats {
  const sent = campaign.sent_count;
  const delivered = sent;
  const opened = campaign.open_count;
  const clicked = campaign.click_count;
  const converted = Math.floor(clicked * 0.15);
  return {
    sent,
    delivered,
    opened,
    clicked,
    converted,
    openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
  };
}

export async function getAudienceCount(
  restaurantId: string,
  segment: string
): Promise<number> {
  try {
    const db = await getDockerCoreFetchClient();
    let query = db
      .from("gm_customers")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId);

    if (segment === "new") {
      query = query.eq("visit_count", 1);
    } else if (segment === "regular") {
      query = query.gte("visit_count", 2).lte("visit_count", 10);
    } else if (segment === "vip") {
      query = query.gt("visit_count", 10);
    } else if (segment === "at_risk") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      query = query.lt("last_visit_at", thirtyDaysAgo);
    }

    const { count } = await query;
    return count || 0;
  } catch {
    return 0;
  }
}
