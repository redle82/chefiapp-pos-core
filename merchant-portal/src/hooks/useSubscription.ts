/**
 * Hook para gerenciar subscription do restaurante
 *
 * Funcionalidades:
 * - Buscar subscription atual do Core (merchant_subscriptions table)
 * - Quando tabela não existe ou está vazia: subscription = null (UI mostra estado vazio/setup)
 * - Verificar status da subscription
 *
 * Fonte de verdade: Core DB (Docker / PostgREST).
 * ANTI-SUPABASE §4: Subscription domain ONLY via Core. No Supabase fetch/create path.
 */

import { useCallback, useEffect, useState } from "react";
import type { PlanTier, SubscriptionStatus } from "../../../billing-core/types";
import { getSubscription as fetchCoreSubscription } from "../core/billing/coreBillingApi";
import { BackendType, getBackendType } from "../core/infra/backendAdapter";
import { getTabIsolated } from "../core/storage/TabIsolatedStorage";

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

/** Map DB plan_id to PlanTier */
function planIdToTier(planId: string): PlanTier {
  const map: Record<string, PlanTier> = {
    starter: "starter",
    pro: "pro",
    enterprise: "enterprise",
    free: "free",
    trial: "trial",
  };
  return map[planId] ?? "starter";
}

/** Map DB status to SubscriptionStatus */
function normalizeStatus(dbStatus: string): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    incomplete: "incomplete",
    paused: "paused",
    // Legacy uppercase from old migration
    TRIAL: "trialing",
    ACTIVE: "active",
    PAST_DUE: "past_due",
    SUSPENDED: "paused",
    CANCELLED: "canceled",
  };
  return map[dbStatus] ?? "trialing";
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const restaurantId = getTabIsolated("chefiapp_restaurant_id");

  const fetchSubscription = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // ANTI-SUPABASE §4: Subscription read ONLY via Core.
      if (getBackendType() !== BackendType.docker) {
        setError(
          "Subscription requires Docker Core. Supabase domain fallback is forbidden.",
        );
        setLoading(false);
        return;
      }

      // Try fetching real subscription from Core DB
      const row = await fetchCoreSubscription(restaurantId);

      if (row) {
        // Real data from merchant_subscriptions table
        const sub: Subscription = {
          subscription_id: row.id,
          restaurant_id: row.restaurant_id,
          plan_id: row.plan_id,
          plan_tier: planIdToTier(row.plan_id),
          status: normalizeStatus(row.status),
          trial_ends_at: row.trial_end ?? undefined,
          current_period_end: row.current_period_end,
          next_payment_at: row.current_period_end, // Same until Stripe provides next_payment_at
          enabled_features: [], // Populated from plan features when needed
        };
        setSubscription(sub);
      } else {
        // No subscription row in Core — UI shows empty/setup state
        setSubscription(null);
      }
    } catch (err: unknown) {
      console.error("[useSubscription] Error:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao buscar subscription",
      );
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const createSubscription = async (
    _planId: string,
    _startTrial: boolean = true,
  ): Promise<Subscription> => {
    if (!restaurantId) throw new Error("Restaurant ID não encontrado");
    // ANTI-SUPABASE §4: Create subscription ONLY via Core.
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
    return (
      subscription.status === "active" || subscription.status === "trialing"
    );
  };

  const isBlocked = (): boolean => {
    if (!subscription) return true;
    return (
      subscription.status === "canceled" || subscription.status === "paused"
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
