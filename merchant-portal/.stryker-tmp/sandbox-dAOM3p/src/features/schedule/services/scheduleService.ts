/**
 * scheduleService - Serviço para gerenciar turnos
 * 
 * TODO: Integrar com Supabase
 * TODO: Implementar RPCs quando disponíveis
 */
// @ts-nocheck


import type { Shift } from '../../../types/schedule';

export async function createShift(shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>): Promise<Shift> {
  // TODO: Implementar criação real
  // RPC: create_shift(...)
  throw new Error('Not implemented');
}

export async function updateShift(shiftId: string, updates: Partial<Shift>): Promise<Shift> {
  // TODO: Implementar atualização real
  // RPC: update_shift(shift_id, ...)
  throw new Error('Not implemented');
}

export async function deleteShift(shiftId: string): Promise<void> {
  // TODO: Implementar deleção real
  // DELETE FROM gm_shifts WHERE id = $1
  throw new Error('Not implemented');
}
