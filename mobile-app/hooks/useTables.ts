/**
 * Hook para buscar mesas do banco
 * 
 * ERRO-007 Fix: Buscar mesas reais do banco em vez de mock
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useRestaurant } from '@/context/RestaurantContext';

export interface Table {
    id: string;
    number: number;
    seats: number;
    status: 'free' | 'occupied' | 'reserved';
    zone?: string; // ERRO-007 Fix: Zona (Bar, Terraço, Salão 1, Salão 2)
}

export function useTables() {
    const { activeRestaurant } = useRestaurant();
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeRestaurant?.id) {
            setLoading(false);
            return;
        }

        fetchTables();
        
        // Realtime subscription
        const channel = supabase
            .channel('public:gm_tables')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'gm_tables', filter: `restaurant_id=eq.${activeRestaurant.id}` },
                () => {
                    fetchTables();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeRestaurant?.id]);

    const fetchTables = async () => {
        try {
            const { data, error } = await supabase
                .from('gm_tables')
                .select('id, number, seats, status')
                .eq('restaurant_id', activeRestaurant?.id)
                .order('number', { ascending: true });

            if (error) throw error;

            if (data) {
                const formatted: Table[] = data.map((t: any) => ({
                    id: t.id,
                    number: t.number || 0,
                    seats: t.seats || 4,
                    status: mapTableStatus(t.status),
                    zone: getZoneByNumber(t.number) // ERRO-007 Fix: Determinar zona por número
                }));
                setTables(formatted);
            }
        } catch (error) {
            console.error('[useTables] Error fetching tables:', error);
        } finally {
            setLoading(false);
        }
    };

    // ERRO-007 Fix: Mapear status do banco para status do app
    const mapTableStatus = (dbStatus: string): Table['status'] => {
        switch (dbStatus?.toLowerCase()) {
            case 'free':
            case 'closed':
                return 'free';
            case 'occupied':
                return 'occupied';
            case 'reserved':
                return 'reserved';
            default:
                return 'free';
        }
    };

    // ERRO-007 Fix: Determinar zona baseado no número da mesa (MVP simples)
    const getZoneByNumber = (number: number): string => {
        if (number <= 4) return 'Salão 1';
        if (number <= 8) return 'Bar';
        if (number <= 12) return 'Terraço';
        return 'Salão 2';
    };

    return {
        tables,
        loading,
        refresh: fetchTables
    };
}
