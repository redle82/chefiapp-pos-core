/**
 * USE APPSTAFF ORDERS — Hook Isolado
 *
 * FASE 3.3: Limpeza de Imports Cruzados
 *
 * Hook próprio do AppStaff para ler pedidos diretamente do Core.
 * Não depende de TPV/context.
 */

import { useEffect, useState } from "react";
// FASE 3.5: Migrado para OrderReader (usa dockerCoreClient)
import type {
  CoreOrder,
  CoreOrderItem,
} from "../../../core-boundary/docker-core/types";
import {
  readActiveOrders,
  readOrderItems,
} from "../../../core-boundary/readers/OrderReader";

interface UseAppStaffOrdersResult {
  orders: (CoreOrder & { items: CoreOrderItem[] })[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para ler pedidos ativos diretamente do Core.
 *
 * Isolado do TPV - AppStaff não depende de TPV/context.
 */
export function useAppStaffOrders(
  restaurantId: string | null,
): UseAppStaffOrdersResult {
  const [orders, setOrders] = useState<
    (CoreOrder & { items: CoreOrderItem[] })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // FASE 3.5: Usa OrderReader (dockerCoreClient) em vez de OrderReaderDirect (fetch direto)
      const activeOrders = await readActiveOrders(restaurantId);
      const ordersWithItems = await Promise.all(
        activeOrders.map(async (order) => {
          const items = await readOrderItems(order.id);
          return { ...order, items };
        }),
      );

      setOrders(ordersWithItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Polling a cada 30s (mesmo padrão do KDSMinimal)
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  return {
    orders,
    loading,
    error,
    refetch: loadOrders,
  };
}
