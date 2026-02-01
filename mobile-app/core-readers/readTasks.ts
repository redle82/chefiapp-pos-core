/**
 * Core Reader: Tarefas
 * CORE_APPSTAFF_CONTRACT — AppStaff lê estado do Core; não calcula regras.
 * Mock: retorna dados locais ou API quando existir.
 */

export interface CoreTask {
  id: string;
  title: string;
  priority: 'background' | 'attention' | 'urgent' | 'critical';
  status: 'pending' | 'in_progress' | 'done';
  category: string;
  createdAt: number;
}

export interface ReadTasksResult {
  tasks: CoreTask[];
  error: Error | null;
}

/**
 * Lê tarefas do Core para o restaurante/turno actual.
 * Arquitetura: Core é fonte de verdade; este reader apenas expõe.
 */
export async function readTasks(restaurantId: string | null, shiftId: string | null): Promise<ReadTasksResult> {
  // Mock: sem backend real, retorna vazio; substituir por chamada ao Core/API
  if (!restaurantId) {
    return { tasks: [], error: null };
  }
  try {
    // TODO: chamada real ao Core (RPC ou REST)
    const tasks: CoreTask[] = [];
    return { tasks, error: null };
  } catch (e) {
    return { tasks: [], error: e instanceof Error ? e : new Error(String(e)) };
  }
}
