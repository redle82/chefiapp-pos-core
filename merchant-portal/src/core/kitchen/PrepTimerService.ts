/**
 * Kitchen Prep Timer Service
 * Manages preparation timers for orders and tracks kitchen load.
 */

export interface PrepTimer {
  orderId: string;
  startedAt: number;
  estimatedMinutes: number;
}

export interface TimerStatus {
  orderId: string;
  elapsedMinutes: number;
  remainingMinutes: number;
  estimatedMinutes: number;
  isOverdue: boolean;
  overdueMinutes: number;
}

export interface KitchenLoad {
  activeOrders: number;
  estimatedWaitMinutes: number;
  status: "ok" | "busy" | "overloaded";
}

const DEFAULT_PREP_TIMES: Record<string, number> = {
  entradas: 10,
  pratos: 20,
  sobremesas: 10,
  bebidas: 3,
  default: 15,
};

const activeTimers = new Map<string, PrepTimer>();
const productPrepTimes = new Map<string, number>();

export function getEstimatedPrepTime(
  items: { categorySlug?: string; prepTimeMinutes?: number }[]
): number {
  if (!items.length) return DEFAULT_PREP_TIMES.default;
  return Math.max(
    ...items.map((item) => {
      if (item.prepTimeMinutes) return item.prepTimeMinutes;
      const slug = (item.categorySlug || "default").toLowerCase();
      return (
        productPrepTimes.get(slug) ??
        DEFAULT_PREP_TIMES[slug] ??
        DEFAULT_PREP_TIMES.default
      );
    })
  );
}

export function startTimer(orderId: string, estimatedMinutes: number): void {
  activeTimers.set(orderId, {
    orderId,
    startedAt: Date.now(),
    estimatedMinutes,
  });
}

export function stopTimer(orderId: string): void {
  activeTimers.delete(orderId);
}

export function getTimerStatus(orderId: string): TimerStatus | null {
  const timer = activeTimers.get(orderId);
  if (!timer) return null;
  const elapsedMs = Date.now() - timer.startedAt;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const remainingMinutes = Math.max(
    0,
    timer.estimatedMinutes - elapsedMinutes
  );
  const isOverdue = elapsedMinutes > timer.estimatedMinutes;
  const overdueMinutes = isOverdue
    ? elapsedMinutes - timer.estimatedMinutes
    : 0;
  return {
    orderId,
    elapsedMinutes,
    remainingMinutes,
    estimatedMinutes: timer.estimatedMinutes,
    isOverdue,
    overdueMinutes,
  };
}

export function updateProductPrepTime(
  productId: string,
  minutes: number
): void {
  productPrepTimes.set(productId, minutes);
}

export function getKitchenLoad(): KitchenLoad {
  const activeOrders = activeTimers.size;
  const timers = Array.from(activeTimers.values());
  const totalRemaining = timers.reduce((sum, t) => {
    const elapsed = (Date.now() - t.startedAt) / 60000;
    return sum + Math.max(0, t.estimatedMinutes - elapsed);
  }, 0);
  const estimatedWaitMinutes = Math.ceil(totalRemaining);
  const status: KitchenLoad["status"] =
    activeOrders <= 5 ? "ok" : activeOrders <= 10 ? "busy" : "overloaded";
  return { activeOrders, estimatedWaitMinutes, status };
}

export function getAllActiveTimers(): TimerStatus[] {
  return Array.from(activeTimers.keys())
    .map((id) => getTimerStatus(id))
    .filter((s): s is TimerStatus => s !== null);
}
