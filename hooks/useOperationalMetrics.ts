// hooks/useOperationalMetrics.ts
import { useOperationalStore } from "../store/useOperationalStore";

export function useOperationalMetrics() {
  const dailyRevenue = useOperationalStore((s) => s.dailyRevenue);
  const activeOrders = useOperationalStore((s) => s.activeOrders);
  const avgTicket = useOperationalStore((s) => s.avgTicket);
  const kitchenLoad = useOperationalStore((s) => s.kitchenLoad);
  const mode = useOperationalStore((s) => s.mode);
  return { dailyRevenue, activeOrders, avgTicket, kitchenLoad, mode };
}
