/**
 * SHIFT READER — Adaptador de Leitura de Shifts (Read-Only)
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

export interface CoreShiftLog {
  id: string;
  restaurant_id: string;
  employee_id: string;
  role: string;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CoreEmployee {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
}

export interface CoreShiftLogWithEmployee extends CoreShiftLog {
  employees?: {
    name: string;
  } | null;
}

/**
 * Lê shifts ativos de um restaurante.
 * 
 * @param restaurantId ID do restaurante
 * @returns Lista de shifts ativos com informações do funcionário
 */
export async function readActiveShifts(restaurantId: string): Promise<CoreShiftLogWithEmployee[]> {
  const { data, error } = await dockerCoreClient
    .from('shift_logs')
    .select(`
      id,
      employee_id,
      role,
      start_time,
      status,
      employees ( name )
    `)
    .eq('restaurant_id', restaurantId)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Failed to read active shifts: ${error.message}`);
  }

  return (data || []) as CoreShiftLogWithEmployee[];
}

/**
 * Lê um shift específico por ID.
 * 
 * @param shiftId ID do shift
 * @returns Shift ou null se não encontrado
 */
export async function readShiftById(shiftId: string): Promise<CoreShiftLog | null> {
  const { data, error } = await dockerCoreClient
    .from('shift_logs')
    .select('*')
    .eq('id', shiftId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to read shift: ${error.message}`);
  }

  return data as CoreShiftLog;
}
