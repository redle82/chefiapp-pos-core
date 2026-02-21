// @ts-nocheck
import type { CoreOrder } from "../../infra/docker-core/types";
import { readOrdersForAnalytics } from "../../infra/readers/OrderReader";
import type { IntegrationEvent } from "../../integrations/types/IntegrationEvent";
import {
  buildCancellationStats,
  buildGamificationImpact,
  buildOperationalActivity,
  buildSalesSummary,
  type GamificationImpact,
  type GamificationImpactInput,
  type OperationalActivity,
  type SalesSummary,
  type TimeRange,
} from "./EventAggregator";

// Re-export de tipos usados pelos hooks para evitar imports circulares confusos
export type { GamificationImpactInput } from "./EventAggregator";

export interface LoadEventsOptions {
  restaurantId: string;
  period: TimeRange;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function toMillis(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}

function mapOrderToEvents(order: CoreOrder): IntegrationEvent[] {
  const events: IntegrationEvent[] = [];

  const createdAtMs = toMillis(order.created_at) ?? Date.now();
  const orderId = order.id;

  // order.created
  events.push({
    type: "order.created",
    payload: {
      orderId,
      source: "tpv",
      items: [],
      totalCents: order.total_cents ?? 0,
      tableId: order.table_id ?? undefined,
      customerName: order.customer_name ?? undefined,
      customerPhone: undefined,
      createdAt: createdAtMs,
      metadata: {
        status: order.status,
      },
    },
  });

  const status = (order.status ?? "").toString().toUpperCase();
  const closedAtMs = toMillis(order.closed_at);
  const updatedAtMs = toMillis(order.updated_at) ?? closedAtMs ?? createdAtMs;

  if (status === "CANCELLED") {
    events.push({
      type: "order.updated",
      payload: {
        orderId,
        status: "cancelled",
        updatedAt: updatedAtMs,
      },
    });
    return events;
  }

  if (status === "PAID" || status === "READY" || status === "SERVED") {
    events.push({
      type: "order.completed",
      payload: {
        orderId,
        totalCents: order.total_cents ?? 0,
        paymentMethod: "card",
        completedAt: closedAtMs ?? updatedAtMs,
      },
    });
  }

  return events;
}

async function loadEventsForPeriod({
  restaurantId,
  period,
  limit = 1000,
}: LoadEventsOptions): Promise<IntegrationEvent[]> {
  const rows = await readOrdersForAnalytics(restaurantId, limit);

  const start = new Date(period.from - 24 * 60 * 60 * 1000);
  const end = new Date(period.to + 24 * 60 * 60 * 1000);

  const filtered = rows.filter((o) => {
    const created = toMillis(o.created_at);
    if (created == null) return false;
    const d = new Date(created);
    return d >= start && d <= end;
  });

  const allEvents: IntegrationEvent[] = [];
  for (const order of filtered) {
    allEvents.push(...mapOrderToEvents(order));
  }
  return allEvents;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

export async function getSalesSummaryReport(
  restaurantId: string,
  period: TimeRange,
  currency: string = "EUR",
): Promise<SalesSummary> {
  const events = await loadEventsForPeriod({ restaurantId, period });
  return buildSalesSummary(events, {
    restaurantId,
    currency,
    period,
  });
}

export async function getOperationalActivityReport(
  restaurantId: string,
  period: TimeRange,
  currency: string = "EUR",
): Promise<OperationalActivity> {
  const events = await loadEventsForPeriod({ restaurantId, period });
  return buildOperationalActivity(events, {
    restaurantId,
    currency,
    period,
  });
}

export async function getCancellationStatsReport(
  restaurantId: string,
  period: TimeRange,
  currency: string = "EUR",
) {
  const events = await loadEventsForPeriod({ restaurantId, period });
  return buildCancellationStats(events, {
    restaurantId,
    currency,
    period,
  });
}

export async function getGamificationImpactReport(
  restaurantId: string,
  input: GamificationImpactInput,
  currency: string = "EUR",
): Promise<GamificationImpact> {
  const events = await loadEventsForPeriod({
    restaurantId,
    period: input.context.period,
  });
  return buildGamificationImpact(events, {
    ...input,
    context: {
      ...input.context,
      currency,
    },
  });
}
