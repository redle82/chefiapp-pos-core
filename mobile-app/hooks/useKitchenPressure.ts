/**
 * useKitchenPressure - SEMANA 3: KDS COMO REI
 * 
 * Detecta saturação da cozinha e retorna sinais para o TPV
 * - "Cozinha saturada" → esconde pratos demorados
 * - "Prato lento ativo" → prioriza bebidas/rápidos
 * 
 * v1.2.0: Debounce para evitar piscadas no indicador
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useOrder } from '@/context/OrderContext';

export type KitchenPressure = 'low' | 'medium' | 'high';

interface KitchenPressureState {
    pressure: KitchenPressure;
    preparingCount: number;
    slowItemsActive: boolean;
    shouldHideSlowItems: boolean;
    isTransitioning: boolean; // For animations
}

// Tempo médio de preparo por categoria (em minutos)
const PREP_TIME: Record<string, number> = {
    'food': 20, // Pratos: 20min
    'drink': 3, // Bebidas: 3min
    'other': 10,
};

// Considera "lento" se tempo de preparo > 15min
const SLOW_THRESHOLD = 15;

// Debounce time to prevent flickering (ms)
const PRESSURE_DEBOUNCE_MS = 1000;

export function useKitchenPressure(): KitchenPressureState {
    const { orders } = useOrder();
    const [pressure, setPressure] = useState<KitchenPressure>('low');
    const [preparingCount, setPreparingCount] = useState(0);
    const [slowItemsActive, setSlowItemsActive] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // Refs for debounce
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastPressureRef = useRef<KitchenPressure>('low');

    // Calculate pressure from orders (memoized for performance)
    const calculated = useMemo(() => {
        const preparing = orders.filter(o => 
            o.status === 'preparing' || o.status === 'pending'
        );
        const count = preparing.length;

        // Determine pressure
        let newPressure: KitchenPressure = 'low';
        if (count > 10) newPressure = 'high';
        else if (count > 5) newPressure = 'medium';

        // Check for slow items
        const hasSlowItems = preparing.some(order => {
            return order.items?.some(item => {
                const prepTime = PREP_TIME[item.category] || 10;
                return prepTime > SLOW_THRESHOLD;
            });
        });

        return { count, newPressure, hasSlowItems };
    }, [orders]);

    useEffect(() => {
        const { count, newPressure, hasSlowItems } = calculated;

        // Always update count immediately
        setPreparingCount(count);
        setSlowItemsActive(hasSlowItems);

        // Debounce pressure changes to prevent flickering
        if (newPressure !== lastPressureRef.current) {
            // Clear any pending debounce
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            // If going UP in pressure, apply immediately (critical)
            // If going DOWN, debounce to prevent flicker
            const isIncreasing = 
                (lastPressureRef.current === 'low' && newPressure !== 'low') ||
                (lastPressureRef.current === 'medium' && newPressure === 'high');

            if (isIncreasing) {
                // Immediate update for increasing pressure
                setIsTransitioning(true);
                setPressure(newPressure);
                lastPressureRef.current = newPressure;
                setTimeout(() => setIsTransitioning(false), 300);
            } else {
                // Debounced update for decreasing pressure
                setIsTransitioning(true);
                debounceTimeoutRef.current = setTimeout(() => {
                    setPressure(newPressure);
                    lastPressureRef.current = newPressure;
                    setIsTransitioning(false);
                }, PRESSURE_DEBOUNCE_MS);
            }
        }

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [calculated]);

    // Esconder pratos lentos se cozinha saturada OU se há pratos lentos ativos
    const shouldHideSlowItems = pressure === 'high' || (pressure === 'medium' && slowItemsActive);

    return {
        pressure,
        preparingCount,
        slowItemsActive,
        shouldHideSlowItems,
        isTransitioning,
    };
}
