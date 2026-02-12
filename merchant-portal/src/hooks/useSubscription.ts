/**
 * Hook para gerenciar subscription do restaurante
 *
 * Funcionalidades:
 * - Buscar subscription atual
 * - Criar subscription (trial ou pago)
 * - Verificar status da subscription
 *
 * Em modo Docker: não usa Supabase; devolve estado mock "trial" para a Billing page
 * renderizar (Período de teste + botão Ativar agora). Checkout continua via Core RPC.
 */

import { useEffect, useState } from "react";
import type { PlanTier, SubscriptionStatus } from "../../../billing-core/types";
import { BackendType, getBackendType } from "../core/infra/backendAdapter";
import { getTabIsolated } from "../core/storage/TabIsolatedStorage";
// ANTI-SUPABASE §4: Subscription domain ONLY via Core. No Supabase fetch/create path.

export interface Subscription {
  subscription_id: string;
  restaurant_id: string;
  plan_id: string;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  trial_ends_at?: string;
  current_period_end: string;
  next_payment_at: string;
  enabled_features: string[];
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const restaurantId = getTabIsolated("chefiapp_restaurant_id");

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    fetchSubscription();
  }, [restaurantId]);

  const fetchSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      // ANTI-SUPABASE §4: Subscription read ONLY via Core. If not Docker, fail explicit (no Supabase path).
      if (getBackendType() !== BackendType.docker) {
        setError(
          "Subscription requires Docker Core. Supabase domain fallback is forbidden.",
        );
        setLoading(false);
        return;
      }

      // Docker Core: trial mock for Billing page; real subscription when Core exposes subscriptions table/RPC
      const mock: Subscription = {
        subscription_id: "trial-access",
        restaurant_id: restaurantId ?? "",
        plan_id: "",
        plan_tier: "standard" as PlanTier,
        status: "TRIAL" as SubscriptionStatus,
        trial_ends_at: undefined,
        current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        next_payment_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        enabled_features: [],
      };
      setSubscription(restaurantId ? mock : null);
    } catch (err: any) {
      console.error("[useSubscription] Error:", err);
      setError(err.message || "Erro ao buscar subscription");
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (
    planId: string,
    startTrial: boolean = true,
  ): Promise<Subscription> => {
    if (!restaurantId) throw new Error("Restaurant ID não encontrado");
    // ANTI-SUPABASE §4: Create subscription ONLY via Core. No Supabase functions.invoke.
    if (getBackendType() !== BackendType.docker) {
      throw new Error(
        "Create subscription requires Docker Core. Supabase domain fallback is forbidden.",
      );
    }
    throw new Error(
      'Use o botão "Ativar agora" na página de Billing (checkout via Core).',
    );
  };

  const isActive = (): boolean => {
    if (!subscription) return false;
    return subscription.status === "ACTIVE" || subscription.status === "TRIAL";
  };

  const isBlocked = (): boolean => {
    if (!subscription) return true; // Sem subscription = bloqueado
    return (
      subscription.status === "SUSPENDED" || subscription.status === "CANCELLED"
    );
  };

  return {
    subscription,
    loading,
    error,
    isActive: isActive(),
    isBlocked: isBlocked(),
    refetch: fetchSubscription,
    createSubscription,
  };
}
