/**
 * useRestaurantId - Hook Helper para Obter Restaurant ID
 * 
 * Hook reutilizável que retorna o restaurant_id atual do sistema.
 * Usa useRestaurantIdentity() como fonte principal, com fallbacks apropriados.
 */

import { useState, useEffect } from 'react';
import { useRestaurantIdentity } from '../identity/useRestaurantIdentity';
import { getTabIsolated } from '../storage/TabIsolatedStorage';

/**
 * Hook que retorna o restaurant_id atual
 * 
 * @returns { restaurantId: string | null, loading: boolean }
 */
export function useRestaurantId() {
  const { identity } = useRestaurantIdentity();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obter restaurant_id usando o mesmo padrão do sistema
    const id = identity.id || getTabIsolated('chefiapp_restaurant_id') || null;
    
    setRestaurantId(id);
    setLoading(identity.loading);
  }, [identity.id, identity.loading]);

  return { restaurantId, loading };
}
