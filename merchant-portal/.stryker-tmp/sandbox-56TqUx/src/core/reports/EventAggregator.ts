// @ts-nocheck
import type { IntegrationEvent } from "../../integrations/types/IntegrationEvent";
import type {
  CancellationStats,
  GamificationImpact,
  GamificationImpactPoint,
  OperationalActivity,
  OperationalActivityBucket,
  SalesSummary,
  TimeRange,
} from "./reportTypes";

/**
 * EventAggregator
 *
 * Funções puras que consomem eventos de integração e produzem
 * estruturas de domínio para relatórios.
 *
 * Esta camada não conhece React, apenas dados.
 */

export interface AggregationContext {
  restaurantId: string;
  currency: string;
  period: TimeRange;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const isWithinPeriod = (timestamp: number, period: TimeRange): boolean =>
  timestamp >= period.from && timestamp < period.to;

const getHourBucketStart = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setMinutes(0, 0, 0);
  return date.getTime();
};

const formatHourLabel = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  return `${hours}:00`;
};

// ─────────────────────────────────────────────────────────────
// SALES SUMMARY
// ─────────────────────────────────────────────────────────────

export const buildSalesSummary = (
  events: IntegrationEvent[],
  ctx: AggregationContext,
): SalesSummary => {
  let ordersCount = 0;
  let cancelledOrdersCount = 0;
  let grossTotalCents = 0;
  const paymentsByMethod: Record<string, number> = {};

  const cancelledOrders = new Set<string>();

  for (const event of events) {
    if (event.type === 'order.created' && isWithinPeriod(event.payload.createdAt, ctx.period)) {
      ordersCount += 1;
      grossTotalCents += event.payload.totalCents;
    }

    if (event.type === 'order.updated' && isWithinPeriod(event.payload.updatedAt, ctx.period)) {
      if (event.payload.status === 'cancelled') {
        cancelledOrders.add(event.payload.orderId);
      }
    }

    if (event.type === 'order.completed' && isWithinPeriod(event.payload.completedAt, ctx.period)) {
      const method = event.payload.paymentMethod ?? 'other';
      paymentsByMethod[method] = (paymentsByMethod[method] ?? 0) + event.payload.totalCents;
    }
  }

  cancelledOrdersCount = cancelledOrders.size;

  const effectiveOrders = Math.max(ordersCount - cancelledOrdersCount, 0);
  const averageTicketCents =
    effectiveOrders > 0 ? Math.round(grossTotalCents / effectiveOrders) : 0;

  return {
    restaurantId: ctx.restaurantId,
    period: ctx.period,
    currency: ctx.currency,
    ordersCount,
    cancelledOrdersCount,
    grossTotalCents,
    paymentsByMethod,
    averageTicketCents,
  };
};

// ─────────────────────────────────────────────────────────────
// OPERATIONAL ACTIVITY
// ─────────────────────────────────────────────────────────────

export const buildOperationalActivity = (
  events: IntegrationEvent[],
  ctx: AggregationContext,
): OperationalActivity => {
  const bucketsMap = new Map<number, OperationalActivityBucket>();
  const orderCreatedAt = new Map<string, number>();
  const orderCompletedAt = new Map<string, number>();

  for (const event of events) {
    switch (event.type) {
      case 'order.created': {
        if (!isWithinPeriod(event.payload.createdAt, ctx.period)) break;

        const bucketStart = getHourBucketStart(event.payload.createdAt);
        const existing =
          bucketsMap.get(bucketStart) ??
          ({
            bucketStart,
            bucketLabel: formatHourLabel(bucketStart),
            ordersOpened: 0,
            ordersClosed: 0,
            ordersCancelled: 0,
            averageDurationSeconds: null,
          } as OperationalActivityBucket);

        existing.ordersOpened += 1;
        bucketsMap.set(bucketStart, existing);
        orderCreatedAt.set(event.payload.orderId, event.payload.createdAt);
        break;
      }

      case 'order.updated': {
        if (!isWithinPeriod(event.payload.updatedAt, ctx.period)) break;

        const bucketStart = getHourBucketStart(event.payload.updatedAt);
        const existing =
          bucketsMap.get(bucketStart) ??
          ({
            bucketStart,
            bucketLabel: formatHourLabel(bucketStart),
            ordersOpened: 0,
            ordersClosed: 0,
            ordersCancelled: 0,
            averageDurationSeconds: null,
          } as OperationalActivityBucket);

        if (event.payload.status === 'cancelled') {
          existing.ordersCancelled += 1;
          bucketsMap.set(bucketStart, existing);
        }
        break;
      }

      case 'order.completed': {
        if (!isWithinPeriod(event.payload.completedAt, ctx.period)) break;

        const bucketStart = getHourBucketStart(event.payload.completedAt);
        const existing =
          bucketsMap.get(bucketStart) ??
          ({
            bucketStart,
            bucketLabel: formatHourLabel(bucketStart),
            ordersOpened: 0,
            ordersClosed: 0,
            ordersCancelled: 0,
            averageDurationSeconds: null,
          } as OperationalActivityBucket);

        existing.ordersClosed += 1;
        bucketsMap.set(bucketStart, existing);
        orderCompletedAt.set(event.payload.orderId, event.payload.completedAt);
        break;
      }
    }
  }

  // Calcular duração média por bucket com base em createdAt/completedAt
  const durationsByBucket: Map<number, number[]> = new Map();

  for (const [orderId, createdAt] of orderCreatedAt.entries()) {
    const completedAt = orderCompletedAt.get(orderId);
    if (!completedAt) continue;
    if (!isWithinPeriod(completedAt, ctx.period)) continue;

    const durationSeconds = Math.max(0, Math.round((completedAt - createdAt) / 1000));
    const bucketStart = getHourBucketStart(completedAt);
    const arr = durationsByBucket.get(bucketStart) ?? [];
    arr.push(durationSeconds);
    durationsByBucket.set(bucketStart, arr);
  }

  for (const [bucketStart, bucket] of bucketsMap.entries()) {
    const durations = durationsByBucket.get(bucketStart);
    if (durations && durations.length > 0) {
      const sum = durations.reduce((acc, v) => acc + v, 0);
      bucket.averageDurationSeconds = Math.round(sum / durations.length);
    } else {
      bucket.averageDurationSeconds = null;
    }
    bucketsMap.set(bucketStart, bucket);
  }

  const buckets = Array.from(bucketsMap.values()).sort(
    (a, b) => a.bucketStart - b.bucketStart,
  );

  return {
    restaurantId: ctx.restaurantId,
    period: ctx.period,
    buckets,
  };
};

// ─────────────────────────────────────────────────────────────
// CANCELLATION STATS
// ─────────────────────────────────────────────────────────────

export const buildCancellationStats = (
  events: IntegrationEvent[],
  ctx: AggregationContext,
): CancellationStats => {
  let totalCancelledOrders = 0;

  for (const event of events) {
    if (event.type !== 'order.updated') continue;
    if (!isWithinPeriod(event.payload.updatedAt, ctx.period)) continue;
    if (event.payload.status === 'cancelled') {
      totalCancelledOrders += 1;
    }
  }

  // v1: tudo é considerado "simples" até termos mais metadados
  const simpleCancellations = totalCancelledOrders;

  return {
    restaurantId: ctx.restaurantId,
    period: ctx.period,
    breakdown: {
      totalCancelledOrders,
      simpleCancellations,
      otherCancellations: 0,
    },
  };
};

// ─────────────────────────────────────────────────────────────
// GAMIFICATION IMPACT (v1 simplificado)
// ─────────────────────────────────────────────────────────────

/**
 * Para v1, tratamos impacto da gamificação como comparação de
 * janelas temporais quaisquer. A definição das janelas fica a
 * cargo da camada de aplicação (hooks/API).
 *
 * Aqui só calculamos métricas básicas a partir de eventos de ordem.
 */
export interface GamificationImpactInputWindow {
  id: string;
  label: string;
  period: TimeRange;
}

export interface GamificationImpactInput {
  windows: GamificationImpactInputWindow[];
  context: AggregationContext;
}

export const buildGamificationImpact = (
  events: IntegrationEvent[],
  input: GamificationImpactInput,
): GamificationImpact => {
  const points: GamificationImpactPoint[] = [];

  for (const window of input.windows) {
    let ordersCount = 0;
    let totalCents = 0;

    for (const event of events) {
      if (
        event.type === 'order.completed' &&
        isWithinPeriod(event.payload.completedAt, window.period)
      ) {
        ordersCount += 1;
        totalCents += event.payload.totalCents;
      }
    }

    const averageTicketCents =
      ordersCount > 0 ? Math.round(totalCents / ordersCount) : 0;

    points.push({
      windowStart: window.period.from,
      windowLabel: window.label,
      ordersCount,
      averageTicketCents,
    });
  }

  const globalFrom = Math.min(...input.windows.map((w) => w.period.from));
  const globalTo = Math.max(...input.windows.map((w) => w.period.to));

  return {
    restaurantId: input.context.restaurantId,
    campaignId: undefined,
    metricWindow: { from: globalFrom, to: globalTo },
    points,
  };
};

