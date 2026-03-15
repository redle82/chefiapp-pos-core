// KDS_DOMAIN_CONTRACT
// Fonte única para enums, thresholds e helpers puros usados por todas as superfícies
// de KDS (TPV, painéis Electron, mini KDS no AppStaff, KDS mobile).

import type { CoreOrderItem } from "../../infra/docker-core/types";
import type { ActiveOrderRow } from "../../infra/readers/OrderReader";

export const KDS_LATE_THRESHOLD_MINUTES = 15;

export type KdsCanonicalOrigin = "DELIVERY" | "WEB" | "APP" | "QR" | "OTHER";

export function resolveOrderOrigin(
  order: Pick<ActiveOrderRow, "origin" | "source">,
): KdsCanonicalOrigin {
  const raw = (order.origin ?? order.source ?? "").toString().toLowerCase();
  if (!raw) return "OTHER";
  if (raw.includes("delivery")) return "DELIVERY";
  if (raw === "web" || raw.includes("web_public")) return "WEB";
  if (raw === "app" || raw.includes("mobile") || raw.includes("appstaff")) return "APP";
  if (raw.includes("qr")) return "QR";
  return "OTHER";
}

export function isLateOrder(
  createdAt: string | Date | null | undefined,
  nowMs: number = Date.now(),
  thresholdMinutes: number = KDS_LATE_THRESHOLD_MINUTES,
): boolean {
  if (!createdAt) return false;
  const createdMs =
    typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt.getTime();
  if (!Number.isFinite(createdMs)) return false;
  const elapsedMinutes = (nowMs - createdMs) / 60000;
  return elapsedMinutes >= thresholdMinutes;
}

export type KdsStationFilter = "ALL" | "BAR" | "KITCHEN";

export function filterOrdersByStation<T extends { items: CoreOrderItem[] }>(
  orders: T[],
  stationFilter: KdsStationFilter,
): T[] {
  if (stationFilter === "ALL") return orders;
  return orders
    .map((order) => ({
      ...order,
      items: order.items.filter((item) => item.station === stationFilter),
    }))
    .filter((order) => order.items.length > 0);
}

