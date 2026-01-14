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
                .from('gm_products')
                .select('*')
                .eq('restaurant_id', id);

            if (itemError) throw itemError;

            setCategories(catData || []);
            // FIX: Map price_cents to price (float) for UI compatibility
            setItems((itemData || []).map(item => ({
                ...item,
                price: (item.price_cents || 0) / 100,
                track_stock: item.track_stock,
                stock_quantity: item.stock_quantity
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

    const addItem = async (categoryId: string, name: string, price: number, trackStock: boolean = false, stockQty: number = 0) => {
        if (!restaurantId) throw new Error("No Restaurant ID");
        const { data, error } = await supabase.from('gm_products').insert({
            restaurant_id: restaurantId,
            category_id: categoryId,
            name,
            price_cents: Math.round(price * 100),
            track_stock: trackStock,
            stock_quantity: stockQty,
            available: true
        }).select().single();

        if (error) throw error;

        const mapped = {
            ...data,
            price: (data.price_cents || 0) / 100
        };
        setItems([...items, mapped]);
        return mapped;
    };

    const updateItem = async (itemId: string, updates: { name?: string; price?: number; category_id?: string; track_stock?: boolean; stock_quantity?: number }) => {
        if (!restaurantId) throw new Error("No Restaurant ID");

        // Convert price to cents if present
        const dbUpdates: any = { ...updates };
        if (updates.price !== undefined) {
            dbUpdates.price_cents = Math.round(updates.price * 100);
            delete dbUpdates.price;
        }

        const { data, error } = await supabase
            .from('gm_products')
            .update(dbUpdates)
            .eq('id', itemId)
            .eq('restaurant_id', restaurantId)
            .select()
            .single();

        if (error) throw error;

        const mapped = {
            ...data,
            price: (data.price_cents || 0) / 100
        };

        setItems(prev => prev.map(i => i.id === itemId ? mapped : i));
        return mapped;
    };

    const deleteItem = async (itemId: string) => {
        if (!restaurantId) throw new Error("No Restaurant ID");
        const { error } = await supabase
            .from('gm_products')
            .delete() // Hard Delete for now to match test logic, or update 'available=false' if prefer soft.
            // Using DELETE to be clean for now, or match existing soft delete logic.
            // Existing logic was: .update({ is_active: false }) on gm_menu_items.
            // gm_products has 'available' (bool).
            // Let's use Hard Delete (DELETE) because 'archived' product implies it's gone for the user.
            // Wait, integration tests might fail if we delete products with orders.
            // But UI allows deletion.
            // I'll stick to DELETE for now, handling FK errors if they occur (User will see error).
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
