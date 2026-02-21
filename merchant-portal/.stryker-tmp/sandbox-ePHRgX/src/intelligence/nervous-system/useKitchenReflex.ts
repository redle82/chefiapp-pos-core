// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import type { Order } from '../../core/contracts';
import { SoundEngine } from './SoundEngine';

// ------------------------------------------------------------------
// 🛡️ KITCHEN REFLEX (The Jitter Guard)
// ------------------------------------------------------------------
// "Stable vision in a shaking world."

interface UseKitchenReflexProps {
    orders: Order[];
}

export const useKitchenReflex = ({ orders }: UseKitchenReflexProps) => {
    // 1. STABLE STATE (No flicker)
    const [stableOrders, setStableOrders] = useState<Order[]>([]);

    // 2. MEMORY (To detect drift/changes)
    const previousOrdersRef = useRef<Order[]>([]);
    const lastHashRef = useRef<string>('');

    useEffect(() => {
        // Simple hash to detect change (IDs + Status + Count)
        const currentHash = orders
            .map(o => `${o.id}:${o.status}`)
            .sort()
            .join('|');

        // JITTER GUARD: If hash matches, do absolutely nothing (render conservation)
        // React Query / Supabase Realtime sometimes fires "pseudo-updates"
        if (currentHash === lastHashRef.current) return;

        // DETECT NEW ORDERS (For Audio Reflex)
        const prevIds = new Set(previousOrdersRef.current.map(o => o.id));
        const newArrivals = orders.filter(o => !prevIds.has(o.id) && o.status === 'new');

        if (newArrivals.length > 0) {
            console.log('🔊 KDS Reflex: New Order Detected', newArrivals);
            SoundEngine.playNewOrder();
        }

        // DETECT STATUS CHANGE (For Feedback)
        // (Optional: Could sound on 'ready' if we wanted confirmation)

        // UPDATE TRUTH
        lastHashRef.current = currentHash;
        previousOrdersRef.current = orders;
        setStableOrders(orders); // Commit to UI

    }, [orders]);

    return {
        orders: stableOrders,
        hasNew: stableOrders.some(o => o.status === 'new'),
        pressureLevel: stableOrders.filter(o => o.status !== 'ready' && (o.status as string) !== 'cancelled').length
    };
};
