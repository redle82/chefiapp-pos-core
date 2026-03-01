/**
 * Hook para verificar status do onboarding
 *
 * FASE 2 - Onboarding com Primeira Venda
 *
 * Funcionalidades:
 * - Verificar se menu foi criado (contar itens em gm_products)
 * - Verificar se primeira venda foi feita (contar pedidos em gm_orders)
 */

// LEGACY / LAB — blocked in Docker mode
import { useEffect, useState } from "react";
import { useTenantId } from "../core/runtime/tenantAccess";

// LEGACY: Supabase client removed — Docker Core only
const supabase = null as any;

export interface OnboardingStatus {
  hasMenu: boolean;
  hasFirstSale: boolean;
  menuItemsCount: number;
  ordersCount: number;
  loading: boolean;
  error: string | null;
}

export function useOnboardingStatus() {
  const [status, setStatus] = useState<OnboardingStatus>({
    hasMenu: false,
    hasFirstSale: false,
    menuItemsCount: 0,
    ordersCount: 0,
    loading: true,
    error: null,
  });

  const restaurantId = useTenantId();

  useEffect(() => {
    if (!restaurantId) {
      setStatus((prev) => ({ ...prev, loading: false }));
      return;
    }

    const checkStatus = async () => {
      setStatus((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Verificar menu (contar itens em gm_products)
        // Nota: com head: true, não podemos usar select('*'), então usamos 'id'
        const { count: menuCount, error: menuError } = await supabase
          .from("gm_products")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId)
          .eq("available", true);

        if (menuError) {
          console.warn("[useOnboardingStatus] Error checking menu:", menuError);
        }

        // Verificar primeira venda (contar pedidos pagos/completados em gm_orders)
        // Order status: OPEN → PREPARING → IN_PREP → READY → CLOSED (DB state machine)
        // Payment tracking: payment_status column (PENDING → PAID / PARTIALLY_PAID)
        // When fully paid, process_order_payment sets status='CLOSED' + payment_status='PAID'
        const { data: paidOrders, error: ordersError } = await supabase
          .from("gm_orders")
          .select("id")
          .eq("restaurant_id", restaurantId)
          .eq("payment_status", "PAID");

        const uniqueOrderIds = new Set(
          paidOrders?.map((o: Record<string, any>) => o.id) || [],
        );
        const ordersCount = uniqueOrderIds.size;

        if (ordersError) {
          console.warn(
            "[useOnboardingStatus] Error checking orders:",
            ordersError,
          );
        }

        setStatus({
          hasMenu: (menuCount || 0) > 0,
          hasFirstSale: (ordersCount || 0) > 0,
          menuItemsCount: menuCount || 0,
          ordersCount: ordersCount || 0,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        console.error("[useOnboardingStatus] Error:", err);
        setStatus((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Erro ao verificar status do onboarding",
        }));
      }
    };

    checkStatus();

    // Polling a cada 30 segundos para atualizar status
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, [restaurantId]);

  return status;
}
