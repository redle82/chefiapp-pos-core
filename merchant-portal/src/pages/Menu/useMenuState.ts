import { supabase } from '../../core/supabase';
import { useSystemGuardian } from '../../core/guardian/SystemGuardianContext';
import { useContext, useState, useEffect } from 'react';
import { useKernel } from '../../core/kernel/KernelContext';
import { MenuAuthority } from '../../core/kernel/MenuAuthority';
import { useTenant } from '../../core/tenant/TenantContext';

import { GenesisKernel } from '../../core/kernel/GenesisKernel';

export type MenuViewState = 'LOADING' | 'EMPTY' | 'DRAFT' | 'ACTIVE' | 'ERROR';

// UUID Regex Validator
const IS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useMenuState() {
    const { status: guardianStatus } = useSystemGuardian();
    const { tenantId } = useTenant(); // Use TenantContext as source of truth

    // Use tenantId from TenantContext (already resolved by FlowGate/TenantProvider)
    const restaurantId = tenantId;

    const { kernel, isReady, status, executeSafe } = useKernel(); // Sovereign Injection

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

        if (guardianStatus.realityStatus === 'draft') {
            setViewState('DRAFT');
            return;
        }

        setViewState('ACTIVE');
    }, [loading, error, categories, guardianStatus.realityStatus]);

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
        try {
            if (!restaurantId) throw new Error("No Restaurant ID");

            // Metadata/Structure -> Sovereign Kernel
            const data = await MenuAuthority.createCategory(restaurantId, name, categories.length + 1);



            setCategories([...categories, data]);
            return data;
        } catch (err) {
            console.error('[useMenuState] addCategory Failed:', err);
            throw err;
        }
    };

    const addItem = async (categoryId: string, name: string, price: number, trackStock: boolean = false, stockQty: number = 0) => {
        if (!restaurantId) throw new Error("No Restaurant ID");

        const productId = crypto.randomUUID();
        const priceCents = Math.round(price * 100);

        // GOVERNANCE BYPASS: Menu configuration is allowed even in FROZEN mode
        // Menu is configured in Painel (governance), not transactional operations
        if (status === 'FROZEN' || !isReady || !kernel) {
            console.info('[useMenuState] Kernel FROZEN - using direct Supabase write for governance operation');

            // Direct write to gm_products (governance path)
            const { data, error } = await supabase
                .from('gm_products')
                .insert({
                    id: productId,
                    restaurant_id: restaurantId,
                    category_id: categoryId,
                    name,
                    price_cents: priceCents,
                    track_stock: trackStock,
                    stock_quantity: stockQty,
                    available: true
                })
                .select()
                .single();

            if (error) {
                console.error('[useMenuState] Governance write failed:', error);
                throw new Error(`GOVERNANCE_WRITE_FAILED: ${error.message}`);
            }

            const mapped = {
                id: productId,
                restaurant_id: restaurantId,
                category_id: categoryId,
                name,
                price: price,
                price_cents: priceCents,
                track_stock: trackStock,
                stock_quantity: stockQty,
                available: true
            };
            setItems([...items, mapped]);
            return mapped;
        }

        // Sovereign Creation (Kernel) - for non-FROZEN mode
        const result = await executeSafe({
            entity: 'PRODUCT',
            entityId: productId,
            event: 'CREATE',
            restaurantId,
            payload: {
                name,
                priceCents,
                trackStock,
                stockQuantity: stockQty,
                categoryId
            }
        });

        if (!result.ok) {
            throw new Error(`KERNEL_EXECUTION_FAILED: ${result.reason}`);
        }

        const mapped = {
            id: productId,
            restaurant_id: restaurantId,
            category_id: categoryId,
            name,
            price: price,
            price_cents: priceCents,
            track_stock: trackStock,
            stock_quantity: stockQty,
            available: true
        };
        setItems([...items, mapped]);
        return mapped;
    };

    const updateItem = async (itemId: string, updates: { name?: string; price?: number; category_id?: string; track_stock?: boolean; stock_quantity?: number }) => {
        if (!restaurantId) throw new Error("No Restaurant ID");

        const currentItem = items.find(i => i.id === itemId);
        if (!currentItem) throw new Error("Item not found locally");

        // Build update object
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.price !== undefined) dbUpdates.price_cents = Math.round(updates.price * 100);
        if (updates.track_stock !== undefined) dbUpdates.track_stock = updates.track_stock;
        if (updates.stock_quantity !== undefined) dbUpdates.stock_quantity = updates.stock_quantity;
        if (updates.category_id !== undefined) dbUpdates.category_id = updates.category_id;

        // GOVERNANCE BYPASS: Menu configuration is allowed even in FROZEN mode
        if (status === 'FROZEN' || !isReady || !kernel) {
            console.info('[useMenuState] Kernel FROZEN - using direct Supabase write for governance update');

            const { error } = await supabase
                .from('gm_products')
                .update(dbUpdates)
                .eq('id', itemId);

            if (error) {
                console.error('[useMenuState] Governance update failed:', error);
                throw new Error(`GOVERNANCE_WRITE_FAILED: ${error.message}`);
            }

            const mapped = {
                ...currentItem,
                ...updates,
                price: updates.price !== undefined ? updates.price : currentItem.price,
                price_cents: updates.price !== undefined ? Math.round(updates.price * 100) : currentItem.price_cents
            };
            setItems(prev => prev.map(i => i.id === itemId ? mapped : i));
            return mapped;
        }

        // Sovereign Update (Kernel) - for non-FROZEN mode
        const mergedPayload = {
            name: updates.name || currentItem.name,
            priceCents: updates.price !== undefined ? Math.round(updates.price * 100) : currentItem.price_cents,
            trackStock: updates.track_stock !== undefined ? updates.track_stock : currentItem.track_stock,
            stockQuantity: updates.stock_quantity !== undefined ? updates.stock_quantity : currentItem.stock_quantity,
            categoryId: updates.category_id || currentItem.category_id
        };

        const result = await executeSafe({
            entity: 'PRODUCT',
            entityId: itemId,
            event: 'UPDATE',
            restaurantId,
            payload: mergedPayload
        });

        if (!result.ok) {
            throw new Error(`KERNEL_EXECUTION_FAILED: ${result.reason}`);
        }

        const mapped = {
            ...currentItem,
            ...updates,
            price: updates.price !== undefined ? updates.price : currentItem.price
        };

        setItems(prev => prev.map(i => i.id === itemId ? mapped : i));
        return mapped;
    };

    const deleteItem = async (itemId: string) => {
        if (!restaurantId) throw new Error("No Restaurant ID");

        // GOVERNANCE BYPASS: Menu configuration is allowed even in FROZEN mode
        if (status === 'FROZEN' || !isReady || !kernel) {
            console.info('[useMenuState] Kernel FROZEN - using direct Supabase delete for governance operation');

            const { error } = await supabase
                .from('gm_products')
                .delete()
                .eq('id', itemId);

            if (error) {
                console.error('[useMenuState] Governance delete failed:', error);
                throw new Error(`GOVERNANCE_WRITE_FAILED: ${error.message}`);
            }

            setItems(prev => prev.filter(i => i.id !== itemId));
            return;
        }

        // Sovereign Archive (Soft Delete) - for non-FROZEN mode
        const result = await executeSafe({
            entity: 'PRODUCT',
            entityId: itemId,
            event: 'ARCHIVE',
            restaurantId,
            payload: {}
        });

        if (!result.ok) {
            throw new Error(`KERNEL_EXECUTION_FAILED: ${result.reason}`);
        }

        setItems(prev => prev.filter(i => i.id !== itemId));
    };

    return {
        viewState,
        error,
        data: { categories, items },
        actions: { addCategory, addItem, updateItem, deleteItem, refresh: () => restaurantId && fetchMenu(restaurantId) }
    };
}
