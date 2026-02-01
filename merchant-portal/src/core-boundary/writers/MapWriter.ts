/**
 * MAP WRITER
 * 
 * Escreve/atualiza dados do mapa do restaurante (zonas, mesas).
 * OPERACAO: Contexto operacional para tarefas e KDS.
 */

import { dockerCoreClient } from '../docker-core/connection';
import type { CoreRestaurantZone, CoreRestaurantTable } from '../docker-core/types';

/**
 * Cria ou atualiza uma zona.
 */
export async function upsertZone(zone: Partial<CoreRestaurantZone> & { restaurant_id: string; code: string; name: string }): Promise<CoreRestaurantZone> {
  const { data, error } = await dockerCoreClient
    .from('gm_restaurant_zones')
    .upsert({
      ...zone,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'restaurant_id,code',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert zone: ${error.message}`);
  }

  return data as CoreRestaurantZone;
}

/**
 * Cria ou atualiza uma mesa.
 */
export async function upsertTable(table: Partial<CoreRestaurantTable> & { restaurant_id: string; number: number }): Promise<CoreRestaurantTable> {
  const { data, error } = await dockerCoreClient
    .from('gm_restaurant_tables')
    .upsert({
      ...table,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'restaurant_id,number',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert table: ${error.message}`);
  }

  return data as CoreRestaurantTable;
}

/**
 * Desativa uma zona.
 */
export async function deactivateZone(zoneId: string): Promise<void> {
  const { error } = await dockerCoreClient
    .from('gm_restaurant_zones')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', zoneId);

  if (error) {
    throw new Error(`Failed to deactivate zone: ${error.message}`);
  }
}

/**
 * Desativa uma mesa.
 */
export async function deactivateTable(tableId: string): Promise<void> {
  const { error } = await dockerCoreClient
    .from('gm_restaurant_tables')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tableId);

  if (error) {
    throw new Error(`Failed to deactivate table: ${error.message}`);
  }
}
