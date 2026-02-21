/**
 * useOperation - Hook para operação ao vivo
 * 
 * TODO: Integrar com Orders e KDS
 * TODO: Conectar com Supabase
 * TODO: Implementar queries reais
 */
// @ts-nocheck


import { useState, useEffect } from 'react';

interface Order {
  id: string;
  table: string;
  status: string;
  time: string;
  progress: number;
}

interface KDSItem {
  id: string;
  name: string;
  table: string;
  time: string;
  status: string;
  station: string;
}

export function useActiveOrders(restaurantId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // TODO: Implementar query real
    // SELECT * FROM gm_orders WHERE restaurant_id = $1 AND status IN ('OPEN', 'IN_PROGRESS')
    setLoading(false);
  }, [restaurantId]);

  return { orders, loading, error };
}

export function useKDSByStation(restaurantId: string, station: string) {
  const [items, setItems] = useState<KDSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // TODO: Implementar query real
    // SELECT * FROM gm_kds_items WHERE restaurant_id = $1 AND station = $2 AND status != 'READY'
    setLoading(false);
  }, [restaurantId, station]);

  return { items, loading, error };
}
