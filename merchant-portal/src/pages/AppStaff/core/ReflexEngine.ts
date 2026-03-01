// LEGACY / LAB — blocked in Docker mode via core/supabase shim (Core-only or no-op when Docker)
import { useEffect } from "react";
import type { Task } from "../context/StaffCoreTypes";
import { useAppStaffOrders } from "../hooks/useAppStaffOrders";

// REFLEX DEFINITIONS
// 1. "Cashier cleared order" -> "Table needs cleaning"

// 🧠 CACHE (Session Memory to avoid DB spam)
const sessionReflexCache = new Set<string>();

export const useReflexEngine = (
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  notifyActivity: () => void,
  restaurantId: string | null,
) => {
  // FASE 3.3: Isolado - AppStaff não depende de TPV
  const { orders: appStaffOrders } = useAppStaffOrders(restaurantId);
  // Converter para formato esperado
  const orders = appStaffOrders.map((order) => ({
    id: order.id,
    status: (order.status === "OPEN"
      ? "new"
      : order.status === "IN_PREP"
      ? "preparing"
      : order.status === "READY"
      ? "ready"
      : order.status === "CLOSED"
      ? "paid"
      : order.status === "CANCELLED"
      ? "cancelled"
      : "new") as
      | "new"
      | "preparing"
      | "ready"
      | "served"
      | "paid"
      | "partially_paid"
      | "cancelled",
    tableNumber: order.table_number || undefined,
  }));

  useEffect(() => {
    if (!orders) return;

    const processReflexes = async () => {
      const { BackendType, getBackendType } = await import(
        "../../../core/infra/backendAdapter"
      );
      const { getDockerCoreFetchClient } = await import(
        "../../../core/infra/dockerCoreFetchClient"
      );
      const rId = restaurantId;
      if (!rId) return;
      // ANTI-SUPABASE §4: Reflex domain ONLY via Core. Skip when not Docker.
      if (getBackendType() !== BackendType.docker) return;

      const core = getDockerCoreFetchClient();

      // REFLEX 1: TABLE CLEANING
      const paidOrders = orders.filter((o) => o.status === "paid");

      for (const order of paidOrders) {
        const reflexKey = "clean-table";
        const targetId = order.id;
        const taskId = `${reflexKey}-${order.tableNumber}-${targetId.slice(
          0,
          4,
        )}`;
        const cacheKey = `${reflexKey}:${targetId}`;

        if (sessionReflexCache.has(cacheKey)) continue;

        // L2 DB Check (Core only)
        const existingRes = await core
          .from("reflex_firings")
          .select("id")
          .eq("restaurant_id", rId)
          .eq("reflex_key", reflexKey)
          .eq("target_id", targetId)
          .maybeSingle();

        if (existingRes.data) {
          sessionReflexCache.add(cacheKey);
          continue;
        }

        console.log("⚡ REFLEX FIRED (Idempotent):", taskId);

        const insertReflex = await core
          .from("reflex_firings")
          .insert({
            restaurant_id: rId,
            reflex_key: reflexKey,
            target_id: targetId,
          })
          .then((r) => r);
        if (insertReflex.error) continue;
        sessionReflexCache.add(cacheKey);

        const newTask: Task = {
          id: taskId,
          type: "maintenance",
          title: `Limpar Mesa ${order.tableNumber}`,
          description: "Cliente pagou. Mesa livre.",
          status: "pending",
          priority: "high",
          riskLevel: 20,
          assigneeRole: "waiter",
          uiMode: "check",
          reason: "Financial Closure Event",
          createdAt: Date.now(),
        };

        core
          .from("app_tasks")
          .insert({
            id: newTask.id,
            restaurant_id: rId,
            title: newTask.title,
            description: newTask.description,
            status: "pending",
            priority: newTask.priority,
            type: newTask.type,
            assignee_role: newTask.assigneeRole,
            created_at: new Date(newTask.createdAt).toISOString(),
          })
          .then((r) => {
            if (r.error) console.error("Reflex Task Insert Failed:", r.error);
          });

        setTasks((prev) => {
          if (prev.some((t) => t.id === taskId)) return prev; // Double tap protection
          return [...prev, newTask];
        });
        notifyActivity();
      }
    };

    processReflexes();
  }, [orders]); // Reacts whenever orders change (Realtime)
};
