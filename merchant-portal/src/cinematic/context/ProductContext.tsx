import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// --- The Living Menu Schema ---

export type ProductOrigin = 'autopilot' | 'manual' | 'flash'; // flash = TPV quick create
export type ProductStatus = 'permanent' | 'ephemeral' | 'archived';

export interface Product {
    id: string;
    name: string;
    price: number;
    category: string; // 'soft', 'beer', 'kitchen', etc.

    // Intelligence Attributes
    origin: ProductOrigin;
    status: ProductStatus;

    // Usage Stats (The Brain)
    usageCount: number;
    firstUsedAt: number;
    lastUsedAt: number;

    // Optional Branding
    brand?: 'coca' | 'pepsi' | 'other';
}

interface ProductContextState {
    products: Product[];
    addProduct: (product: Omit<Product, 'usageCount' | 'firstUsedAt' | 'lastUsedAt'>) => void;
    recordUsage: (productId: string) => void;
    promoteProduct: (productId: string) => void;
    // Query Helpers
    getMenu: () => Product[]; // Returns only permanent products (for public menu)
    getAllProducts: () => Product[]; // Returns everything (for TPV search)
    initializeFromContract: (contract: any) => void;
    loading: boolean;
}

const ProductContext = createContext<ProductContextState | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 1. Truth State
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // 2. Real Connection (Supabase)
    useEffect(() => {
        let mounted = true;
        const fetchProducts = async () => {
            try {
                // Dynamic Import for Safety
                const { supabase } = await import('../../core/supabase');

                // Fetch Menu Items from real tables
                const { data, error } = await supabase
                    .from('gm_menu_items')
                    .select('*, menu_categories(name)');
                // .eq('available', true); // Removed for legacy schema compatibility

                if (error) throw error;

                if (mounted && data) {
                    console.log('[ProductContext] Loaded from Supabase:', data.length);
                    const mapped: Product[] = data.map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        price: d.price, // Pulse system price (decimal)
                        category: d.menu_categories?.name || 'Geral',
                        status: 'permanent',
                        origin: 'manual',
                        usageCount: 0,
                        firstUsedAt: Date.now(),
                        lastUsedAt: Date.now(),
                    }));
                    setProducts(mapped);
                }
            } catch (err) {
                console.error('[ProductContext] Failed to load products:', err);
                // ⚠️ On Error: Leave empty. Do NOT inject mocks. The System Law says "Fail Loud".
                // Ideally, we'd trigger a toast here via Kernel or just show empty state.
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchProducts();

        return () => { mounted = false; };
    }, []);

    // --- Actions (Optimistic Updates + Sync) ---

    const addProduct = async (input: Omit<Product, 'usageCount' | 'firstUsedAt' | 'lastUsedAt'>) => {
        // 1. Optimistic Update
        const tempId = crypto.randomUUID();
        const newProduct: Product = {
            ...input,
            id: tempId,
            usageCount: 0,
            firstUsedAt: Date.now(),
            lastUsedAt: Date.now()
        };
        setProducts(prev => [...prev, newProduct]);

        // 2. Persist
        try {
            const { supabase } = await import('../../core/supabase');
            const { getTabIsolated } = await import('../../core/storage/TabIsolatedStorage');
            const { data: { user } } = await supabase.auth.getUser();
            const restaurantId = getTabIsolated('chefiapp_restaurant_id');

            const { error, data } = await supabase.from('gm_menu_items').insert({
                restaurant_id: restaurantId,
                name: input.name,
                price: input.price,
                // price_cents: Math.round(input.price * 100), // Optional
                // currency: 'EUR', // Optional
                // available: true // Removed for legacy schema compatibility
            }).select().single();

            if (error) throw error;

            // Fix ID after sync
            if (data) {
                setProducts(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
            }

        } catch (e) {
            console.error('[ProductContext] Save Failed:', e);
            // Revert or queue (Out of scope for Mínimo)
        }
    };

    const recordUsage = (productId: string) => {
        setProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            return { ...p, usageCount: p.usageCount + 1, lastUsedAt: Date.now() };
        }));
        // Fire-and-forget update to DB? Maybe later for Intelligence.
    };

    const promoteProduct = (productId: string) => {
        setProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            return { ...p, status: 'permanent' };
        }));
    };

    // --- Queries ---

    const getMenu = () => products.filter(p => p.status === 'permanent');
    const getAllProducts = () => products.filter(p => p.status !== 'archived');

    // --- Bootstrap --- 
    // Deprecated for direct Supabase, but kept for interface compatibility (maybe useful for dev?)
    const initializeFromContract = (_contract: any) => {
        console.warn("[ProductContext] initializeFromContract is deprecated in Phase F. Supabase is Truth.");
    };

    return (
        <ProductContext.Provider value={{
            products,
            addProduct,
            recordUsage,
            promoteProduct,
            getMenu,
            getAllProducts,
            initializeFromContract,
            loading
        }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};
