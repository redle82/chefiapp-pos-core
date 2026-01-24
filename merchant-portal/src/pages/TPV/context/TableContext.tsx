import React, { createContext, useContext, useEffect, useState } from 'react';
import { useKernel } from '../../../core/kernel/KernelContext';
import { supabase } from '../../../core/supabase';
import { isDevStableMode } from '../../../core/runtime/devStableMode';

export interface Table {
    id: string;
    restaurant_id: string;
    number: number;
    status: 'free' | 'occupied' | 'reserved';
    seats: number;
    x?: number;
    y?: number;
}

interface TableContextType {
    tables: Table[];
    loading: boolean;
    refreshTables: () => Promise<void>;
    updateTableStatus: (tableId: string, status: 'free' | 'occupied' | 'reserved') => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: React.ReactNode, restaurantId?: string }> = ({ children, restaurantId: propRestaurantId }) => {
    // 0. Kernel Injection (Sovereignty)
    const { kernel, isReady, status, executeSafe } = useKernel();

    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const restaurantId = propRestaurantId || null;

    const fetchTables = async () => {
        if (!restaurantId) return;

        try {
            const { data, error } = await supabase
                .from('gm_tables')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('number', { ascending: true });

            if (error) {
                console.error('Error fetching tables:', error);
                return;
            }

            if (data) {
                setTables(data as Table[]);
            }
        } catch (err) {
            console.error('Failed to fetch tables:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateTableStatus = async (tableId: string, status: 'free' | 'occupied' | 'reserved') => {
        // Optimistic update
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));

        try {
            // DEV_STABLE_MODE: Fail-closed guard - kernel must be ready
            if (!isReady || !kernel) {
                throw new Error(`KERNEL_NOT_READY: ${status === 'FROZEN' 
                    ? 'Sistema em modo de estabilização' 
                    : status === 'BOOTING'
                    ? 'Sistema inicializando'
                    : 'Kernel não está pronto'}`);
            }

            // Map Status to Event
            let event = 'FREE';
            if (status === 'occupied') event = 'OCCUPY';
            if (status === 'reserved') event = 'RESERVE';

            const result = await executeSafe({
                entity: 'TABLE',
                entityId: tableId,
                event,
                restaurantId: restaurantId!,
                payload: {
                    tableId,
                    status,
                    tenantId: restaurantId
                }
            });

            if (!result.ok) {
                throw new Error(`KERNEL_EXECUTION_FAILED: ${result.reason}`);
            }

            console.log('[TableContext] Sovereign Table Status Updated:', tableId, status);

        } catch (err) {
            console.error('[TableContext] Sovereign Update Failed:', err);
            // Revert on error
            await fetchTables();
        }
    };

    useEffect(() => {
        fetchTables();

        // DEV_STABLE_MODE: do not start realtime subscription while stabilizing Gate/Auth/Tenant.
        if (isDevStableMode()) {
            return;
        }

        if (restaurantId) {
            const channel = supabase
                .channel('public:gm_tables')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'gm_tables',
                    filter: `restaurant_id=eq.${restaurantId}`
                }, (payload) => {
                    fetchTables();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [restaurantId]);

    return (
        <TableContext.Provider value={{ tables, loading, refreshTables: fetchTables, updateTableStatus }}>
            {children}
        </TableContext.Provider>
    );
};

export const useTables = () => {
    const context = useContext(TableContext);
    if (context === undefined) {
        throw new Error('useTables must be used within a TableProvider');
    }
    return context;
};
