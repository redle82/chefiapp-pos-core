/**
 * PULSE READER — Adaptador de Leitura de Pulses (Read-Only)
 * 
 * FASE 3.5: Padronização de Acesso ao Core
 * 
 * REGRAS:
 * - Apenas leitura (read-only)
 * - Não cria nada
 * - Não altera estado
 * - Usa core-boundary/docker-core/connection.ts
 */

import { dockerCoreClient } from '../docker-core/connection';

export interface CoreRestaurantMember {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: string;
  created_at: string;
  restaurants?: {
    name: string;
  } | null;
}

export interface CoreEmpirePulse {
  id: string;
  restaurant_id: string;
  user_id: string;
  pulse_type: string;
  payload: any;
  created_at: string;
  updated_at: string;
}

/**
 * Lê membros de um restaurante.
 * 
 * @param restaurantId ID do restaurante
 * @returns Lista de membros do restaurante
 */
export async function readRestaurantMembers(restaurantId: string): Promise<CoreRestaurantMember[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_restaurant_members')
    .select('*, restaurants(name)')
    .eq('restaurant_id', restaurantId);

  if (error) {
    throw new Error(`Failed to read restaurant members: ${error.message}`);
  }

  return (data || []) as CoreRestaurantMember[];
}

/**
 * Lê membros por user_id.
 * 
 * @param userId ID do usuário
 * @returns Membro ou null se não encontrado
 */
export async function readRestaurantMemberByUserId(userId: string): Promise<CoreRestaurantMember | null> {
  const { data, error } = await dockerCoreClient
    .from('gm_restaurant_members')
    .select('*, restaurants(name)')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to read restaurant member: ${error.message}`);
  }

  return data as CoreRestaurantMember;
}

/**
 * Lê pulses de um restaurante.
 * 
 * @param restaurantId ID do restaurante
 * @param limit Limite de resultados (padrão: 50)
 * @returns Lista de pulses ordenados por created_at desc
 */
export async function readEmpirePulses(
  restaurantId: string,
  limit: number = 50
): Promise<CoreEmpirePulse[]> {
  const { data, error } = await dockerCoreClient
    .from('empire_pulses')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to read empire pulses: ${error.message}`);
  }

  return (data || []) as CoreEmpirePulse[];
}
