/**
 * useMobileKDS — Simplified KDS hook for KDS Mobile
 *
 * Wraps kitchen store and order APIs with mobile-friendly interface.
 * Handles: ticket filtering by status, start preparing, mark ready.
 *
 * @example
 * const { tickets, counts, startPreparing, markReady } = useMobileKDS(restaurantId);
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CONFIG } from "../../../config";
import { Logger } from "../../../core/logger";
import { ConnectivityService } from "../../../core/sync/ConnectivityService";
import { markItemReady } from "../../../infra/writers/OrderWriter";

export type KDSTicketStatus = "pending" | "preparing" | "ready";

export interface KDSTicketItem {
  id: string;
  name: string;
  quantity: number;
  modifications?: string;
}

export interface KDSTicket {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  status: KDSTicketStatus;
  items: KDSTicketItem[];
  createdAt: Date;
  startedAt?: Date;
}

interface UseMobileKDSReturn {
  // State
  tickets: KDSTicket[];
  activeTab: KDSTicketStatus;
  isLoading: boolean;
  isOffline: boolean;

  // Counts
  counts: {
    pending: number;
    preparing: number;
    ready: number;
  };

  // Actions
  setActiveTab: (tab: KDSTicketStatus) => void;
  startPreparing: (ticketId: string) => Promise<void>;
  markReady: (ticketId: string) => Promise<void>;
  refresh: () => void;
}

export function useMobileKDS(restaurantId: string): UseMobileKDSReturn {
  const [allTickets, setAllTickets] = useState<KDSTicket[]>([]);
  const [activeTab, setActiveTab] = useState<KDSTicketStatus>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(() =>
    ConnectivityService.isOffline(),
  );

  // Fase 3: fonte única de conectividade
  useEffect(() => {
    const unsub = ConnectivityService.subscribe((status) => {
      setIsOffline(status !== "online");
    });
    return unsub;
  }, []);

  // Fetch orders from Core
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      const url = `${CONFIG.CORE_URL}/rest/v1/gm_orders?restaurant_id=eq.${restaurantId}&status=in.(OPEN,IN_PREP,READY)&select=*,gm_order_items(*)&order=created_at.asc`;
      const headers = {
        apikey: CONFIG.CORE_ANON_KEY,
        "Content-Type": "application/json",
      };

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const orders = await response.json();

      // Transform to KDS tickets
      const tickets: KDSTicket[] = orders.map(
        (order: {
          id: string;
          order_number?: string;
          table_id?: string;
          status: string;
          created_at: string;
          started_at?: string;
          gm_order_items?: Array<{
            id: string;
            product_name?: string;
            quantity: number;
            notes?: string;
          }>;
        }) => {
          // Map database status (uppercase) to UI status (lowercase)
          let status: KDSTicketStatus = "pending";
          if (order.status === "IN_PREP") status = "preparing";
          else if (order.status === "READY") status = "ready";
          // OPEN maps to pending (default)

          return {
            id: order.id,
            orderNumber:
              order.order_number ?? order.id.slice(0, 6).toUpperCase(),
            tableNumber: order.table_id
              ? `Mesa ${order.table_id.slice(-2)}`
              : undefined,
            status,
            items: (order.gm_order_items ?? []).map((item) => ({
              id: item.id,
              name: item.product_name ?? "Item",
              quantity: item.quantity,
              modifications: item.notes,
            })),
            createdAt: new Date(order.created_at || new Date().toISOString()),
            startedAt: order.started_at
              ? new Date(order.started_at)
              : undefined,
          };
        },
      );

      setAllTickets(tickets);
    } catch (error) {
      Logger.error("KDS fetch error:", error);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  // Initial fetch + polling
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Filter tickets by active tab
  const tickets = useMemo(
    () => allTickets.filter((t) => t.status === activeTab),
    [allTickets, activeTab],
  );

  // Count by status
  const counts = useMemo(
    () => ({
      pending: allTickets.filter((t) => t.status === "pending").length,
      preparing: allTickets.filter((t) => t.status === "preparing").length,
      ready: allTickets.filter((t) => t.status === "ready").length,
    }),
    [allTickets],
  );

  // Start preparing
  const startPreparing = useCallback(
    async (ticketId: string) => {
      try {
        // Optimistic update
        setAllTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: "preparing" as KDSTicketStatus,
                  startedAt: new Date(),
                }
              : t,
          ),
        );

        // Update in backend
        const url = `${CONFIG.CORE_URL}/rest/v1/gm_orders?id=eq.${ticketId}`;
        await fetch(url, {
          method: "PATCH",
          headers: {
            apikey: CONFIG.CORE_ANON_KEY,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            status: "IN_PREP",
            started_at: new Date().toISOString(),
          }),
        });
      } catch (error) {
        Logger.error("Start preparing error:", error);
        // Revert on error
        fetchOrders();
      }
    },
    [fetchOrders],
  );

  // Mark ready
  const markReady = useCallback(
    async (ticketId: string) => {
      try {
        // Optimistic update
        setAllTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? { ...t, status: "ready" as KDSTicketStatus }
              : t,
          ),
        );

        // Use existing writer
        await markItemReady(ticketId, restaurantId);
      } catch (error) {
        Logger.error("Mark ready error:", error);
        fetchOrders();
      }
    },
    [fetchOrders, restaurantId],
  );

  return {
    tickets,
    activeTab,
    isLoading,
    isOffline,
    counts,
    setActiveTab,
    startPreparing,
    markReady,
    refresh: fetchOrders,
  };
}
