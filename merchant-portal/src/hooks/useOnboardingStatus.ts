/**
 * Hook para verificar status do onboarding
 * 
 * FASE 2 - Onboarding com Primeira Venda
 * 
 * Funcionalidades:
 * - Verificar se menu foi criado (contar itens em gm_products)
 * - Verificar se primeira venda foi feita (contar pedidos em gm_orders)
 */

import { useState, useEffect } from 'react';
import { supabase } from '../core/supabase';
import { getTabIsolated } from '../core/storage/TabIsolatedStorage';

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

    const restaurantId = getTabIsolated('chefiapp_restaurant_id');

    useEffect(() => {
        if (!restaurantId) {
            setStatus(prev => ({ ...prev, loading: false }));
            return;
        }

        const checkStatus = async () => {
            setStatus(prev => ({ ...prev, loading: true, error: null }));

            try {
                // Verificar menu (contar itens em gm_products)
                // Nota: com head: true, não podemos usar select('*'), então usamos 'id'
                const { count: menuCount, error: menuError } = await supabase
                    .from('gm_products')
                    .select('id', { count: 'exact', head: true })
                    .eq('restaurant_id', restaurantId)
                    .eq('available', true);

                if (menuError) {
                    console.warn('[useOnboardingStatus] Error checking menu:', menuError);
                }

                // Verificar primeira venda (contar pedidos pagos/completados em gm_orders)
                // Buscar pedidos com payment_status='paid' (status PAID não existe no enum order_status)
                // O enum order_status tem: pending, preparing, ready, delivered, canceled
                // Para pedidos pagos, usamos payment_status='paid'
                const { data: paidOrders, error: ordersError } = await supabase
                    .from('gm_orders')
                    .select('id')
                    .eq('restaurant_id', restaurantId)
                    .eq('payment_status', 'paid');
                
                // Contar IDs únicos (caso algum pedido tenha ambos status='PAID' e payment_status='paid')
                const uniqueOrderIds = new Set(paidOrders?.map(o => o.id) || []);
                const ordersCount = uniqueOrderIds.size;

                if (ordersError) {
                    console.warn('[useOnboardingStatus] Error checking orders:', ordersError);
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
                console.error('[useOnboardingStatus] Error:', err);
                setStatus(prev => ({
                    ...prev,
                    loading: false,
                    error: err.message || 'Erro ao verificar status do onboarding',
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
