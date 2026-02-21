/**
 * P5-4: Automated Inventory Hook
 * 
 * Hook para usar gestão automática de estoque
 */
// @ts-nocheck


import { useState, useEffect } from 'react';
import { automatedInventoryService, type InventoryAlert } from './AutomatedInventoryService';
import { getTabIsolated } from '../storage/TabIsolatedStorage';

export function useAutomatedInventory() {
    const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
    const [loading, setLoading] = useState(false);

    const checkInventory = async () => {
        const restaurantId = getTabIsolated('chefiapp_restaurant_id');
        if (!restaurantId) return;

        setLoading(true);
        try {
            const inventoryAlerts = await automatedInventoryService.checkInventoryLevels(restaurantId);
            setAlerts(inventoryAlerts);
        } catch (err) {
            console.error('[useAutomatedInventory] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check on mount
        checkInventory();

        // Check every 5 minutes
        const interval = setInterval(checkInventory, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getReorderSuggestions = async () => {
        const restaurantId = getTabIsolated('chefiapp_restaurant_id');
        if (!restaurantId) return [];

        return automatedInventoryService.getReorderSuggestions(restaurantId);
    };

    return {
        alerts,
        loading,
        checkInventory,
        getReorderSuggestions,
    };
}
