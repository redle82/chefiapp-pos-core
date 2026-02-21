/**
 * useNewOrderAlerts Hook
 * 
 * React hook that detects new orders and manages alert state.
 * 
 * Usage:
 * ```tsx
 * const { unseenOrderIds, markSeen, soundEnabled, toggleSound } = useNewOrderAlerts(orders);
 * 
 * // In render:
 * const isNewOrder = unseenOrderIds.has(order.id);
 * ```
 */
// @ts-nocheck


import { useState, useEffect, useRef, useCallback } from 'react';
import {
    alertNewOrders,
    markOrderAsSeen,
    getSeenOrderIds,
    isSoundEnabled,
    setSoundEnabled,
    initAudioContext,
    injectKDSAlertStyles,
    requestNotificationPermission
} from './KDSAlerts';

interface Order {
    id: string;
    status: string;
    createdAt: Date | string;
}

interface UseNewOrderAlertsResult {
    /** Set of order IDs that haven't been interacted with */
    unseenOrderIds: Set<string>;
    
    /** Mark an order as seen (removes from unseen set) */
    markSeen: (orderId: string) => void;
    
    /** Mark all orders as seen */
    markAllSeen: () => void;
    
    /** Whether sound is enabled */
    soundEnabled: boolean;
    
    /** Toggle sound on/off */
    toggleSound: () => void;
    
    /** Initialize audio (call on first user interaction) */
    initAudio: () => Promise<void>;
}

export function useNewOrderAlerts(orders: Order[]): UseNewOrderAlertsResult {
    // Track unseen orders (local state, not persisted)
    const [unseenOrderIds, setUnseenOrderIds] = useState<Set<string>>(new Set());
    const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled);
    
    // Track previous order IDs to detect new ones
    const prevOrderIdsRef = useRef<Set<string>>(new Set());
    const isInitialLoadRef = useRef(true);
    
    // Inject CSS animations on mount
    useEffect(() => {
        injectKDSAlertStyles();
    }, []);
    
    // Detect new orders when orders array changes
    useEffect(() => {
        const currentIds = orders
            .filter(o => o.status === 'new') // Only alert on 'new' status orders
            .map(o => o.id);
        
        const currentIdSet = new Set(currentIds);
        const seenIds = getSeenOrderIds();
        
        // Find orders that are:
        // 1. In current list
        // 2. Not in previous list (just appeared)
        // 3. Not in seen storage (haven't been seen before)
        const newOrderIds: string[] = [];
        
        for (const id of currentIds) {
            if (!prevOrderIdsRef.current.has(id) && !seenIds.has(id)) {
                newOrderIds.push(id);
            }
        }
        
        // Update unseen set
        if (newOrderIds.length > 0) {
            setUnseenOrderIds(prev => {
                const next = new Set(prev);
                newOrderIds.forEach(id => next.add(id));
                return next;
            });
            
            // Alert only if not initial load (avoid sound on page refresh)
            if (!isInitialLoadRef.current) {
                alertNewOrders(newOrderIds);
            }
        }
        
        // Clean up: remove from unseen if order no longer exists or is no longer 'new'
        setUnseenOrderIds(prev => {
            const next = new Set<string>();
            for (const id of prev) {
                const order = orders.find(o => o.id === id);
                if (order && order.status === 'new') {
                    next.add(id);
                }
            }
            return next;
        });
        
        // Update refs for next comparison
        prevOrderIdsRef.current = currentIdSet;
        isInitialLoadRef.current = false;
        
    }, [orders]);
    
    // Auto-clear unseen after timeout
    useEffect(() => {
        if (unseenOrderIds.size === 0) return;
        
        const FLASH_DURATION_MS = 30_000; // 30s
        
        const timer = setTimeout(() => {
            // After 30s, automatically mark all as seen
            unseenOrderIds.forEach(id => markOrderAsSeen(id));
            setUnseenOrderIds(new Set());
        }, FLASH_DURATION_MS);
        
        return () => clearTimeout(timer);
    }, [unseenOrderIds]);
    
    // Mark single order as seen
    const markSeen = useCallback((orderId: string) => {
        markOrderAsSeen(orderId);
        setUnseenOrderIds(prev => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
        });
    }, []);
    
    // Mark all as seen
    const markAllSeen = useCallback(() => {
        unseenOrderIds.forEach(id => markOrderAsSeen(id));
        setUnseenOrderIds(new Set());
    }, [unseenOrderIds]);
    
    // Toggle sound
    const toggleSound = useCallback(() => {
        const newValue = !soundEnabled;
        setSoundEnabled(newValue);
        setSoundEnabledState(newValue);
    }, [soundEnabled]);
    
    // Init audio (must be called after user interaction)
    const initAudio = useCallback(async () => {
        await initAudioContext();
        await requestNotificationPermission();
    }, []);
    
    return {
        unseenOrderIds,
        markSeen,
        markAllSeen,
        soundEnabled,
        toggleSound,
        initAudio
    };
}
