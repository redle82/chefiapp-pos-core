/**
 * Pending Sync — CORE_APPSTAFF_CONTRACT (offline mínimo)
 *
 * Eventos que o AppStaff emite offline (tarefa concluída, check-in, check-out)
 * ficam marcados como "pending sync" até o Core estar disponível.
 * Tarefas já carregadas continuam visíveis em memória (AppStaffContext).
 * Sync complexo não implementado; apenas estrutura em AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_SYNC_KEY = 'appstaff_pending_sync';

export type PendingEventType = 'task_completed' | 'check_in' | 'check_out';

export interface PendingEvent {
  id: string;
  type: PendingEventType;
  payload: Record<string, unknown>;
  createdAt: number;
  status: 'pending' | 'syncing' | 'failed';
}

export const PendingSync = {
  async add(type: PendingEventType, payload: Record<string, unknown>): Promise<string> {
    const queue = await this.getAll();
    const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    queue.push({
      id,
      type,
      payload,
      createdAt: Date.now(),
      status: 'pending',
    });
    await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
    return id;
  },

  async getAll(): Promise<PendingEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async getPending(): Promise<PendingEvent[]> {
    const queue = await this.getAll();
    return queue.filter((e) => e.status === 'pending');
  },

  async remove(id: string): Promise<void> {
    const queue = (await this.getAll()).filter((e) => e.id !== id);
    await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(PENDING_SYNC_KEY);
  },
};
