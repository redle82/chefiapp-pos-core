/**
 * useTPVEventBridge — Connects TPV HUB modules to TPVCentralEvents.
 *
 * - Subscribes to all relevant event types
 * - Maintains a queue of recent alerts for the notification bar
 * - Provides utility to emit kitchen pressure updates
 */

import { useCallback, useEffect, useRef, useState } from "react";
import tpvEventBus, {
  createEvent,
  type KitchenPressurePayload,
  type OrderExceptionPayload,
  type TableAlertPayload,
  type OperatorBroadcastPayload,
  type TPVCentralEventType,
} from "../../../core/tpv/TPVCentralEvents";

// ---------------------------------------------------------------------------
// Alert model
// ---------------------------------------------------------------------------

export interface TPVAlert {
  id: string;
  type: TPVCentralEventType;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: Date;
  dismissed: boolean;
}

const MAX_ALERTS = 20;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTPVEventBridge() {
  const [alerts, setAlerts] = useState<TPVAlert[]>([]);
  const prevPressureRef = useRef<"low" | "medium" | "high">("low");

  // ---- Subscribe to events ----
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Kitchen pressure changes
    unsubs.push(
      tpvEventBus.on<KitchenPressurePayload>(
        "kitchen.pressure_change",
        (event) => {
          const p = event.payload as KitchenPressurePayload;
          const severity =
            p.currentLevel === "high"
              ? "critical"
              : p.currentLevel === "medium"
              ? "warning"
              : "info";

          const message =
            p.currentLevel === "high"
              ? `⚠️ Pressão cozinha ALTA: ${p.delayedOrders} atrasado(s), espera ~${p.averageWaitMinutes}min`
              : p.currentLevel === "medium"
              ? `🟡 Cozinha com carga média: ${p.activeOrders} pedidos activos`
              : `✅ Cozinha normalizada: ${p.activeOrders} pedidos`;

          addAlert(event.id, "kitchen.pressure_change", message, severity);
        },
      ),
    );

    // Order exceptions
    unsubs.push(
      tpvEventBus.on("order.exception", (event) => {
        const p = event.payload as OrderExceptionPayload;
        addAlert(
          event.id,
          "order.exception",
          `🚨 Exceção mesa ${p.tableNumber}: ${p.description}`,
          "critical",
        );
      }),
    );

    // Table alerts
    unsubs.push(
      tpvEventBus.on("table.alert", (event) => {
        const p = event.payload as TableAlertPayload;
        addAlert(
          event.id,
          "table.alert",
          `📍 Mesa ${p.tableNumber}: ${p.message}`,
          p.severity === "high"
            ? "critical"
            : p.severity === "medium"
            ? "warning"
            : "info",
        );
      }),
    );

    // Operator broadcasts
    unsubs.push(
      tpvEventBus.on("operator.broadcast", (event) => {
        const p = event.payload as OperatorBroadcastPayload;
        addAlert(
          event.id,
          "operator.broadcast",
          `📢 ${p.operatorName}: ${p.message}`,
          p.priority === "urgent"
            ? "critical"
            : p.priority === "warning"
            ? "warning"
            : "info",
        );
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  // ---- Helpers ----
  const addAlert = (
    id: string,
    type: TPVCentralEventType,
    message: string,
    severity: "info" | "warning" | "critical",
  ) => {
    setAlerts((prev) => {
      const next = [
        {
          id,
          type,
          message,
          severity,
          timestamp: new Date(),
          dismissed: false,
        },
        ...prev,
      ];
      return next.slice(0, MAX_ALERTS);
    });
  };

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a)),
    );
  }, []);

  const dismissAll = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, dismissed: true })));
  }, []);

  // ---- Emit kitchen pressure based on order stats ----
  const emitKitchenPressure = useCallback(
    (stats: {
      totalOrders: number;
      delayedOrders: number;
      averageWaitMinutes: number;
    }) => {
      const level: "low" | "medium" | "high" =
        stats.delayedOrders >= 3 || stats.totalOrders >= 8
          ? "high"
          : stats.delayedOrders >= 1 || stats.totalOrders >= 4
          ? "medium"
          : "low";

      // Only emit if pressure changed
      if (level !== prevPressureRef.current) {
        const payload: KitchenPressurePayload = {
          previousLevel: prevPressureRef.current,
          currentLevel: level,
          activeOrders: stats.totalOrders,
          delayedOrders: stats.delayedOrders,
          averageWaitMinutes: stats.averageWaitMinutes,
        };
        prevPressureRef.current = level;
        tpvEventBus.emit(
          createEvent("kitchen.pressure_change", payload, "system"),
        );
      }
    },
    [],
  );

  const activeAlerts = alerts.filter((a) => !a.dismissed);

  return {
    alerts: activeAlerts,
    allAlerts: alerts,
    dismissAlert,
    dismissAll,
    emitKitchenPressure,
  };
}
