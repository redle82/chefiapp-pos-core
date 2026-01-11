import { useState, useEffect } from 'react';
import { supabase } from '../../core/supabase';
import { useSystemGuardian } from '../../core/guardian/SystemGuardianContext';

import { OnboardingCore } from '../../core/onboarding/OnboardingCore';

export type MenuViewState = 'LOADING' | 'EMPTY' | 'DRAFT' | 'ACTIVE' | 'ERROR';

// UUID Regex Validator
const IS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useMenuState() {
    const { status } = useSystemGuardian();

    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    // 1. Resolve Restaurant ID (Priority: Blueprint > LocalStorage > null)
    useEffect(() => {
        const resolveRestaurantId = async () => {
            const blueprint = await OnboardingCore.getBlueprint();
            if (blueprint?.meta?.tenantId && IS_UUID.test(blueprint.meta.tenantId)) {
                setRestaurantId(blueprint.meta.tenantId);
                return;
            }

            const { getTabIsolated } = await import('../../core/storage/TabIsolatedStorage');
            const local = getTabIsolated('chefiapp_restaurant_id');
            if (local && IS_UUID.test(local)) {
                setRestaurantId(local);
                return;
            }

            setRestaurantId(null);
        };

        resolveRestaurantId();
    }, []);

    const [categories, setCategories] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any | null>(null);

    // Derived State
    const [viewState, setViewState] = useState<MenuViewState>('LOADING');

    useEffect(() => {
        if (!restaurantId) {
            // If no ID, we are likely Pre-Onboarding or Broken
            console.warn('[useMenuState] No valid Restaurant UUID found.');
            setViewState('EMPTY'); // Or redirect?
            setLoading(false);
            return;
        }
        fetchMenu(restaurantId);
    }, [restaurantId]);

    // Compute View State whenever dependencies change
    useEffect(() => {
        if (loading) {
            setViewState('LOADING');
            return;
        }

        if (error) {
            setViewState('ERROR');
            return;
        }

        if (categories.length === 0) {
            setViewState('EMPTY');
            return;
        }

        if (status.realityStatus === 'draft') {
            setViewState('DRAFT');
            return;
        }

        setViewState('ACTIVE');
    }, [loading, error, categories, status.realityStatus]);

    const fetchMenu = async (id: string) => {
        setLoading(true);
        try {
            const { data: catData, error: catError } = await supabase
                .from('gm_menu_categories')
                .select('*')
                .eq('restaurant_id', id)
                .order('sort_order', { ascending: true });

            if (catError) throw catError;

            const { data: itemData, error: itemError } = await supabase
                .from('gm_menu_items')
                .select('*')
                .eq('restaurant_id', id);

            if (itemError) throw itemError;

            setCategories(catData || []);
            setCategories(catData || []);
            // FIX: Map price_cents to price (float) for UI compatibility
            setItems((itemData || []).map(item => ({
                ...item,
                price: (item.price_cents || 0) / 100
            })));
        } catch (err: any) {
            console.error('Menu Fetch Error:', err);
            setError(err); // Store full error object
        } finally {
            setLoading(false);
        }
    };

    const addCategory = async (name: string) => {
        if (!restaurantId) throw new Error("No Restaurant ID");
        const { data, error } = await supabase.from('gm_menu_categories').insert({
            restaurant_id: restaurantId,
            name,
            sort_order: categories.length + 1
        }).select().single();

        if (error) throw error;
        setCategories([...categories, data]);
        return data;
    };

    const addItem = async (categoryId: string, name: string, price: number) => {
        if (!restaurantId) throw new Error("No Restaurant ID");
        const { data, error } = await supabase.from('gm_menu_items').insert({
            restaurant_id: restaurantId,
            category_id: categoryId,
            name,
            price_cents: Math.round(price * 100),
        }).select().single();

        if (error) throw error;
        setItems([...items, data]);
        return data;
    };

    const updateItem = async (itemId: string, updates: { name?: string; price?: number; category_id?: string }) => {
        if (!restaurantId) throw new Error("No Restaurant ID");
        const { data, error } = await supabase
            .from('gm_menu_items')
            .update(updates)
            .eq('id', itemId)
            .eq('restaurant_id', restaurantId)
            .select()
            .single();

        if (error) throw error;
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...data } : i));
        return data;
    };

    const deleteItem = async (itemId: string) => {
        if (!restaurantId) throw new Error("No Restaurant ID");
        const { error } = await supabase
            .from('gm_menu_items')
            .update({ is_active: false }) // Soft Delete preferred for Sovereign Logic
            .eq('id', itemId)
            .eq('restaurant_id', restaurantId);

        if (error) throw error;
        setItems(prev => prev.filter(i => i.id !== itemId));
    };

    return {
        viewState,
        error,
        data: { categories, items },
        actions: { addCategory, addItem, updateItem, deleteItem, refresh: () => restaurantId && fetchMenu(restaurantId) }
    };
}
