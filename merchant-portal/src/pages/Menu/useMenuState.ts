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
        
        // DEV_STABLE_MODE: Fail-closed guard - kernel must be ready
        if (!isReady || !kernel) {
            throw new Error(`KERNEL_NOT_READY: ${status === 'FROZEN' 
                ? 'Sistema em modo de estabilização' 
                : status === 'BOOTING'
                ? 'Sistema inicializando'
                : 'Kernel não está pronto'}`);
        }

        const productId = crypto.randomUUID();

        // Sovereign Creation (Kernel)
        const result = await executeSafe({
            entity: 'PRODUCT',
            entityId: productId,
            event: 'CREATE',
            restaurantId,
            payload: {
                name,
                priceCents: Math.round(price * 100),
                trackStock,
                stockQuantity: stockQty,
                categoryId // Linking to Category
            }
        });

        if (!result.ok) {
            throw new Error(`KERNEL_EXECUTION_FAILED: ${result.reason}`);
        }

        // Optimistic UI Update (or re-fetch, but mapping for speed)
        const mapped = {
            id: productId,
            restaurant_id: restaurantId,
            category_id: categoryId,
            name,
            price: price,
            price_cents: Math.round(price * 100),
            track_stock: trackStock,
            stock_quantity: stockQty,
            available: true
        };
        setItems([...items, mapped]);
        return mapped;
    };

    const updateItem = async (itemId: string, updates: { name?: string; price?: number; category_id?: string; track_stock?: boolean; stock_quantity?: number }) => {
        if (!restaurantId) throw new Error("No Restaurant ID");
        
        // DEV_STABLE_MODE: Fail-closed guard - kernel must be ready
        if (!isReady || !kernel) {
            throw new Error(`KERNEL_NOT_READY: ${status === 'FROZEN' 
                ? 'Sistema em modo de estabilização' 
                : status === 'BOOTING'
                ? 'Sistema inicializando'
                : 'Kernel não está pronto'}`);
        }

        const currentItem = items.find(i => i.id === itemId);
        if (!currentItem) throw new Error("Item not found locally");

        // Prepare Payload
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.price !== undefined) payload.priceCents = Math.round(updates.price * 100);
        if (updates.track_stock !== undefined) payload.trackStock = updates.track_stock;
        if (updates.stock_quantity !== undefined) payload.stockQuantity = updates.stock_quantity;
        if (updates.category_id) payload.categoryId = updates.category_id;

        // Merge with existing for defaults if needed by projection (projection checks truthiness mostly)
        // But for update, we just send deltas if the projection supports it.
        // ProductProjection expects full payload or merges?
        // Let's look at ProductProjection again.
        // It does: const { name, ... } = payload || {};
        // It performs UPSERT. So we MUST provide ALL required fields (Name, RestaurantID).
        // Upsert requires the full object usually if we don't want to nullify.
        // Wait. Supabase upsert will OVERWRITE columns if we don't be careful?
        // No, upsert updates existing if ID matches. But we need to pass the current values for fields we AREN'T updating if we are just passing a partial object?
        // Actually, Supabase `upsert` is "insert or update".
        // If we only pass partial fields + ID, it might fail if required columns are missing (not likely for update) OR it might nullify others if we aren't careful?
        // Actually `upsert` replaces the row? No, usually merges if ignoring duplicates?
        // Better to use UPDATE transition if possible, but ProductProjection uses UPSERT.
        // To be safe, we merge current state.

        const mergedPayload = {
            name: updates.name || currentItem.name,
            priceCents: updates.price !== undefined ? Math.round(updates.price * 100) : currentItem.price_cents,
            trackStock: updates.track_stock !== undefined ? updates.track_stock : currentItem.track_stock,
            stockQuantity: updates.stock_quantity !== undefined ? updates.stock_quantity : currentItem.stock_quantity,
            categoryId: updates.category_id || currentItem.category_id
        };

        // Sovereign Update
        const result = await executeSafe({
            entity: 'PRODUCT',
            entityId: itemId,
            event: 'UPDATE', // Maps to persistProduct (Upsert)
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
        
        // DEV_STABLE_MODE: Fail-closed guard - kernel must be ready
        if (!isReady || !kernel) {
            throw new Error(`KERNEL_NOT_READY: ${status === 'FROZEN' 
                ? 'Sistema em modo de estabilização' 
                : status === 'BOOTING'
                ? 'Sistema inicializando'
                : 'Kernel não está pronto'}`);
        }

        // Sovereign Archive (Soft Delete)
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
