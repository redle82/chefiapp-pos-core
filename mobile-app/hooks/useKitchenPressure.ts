/**
 * useKitchenPressure - SEMANA 3: KDS COMO REI
 * 
 * Detecta saturação da cozinha e retorna sinais para o TPV
 * - "Cozinha saturada" → esconde pratos demorados
 * - "Prato lento ativo" → prioriza bebidas/rápidos
 */

import { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { supabase } from '@/services/supabase';

export type KitchenPressure = 'low' | 'medium' | 'high';

interface KitchenPressureState {
    pressure: KitchenPressure;
    preparingCount: number;
    slowItemsActive: boolean;
    shouldHideSlowItems: boolean;
}

// Tempo médio de preparo por categoria (em minutos)
const PREP_TIME: Record<string, number> = {
    'food': 20, // Pratos: 20min
    'drink': 3, // Bebidas: 3min
    'other': 10,
};

// Considera "lento" se tempo de preparo > 15min
const SLOW_THRESHOLD = 15;

export function useKitchenPressure(): KitchenPressureState {
    const { orders } = useOrder();
    const [pressure, setPressure] = useState<KitchenPressure>('low');
    const [preparingCount, setPreparingCount] = useState(0);
    const [slowItemsActive, setSlowItemsActive] = useState(false);

    useEffect(() => {
        // Contar pedidos em preparo
        const preparing = orders.filter(o => 
            o.status === 'preparing' || o.status === 'pending'
        );
        const count = preparing.length;

        setPreparingCount(count);

        // Determinar pressão
        let newPressure: KitchenPressure = 'low';
        if (count > 10) newPressure = 'high';
        else if (count > 5) newPressure = 'medium';

        setPressure(newPressure);

        // Verificar se há itens lentos ativos
        const hasSlowItems = preparing.some(order => {
            return order.items.some(item => {
                const prepTime = PREP_TIME[item.category] || 10;
                return prepTime > SLOW_THRESHOLD;
            });
        });

        setSlowItemsActive(hasSlowItems);
    }, [orders]);

    // Esconder pratos lentos se cozinha saturada OU se há pratos lentos ativos
    const shouldHideSlowItems = pressure === 'high' || (pressure === 'medium' && slowItemsActive);

    return {
        pressure,
        preparingCount,
        slowItemsActive,
        shouldHideSlowItems,
    };
}
