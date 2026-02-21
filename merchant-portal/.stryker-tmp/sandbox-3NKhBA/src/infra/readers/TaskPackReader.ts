/**
 * TaskPackReader — Packs de tarefas por contexto (stub até existir tabela no Core).
 */
// @ts-nocheck


export interface CoreTaskPack {
  id: string;
  name: string;
  context?: string;
  team_size?: number;
  table_count?: number;
  [key: string]: unknown;
}

export async function readPacksByContext(
  _operationType: string,
  _teamSize: number,
  _tableCount: number
): Promise<CoreTaskPack[]> {
  return [];
}

export async function readActivatedPacks(
  _restaurantId: string
): Promise<CoreTaskPack[]> {
  return [];
}
