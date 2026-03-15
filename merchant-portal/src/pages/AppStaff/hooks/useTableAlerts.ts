/**
 * useTableAlerts - Hook para alertas automáticos de mesas
 *
 * Detecta:
 * - Mesa sem pedido há X minutos
 * - Mesa com pedido há muito tempo
 * - Mesa precisa de atenção
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useStaff } from "../context/StaffContext";
import type { Task } from "../context/StaffCoreTypes";
import { useAppStaffOrders } from "./useAppStaffOrders";
import { useAppStaffTables } from "./useAppStaffTables";

interface TableAlert {
  tableId: string;
  tableNumber: number;
  type: "no_order" | "long_wait" | "needs_attention";
  message: string;
  severity: "warning" | "error";
  minutes: number;
}

const NO_ORDER_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutos
const LONG_WAIT_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutos

export function useTableAlerts() {
  const { createTask, tasks, coreRestaurantId, operationalContract } =
    useStaff();
  const createTaskRef = useRef(createTask);
  const tasksRef = useRef(tasks);
  createTaskRef.current = createTask;
  tasksRef.current = tasks;

  // FASE 3.3: Core API usa UUID (coreRestaurantId quando contrato é local)
  const restaurantIdForCore =
    coreRestaurantId ?? operationalContract?.id ?? null;
  const { tables: appStaffTables } = useAppStaffTables(restaurantIdForCore);
  const { orders: appStaffOrders } = useAppStaffOrders(restaurantIdForCore);

  // Estabilizar referências para evitar loop no useEffect (tables/orders .map() novos a cada render)
  const tables = useMemo(
    () =>
      appStaffTables.map((table) => ({
        id: table.id,
        number: table.number,
        status: table.status,
        lastOrderAt: null as string | null,
        occupiedAt: null as string | null,
      })),
    [appStaffTables],
  );
  const orders = useMemo(
    () =>
      appStaffOrders.map((order) => ({
        id: order.id,
        tableId: order.table_id || undefined,
        status: (order.status === "OPEN"
          ? "new"
          : order.status === "PREPARING" || order.status === "IN_PREP"
          ? "preparing"
          : order.status === "READY"
          ? "ready"
          : order.status === "CLOSED" || order.status === "PAID"
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
        created_at: order.created_at,
      })),
    [appStaffOrders],
  );

  const [alerts, setAlerts] = useState<TableAlert[]>([]);

  useEffect(() => {
    const newAlerts: TableAlert[] = [];
    const now = Date.now();
    const currentTasks = tasksRef.current;

    // Verificar cada mesa
    for (const table of tables) {
      if (table.status !== "occupied") continue;

      // Buscar pedidos ativos da mesa
      const tableOrders = orders.filter(
        (o) =>
          o.tableId === table.id &&
          o.status !== "paid" &&
          o.status !== "cancelled",
      );

      // ALERTA 1: Mesa sem pedido há muito tempo
      if (tableOrders.length === 0) {
        const lastOrderTime = table.lastOrderAt
          ? new Date(table.lastOrderAt).getTime()
          : table.occupiedAt
          ? new Date(table.occupiedAt).getTime()
          : null;

        if (lastOrderTime) {
          const msWithoutOrder = now - lastOrderTime;
          const minutesWithoutOrder = msWithoutOrder / (60 * 1000);

          if (msWithoutOrder >= NO_ORDER_THRESHOLD_MS) {
            newAlerts.push({
              tableId: table.id,
              tableNumber: table.number,
              type: "no_order",
              message: `Mesa ${table.number} sem pedido há ${Math.floor(
                minutesWithoutOrder,
              )} minutos`,
              severity: minutesWithoutOrder >= 30 ? "error" : "warning",
              minutes: Math.floor(minutesWithoutOrder),
            });
          }
        }
      }

      // ALERTA 2: Mesa com pedido há muito tempo (não pago)
      if (tableOrders.length > 0) {
        const oldestOrder = tableOrders.reduce((oldest, order) => {
          const orderTime = new Date(order.created_at).getTime();
          const oldestTime = oldest ? new Date(oldest.created_at).getTime() : 0;
          return orderTime < oldestTime ? order : oldest;
        }, null as typeof tableOrders[0] | null);

        if (oldestOrder) {
          const orderAgeMs = now - new Date(oldestOrder.created_at).getTime();
          const orderAge = orderAgeMs / (60 * 1000);

          if (orderAgeMs >= LONG_WAIT_THRESHOLD_MS) {
            newAlerts.push({
              tableId: table.id,
              tableNumber: table.number,
              type: "long_wait",
              message: `Mesa ${table.number} com pedido há ${Math.floor(
                orderAge,
              )} minutos`,
              severity: orderAge >= 60 ? "error" : "warning",
              minutes: Math.floor(orderAge),
            });
          }
        }
      }
    }

    setAlerts(newAlerts);

    // Criar tarefas para alertas críticos (usar refs para não re-executar o effect quando tasks/createTask mudam)
    for (const alert of newAlerts) {
      if (alert.severity === "error") {
        const existingTask = currentTasks.find(
          (t: Task) =>
            (
              t as Task & {
                metadata?: { tableId?: string; alertType?: string };
              }
            ).metadata?.tableId === alert.tableId &&
            (t as Task & { metadata?: { alertType?: string } }).metadata
              ?.alertType === alert.type &&
            t.status !== "done",
        );

        if (!existingTask) {
          createTaskRef.current({
            title: alert.message,
            description: `Atenção necessária na mesa ${alert.tableNumber}`,
            priority: "critical",
            role: "waiter",
            metadata: {
              tableId: alert.tableId,
              tableNumber: alert.tableNumber,
              alertType: alert.type,
              minutes: alert.minutes,
            },
          });
        }
      }
    }
  }, [tables, orders]);

  return { alerts };
}
