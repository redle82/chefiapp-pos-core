/**
 * TASK PACK READER
 * 
 * Lê Task Packs e Templates.
 * OPERACAO: Para TaskBuilderMinimal (ativar/desativar packs).
 */

import { dockerCoreClient } from '../docker-core/connection';
import type { CoreTaskPack, CoreTaskTemplate } from '../docker-core/types';

/**
 * Lê todos os packs disponíveis.
 */
export async function readAllPacks(): Promise<CoreTaskPack[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_task_packs')
    .select('*')
    .eq('is_active', true)
    .order('code', { ascending: true });

  if (error) {
    throw new Error(`Failed to read packs: ${error.message}`);
  }

  return (data || []) as CoreTaskPack[];
}

/**
 * Lê packs ativados para um restaurante.
 */
export async function readActivatedPacks(restaurantId: string): Promise<CoreTaskPack[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_restaurant_packs')
    .select(`
      pack_id,
      enabled,
      version_locked,
      gm_task_packs (*)
    `)
    .eq('restaurant_id', restaurantId)
    .eq('enabled', true);

  if (error) {
    throw new Error(`Failed to read activated packs: ${error.message}`);
  }

  return (data || []).map((rp: any) => rp.gm_task_packs) as CoreTaskPack[];
}

/**
 * Lê templates de um pack.
 */
export async function readTemplatesByPack(packId: string): Promise<CoreTaskTemplate[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_task_templates')
    .select('*')
    .eq('pack_id', packId)
    .eq('is_active', true)
    .order('code', { ascending: true });

  if (error) {
    throw new Error(`Failed to read templates: ${error.message}`);
  }

  return (data || []) as CoreTaskTemplate[];
}

/**
 * Filtra packs por contexto operacional.
 */
export async function readPacksByContext(
  operationType?: string,
  teamSize?: number,
  tableCount?: number
): Promise<CoreTaskPack[]> {
  let query = dockerCoreClient
    .from('gm_task_packs')
    .select('*')
    .eq('is_active', true);

  if (operationType) {
    query = query.eq('operation_type', operationType);
  }

  if (teamSize !== undefined) {
    query = query.or(`min_team_size.is.null,min_team_size.lte.${teamSize}`);
    query = query.or(`max_team_size.is.null,max_team_size.gte.${teamSize}`);
  }

  if (tableCount !== undefined) {
    query = query.or(`min_tables.is.null,min_tables.lte.${tableCount}`);
    query = query.or(`max_tables.is.null,max_tables.gte.${tableCount}`);
  }

  const { data, error } = await query.order('code', { ascending: true });

  if (error) {
    throw new Error(`Failed to read packs by context: ${error.message}`);
  }

  return (data || []) as CoreTaskPack[];
}
