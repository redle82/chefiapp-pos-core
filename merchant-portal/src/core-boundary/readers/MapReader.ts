/**
 * MAP READER
 * 
 * Lê dados do mapa do restaurante (zonas, mesas).
 * OPERACAO: Contexto operacional para tarefas e KDS.
 */

import { dockerCoreClient } from '../docker-core/connection';
import type { CoreRestaurantZone, CoreRestaurantTable } from '../docker-core/types';

/**
 * Lê zonas ativas de um restaurante.
 */
export async function readZones(restaurantId: string): Promise<CoreRestaurantZone[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_restaurant_zones')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to read zones: ${error.message}`);
  }

  return (data || []) as CoreRestaurantZone[];
}

/**
 * Lê mesas ativas de um restaurante.
 */
export async function readTables(restaurantId: string): Promise<CoreRestaurantTable[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_restaurant_tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('number', { ascending: true });

  if (error) {
    throw new Error(`Failed to read tables: ${error.message}`);
  }

  return (data || []) as CoreRestaurantTable[];
}

/**
 * Lê mesas de uma zona específica.
 */
export async function readTablesByZone(restaurantId: string, zoneId: string): Promise<CoreRestaurantTable[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_restaurant_tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('zone_id', zoneId)
    .eq('is_active', true)
    .order('number', { ascending: true });

  if (error) {
    throw new Error(`Failed to read tables by zone: ${error.message}`);
  }

  return (data || []) as CoreRestaurantTable[];
}
