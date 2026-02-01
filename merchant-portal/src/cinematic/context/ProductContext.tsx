import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { KernelContext } from '../../core/kernel/KernelContext'; // Sovereign Dependency
import { getErrorMessage } from '../../core/errors/ErrorMessages'; // CORE_FAILURE_MODEL: UI shows Core message

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

    // Inventory
    trackStock?: boolean;
    stockQuantity?: number;
}

interface ProductContextState {
    products: Product[];
    addProduct: (product: Omit<Product, 'usageCount' | 'firstUsedAt' | 'lastUsedAt'>) => void;
    recordUsage: (productId: string) => void;
    promoteProduct: (productId: string) => void;
    getMenu: () => Product[];
    getAllProducts: () => Product[];
    initializeFromContract: (contract: any) => void;
    loading: boolean;
    /** CORE_FAILURE_MODEL: set when addProduct fails with critical; UI must show, not hide */
    lastError: string | null;
    clearLastError: () => void;
}

const ProductContext = createContext<ProductContextState | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 0. Kernel Injection (Sovereignty). Prefer executeSafe for CORE_FAILURE_MODEL.
    const ctx = useContext(KernelContext);
    const kernel = ctx?.kernel ?? undefined;
    const executeSafe = ctx?.executeSafe;

    // 1. Truth State
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastError, setLastError] = useState<string | null>(null);

    // 2. Real Connection (Docker Core via ProductReader)
    useEffect(() => {
        let mounted = true;
        const fetchProducts = async () => {
            try {
                // FASE 3.5: Usa ProductReader (dockerCoreClient) em vez de supabase direto
                // Por enquanto, busca produtos sem filtro de restaurante (compatibilidade)
                // TODO: Obter restaurantId do contexto quando disponível e usar readProductsByRestaurant
                const { dockerCoreClient } = await import('../../core-boundary/docker-core/connection');
                const { data, error } = await dockerCoreClient
                    .from('gm_products')
                    .select('*, gm_menu_categories(name)')
                    .eq('available', true);

                if (error) throw error;

                if (mounted && data) {
                    console.log('[ProductContext] Loaded from Docker Core (gm_products):', data.length);
                    const mapped: Product[] = data.map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        price: (d.price_cents || 0) / 100, // Convert cents to decimal
                        category: d.gm_menu_categories?.name || 'Geral',
                        trackStock: d.track_stock,
                        stockQuantity: d.stock_quantity,
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

    const clearLastError = () => setLastError(null);

    const addProduct = async (input: Omit<Product, 'usageCount' | 'firstUsedAt' | 'lastUsedAt'>) => {
        setLastError(null); // Clear on retry
        const tempId = crypto.randomUUID();
        const newProduct: Product = {
            ...input,
            id: tempId,
            usageCount: 0,
            firstUsedAt: Date.now(),
            lastUsedAt: Date.now()
        };
        setProducts(prev => [...prev, newProduct]);

        if (!executeSafe && !kernel) {
            console.error('[ProductContext] Kernel not available for Sovereign Write');
            setProducts(prev => prev.filter(p => p.id !== tempId));
            setLastError('Sistema não disponível. Tente novamente.');
            return;
        }

        const payload = {
            entity: 'PRODUCT',
            entityId: tempId,
            event: 'CREATE',
            restaurantId: null as string | null,
            payload: {
                name: input.name,
                priceCents: Math.round(input.price * 100),
                trackStock: input.trackStock || false,
                stockQuantity: input.stockQuantity || 0,
                categoryId: null
            }
        };

        if (executeSafe) {
            const { getTabIsolated } = await import('../../core/storage/TabIsolatedStorage');
            (payload as any).restaurantId = getTabIsolated('chefiapp_restaurant_id');
            const res = await executeSafe(payload);
            if (!res.ok) {
                setProducts(prev => prev.filter(p => p.id !== tempId));
                if (res.failureClass === 'critical') {
                    setLastError(getErrorMessage(res.error) || 'Erro ao gravar produto. Não continue como se nada fosse.');
                }
                return;
            }
            return;
        }

        try {
            const { getTabIsolated } = await import('../../core/storage/TabIsolatedStorage');
            (payload as any).restaurantId = getTabIsolated('chefiapp_restaurant_id');
            await kernel!.execute(payload);
        } catch (e) {
            console.error('[ProductContext] Sovereign Save Failed:', e);
            setProducts(prev => prev.filter(p => p.id !== tempId));
            setLastError(getErrorMessage(e));
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
            loading,
            lastError,
            clearLastError
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
