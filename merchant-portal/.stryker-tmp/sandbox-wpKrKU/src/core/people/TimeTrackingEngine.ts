/**
 * TimeTrackingEngine - Engine de Banco de Horas
 *
 * Gerencia entrada/saída, horas trabalhadas, horas extras.
 *
 * IMPORTANTE (PURE DOCKER / DEV_STABLE):
 * - Módulo `people` está marcado como dataSource: "mock".
 * - Esta engine NÃO deve chamar Supabase nem RPCs reais.
 * - Implementação atual: store in-memory por sessão, suficiente para simular banco de horas.
 */
export interface TimeEntry {
  id: string;
  employeeId: string;
  restaurantId: string;
  shiftId?: string;
  clockIn: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalMinutes?: number;
  breakMinutes: number;
  workedMinutes?: number;
  overtimeMinutes: number;
  status: "active" | "completed" | "cancelled";
  isLate: boolean;
  isAbsent: boolean;
  lateMinutes: number;
  notes?: string;
}

const timeEntriesStore = new Map<string, TimeEntry>();

function generateTimeEntryId(): string {
  // UUID simplificado para ambiente mock; evita depender de globals específicos.
  return `time_entry_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export class TimeTrackingEngine {
  /**
   * Registrar entrada (clock in)
   */
  async clockIn(
    employeeId: string,
    restaurantId: string,
    shiftId?: string,
    clockIn?: Date,
  ): Promise<string> {
    const id = generateTimeEntryId();
    const inAt = (clockIn || new Date()).toISOString();

    const entry: TimeEntry = {
      id,
      employeeId,
      restaurantId,
      shiftId,
      clockIn: new Date(inAt),
      breakMinutes: 0,
      overtimeMinutes: 0,
      status: "active",
      isLate: false,
      isAbsent: false,
      lateMinutes: 0,
    };

    timeEntriesStore.set(id, entry);
    return id;
  }

  /**
   * Registrar saída (clock out)
   */
  async clockOut(
    entryId: string,
    clockOut?: Date,
    breakMinutes: number = 0,
  ): Promise<void> {
    const existing = timeEntriesStore.get(entryId);
    if (!existing) {
      console.warn(
        "[TimeTrackingEngine] clockOut: entrada não encontrada",
        entryId,
      );
      return;
    }

    const outAt = (clockOut || new Date()).toISOString();
    const clockInTime = existing.clockIn.getTime();
    const clockOutTime = new Date(outAt).getTime();

    const totalMinutes = Math.max(
      0,
      Math.round((clockOutTime - clockInTime) / (1000 * 60)),
    );
    const workedMinutes = Math.max(0, totalMinutes - breakMinutes);

    const updated: TimeEntry = {
      ...existing,
      clockOut: new Date(outAt),
      breakMinutes,
      totalMinutes,
      workedMinutes,
      overtimeMinutes: Math.max(0, workedMinutes - 8 * 60),
      status: "completed",
    };

    timeEntriesStore.set(entryId, updated);
  }

  /**
   * Buscar entrada ativa
   */
  async getActiveEntry(employeeId: string): Promise<TimeEntry | null> {
    const all = Array.from(timeEntriesStore.values()).filter(
      (e) => e.employeeId === employeeId && e.status === "active",
    );
    if (all.length === 0) return null;
    all.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime());
    return all[0];
  }

  /**
   * Listar entradas de um funcionário
   */
  async listEntries(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TimeEntry[]> {
    let entries = Array.from(timeEntriesStore.values()).filter(
      (e) => e.employeeId === employeeId,
    );

    if (startDate) {
      const start = startDate.getTime();
      entries = entries.filter((e) => e.clockIn.getTime() >= start);
    }

    if (endDate) {
      const end = endDate.getTime();
      entries = entries.filter((e) => e.clockIn.getTime() <= end);
    }

    entries.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime());
    return entries;
  }

  /**
   * Calcular total de horas trabalhadas
   */
  async getTotalHoursWorked(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    lateArrivals: number;
    absences: number;
  }> {
    const entries = await this.listEntries(employeeId, startDate, endDate);

    let totalMinutes = 0;
    let overtimeMinutes = 0;
    let lateArrivals = 0;
    let absences = 0;

    for (const entry of entries) {
      if (entry.status === "completed" && entry.workedMinutes) {
        totalMinutes += entry.workedMinutes;
        overtimeMinutes += entry.overtimeMinutes;
      }
      if (entry.isLate) lateArrivals++;
      if (entry.isAbsent) absences++;
    }

    const totalHours = totalMinutes / 60;
    const regularHours = (totalMinutes - overtimeMinutes) / 60;
    const overtimeHours = overtimeMinutes / 60;

    return {
      totalHours,
      regularHours,
      overtimeHours,
      lateArrivals,
      absences,
    };
  }

  // mapToTimeEntry removido – armazenamento agora é puramente in-memory.
}

export const timeTrackingEngine = new TimeTrackingEngine();
