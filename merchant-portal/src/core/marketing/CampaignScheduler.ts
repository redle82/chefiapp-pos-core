/**
 * Campaign Scheduler — Auto-trigger campaigns and manage send queue.
 */
import { getCampaigns, type Campaign } from "./CampaignService";

const dailySendCount = new Map<string, { count: number; resetAt: number }>();
const MAX_DAILY_SENDS = 500;

function canSend(restaurantId: string): boolean {
  const now = Date.now();
  const entry = dailySendCount.get(restaurantId);
  if (!entry || now > entry.resetAt) {
    dailySendCount.set(restaurantId, {
      count: 0,
      resetAt: now + 24 * 60 * 60 * 1000,
    });
    return true;
  }
  return entry.count < MAX_DAILY_SENDS;
}

function incrementSendCount(restaurantId: string, count: number): void {
  const entry = dailySendCount.get(restaurantId);
  if (entry) {
    entry.count += count;
  }
}

export async function checkAndSendScheduled(
  restaurantId: string
): Promise<{ sent: number; skipped: number }> {
  const campaigns = await getCampaigns(restaurantId);
  const now = new Date().toISOString();
  let sent = 0;
  let skipped = 0;

  for (const campaign of campaigns) {
    if (campaign.status !== "active") continue;
    if (campaign.scheduled_at && campaign.scheduled_at > now) continue;
    if (!canSend(restaurantId)) {
      skipped++;
      continue;
    }

    // Queue sending via EmailService (placeholder — actual send logic depends on EmailService integration)
    incrementSendCount(restaurantId, 1);
    sent++;
  }

  return { sent, skipped };
}

export async function processAutoCampaign(
  type: "welcome" | "birthday" | "win_back",
  restaurantId: string,
  _customerId?: string
): Promise<boolean> {
  if (!canSend(restaurantId)) return false;

  const campaigns = await getCampaigns(restaurantId);
  const matching = campaigns.find(
    (c: Campaign) => c.type === type && c.status === "active"
  );

  if (!matching) return false;

  // Auto-campaign trigger — actual email sending delegated to EmailService
  incrementSendCount(restaurantId, 1);
  return true;
}

export function getDailySendCount(restaurantId: string): number {
  const entry = dailySendCount.get(restaurantId);
  return entry?.count || 0;
}

export function getRemainingDailySends(restaurantId: string): number {
  return MAX_DAILY_SENDS - getDailySendCount(restaurantId);
}
