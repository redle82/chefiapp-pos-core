import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../../core/supabase';
import { useTenant } from '../../../core/tenant/TenantContext';

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

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const { tenantId } = useTenant();

    // Use TenantContext as single source of truth
    const restaurantId = tenantId;

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
        try {
            const { error } = await supabase
                .from('gm_tables')
                .update({ status, updated_at: new Date() })
                .eq('id', tableId);

            if (error) throw error;

            // Optimistic update
            setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
        } catch (err) {
            console.error('Failed to update table status:', err);
            // Revert fetch on error
            await fetchTables();
        }
    };

    useEffect(() => {
        fetchTables();

        // Subscribe to realtime changes
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
