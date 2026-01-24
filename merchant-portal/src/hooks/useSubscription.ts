/**
 * Hook para gerenciar subscription do restaurante
 * 
 * Funcionalidades:
 * - Buscar subscription atual
 * - Criar subscription (trial ou pago)
 * - Verificar status da subscription
 */

import { useState, useEffect } from 'react';
import { supabase } from '../core/supabase';
import { getTabIsolated } from '../core/storage/TabIsolatedStorage';
import type { SubscriptionStatus, PlanTier } from '../../../billing-core/types';

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
    const restaurantId = getTabIsolated('chefiapp_restaurant_id');

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
            // Buscar subscription da tabela 'subscriptions' (billing-core)
            const { data, error: fetchError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .single();

            if (fetchError) {
                // PGRST116 = nenhum resultado (normal no onboarding)
                // PGRST205 = tabela não encontrada (migration não aplicada ainda)
                if (fetchError.code === 'PGRST116' || fetchError.code === 'PGRST205') {
                    setSubscription(null);
                    setLoading(false);
                    return;
                }
                throw fetchError;
            }

            if (data) {
                setSubscription({
                    subscription_id: data.subscription_id,
                    restaurant_id: data.restaurant_id,
                    plan_id: data.plan_id,
                    plan_tier: data.plan_tier as PlanTier,
                    status: data.status as SubscriptionStatus,
                    trial_ends_at: data.trial_ends_at,
                    current_period_end: data.current_period_end,
                    next_payment_at: data.next_payment_at,
                    enabled_features: data.enabled_features || [],
                });
            }
        } catch (err: any) {
            console.error('[useSubscription] Error:', err);
            setError(err.message || 'Erro ao buscar subscription');
        } finally {
            setLoading(false);
        }
    };

    const createSubscription = async (planId: string, startTrial: boolean = true): Promise<Subscription> => {
        if (!restaurantId) throw new Error('Restaurant ID não encontrado');

        try {
            // FASE 1: Chamar Edge Function create-subscription
            const { data, error: createError } = await supabase.functions.invoke('create-subscription', {
                body: {
                    restaurant_id: restaurantId,
                    plan_id: planId,
                    start_trial: startTrial,
                }
            });

            if (createError) throw createError;
            if (data?.error) throw new Error(data.error);

            // Atualizar subscription local
            if (data?.subscription) {
                const newSubscription: Subscription = {
                    subscription_id: data.subscription.subscription_id,
                    restaurant_id: data.subscription.restaurant_id,
                    plan_id: data.subscription.plan_id,
                    plan_tier: data.subscription.plan_tier as PlanTier,
                    status: data.subscription.status as SubscriptionStatus,
                    trial_ends_at: data.subscription.trial_ends_at,
                    current_period_end: data.subscription.current_period_end,
                    next_payment_at: data.subscription.next_payment_at,
                    enabled_features: data.subscription.enabled_features || [],
                };
                setSubscription(newSubscription);
                return newSubscription;
            }

            throw new Error('Subscription criada mas dados não retornados');
        } catch (err: any) {
            console.error('[useSubscription] Error creating subscription:', err);
            throw err;
        }
    };

    const isActive = (): boolean => {
        if (!subscription) return false;
        return subscription.status === 'ACTIVE' || subscription.status === 'TRIAL';
    };

    const isBlocked = (): boolean => {
        if (!subscription) return true; // Sem subscription = bloqueado
        return subscription.status === 'SUSPENDED' || subscription.status === 'CANCELLED';
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
