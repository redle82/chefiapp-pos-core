/**
 * USE APPSTAFF TABLES — Hook Isolado
 * 
 * FASE 3.3: Limpeza de Imports Cruzados
 * 
 * Hook próprio do AppStaff para ler mesas diretamente do Core.
 * Não depende de TPV/context.
 */
// @ts-nocheck


import { useEffect, useState } from 'react';
import { dockerCoreClient } from '../../../infra/docker-core/connection';
import type { CoreTable } from '../../../infra/docker-core/types';

interface UseAppStaffTablesResult {
  tables: CoreTable[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para ler mesas diretamente do Core.
 * 
 * Isolado do TPV - AppStaff não depende de TPV/context.
 */
export function useAppStaffTables(restaurantId: string | null): UseAppStaffTablesResult {
  const [tables, setTables] = useState<CoreTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTables = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await dockerCoreClient
        .from('gm_tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('number', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setTables(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, [restaurantId]);

  return {
    tables,
    loading,
    error,
    refetch: loadTables,
  };
}
