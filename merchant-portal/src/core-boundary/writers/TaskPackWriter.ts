/**
 * TASK PACK WRITER
 * 
 * Ativa/desativa Task Packs para restaurantes.
 * OPERACAO: Para TaskBuilderMinimal.
 */

import { dockerCoreClient } from '../docker-core/connection';

/**
 * Ativa um pack para um restaurante.
 */
export async function activatePack(restaurantId: string, packId: string, versionLocked?: string): Promise<void> {
  const { error } = await dockerCoreClient
    .from('gm_restaurant_packs')
    .upsert({
      restaurant_id: restaurantId,
      pack_id: packId,
      enabled: true,
      version_locked: versionLocked || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'restaurant_id,pack_id',
    });

  if (error) {
    throw new Error(`Failed to activate pack: ${error.message}`);
  }
}

/**
 * Desativa um pack para um restaurante.
 */
export async function deactivatePack(restaurantId: string, packId: string): Promise<void> {
  const { error } = await dockerCoreClient
    .from('gm_restaurant_packs')
    .update({
      enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('restaurant_id', restaurantId)
    .eq('pack_id', packId);

  if (error) {
    throw new Error(`Failed to deactivate pack: ${error.message}`);
  }
}
