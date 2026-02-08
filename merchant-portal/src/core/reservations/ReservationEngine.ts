/**
 * ReservationEngine - Engine de Reservas
 *
 * Gerencia reservas online, internas, overbooking e no-shows
 *
 * IMPORTANTE (PURE DOCKER / DEV_STABLE):
 * - Módulo `reservations` está marcado como dataSource: "mock" em `moduleCatalog`.
 * - Esta engine NÃO deve chamar Supabase nem RPCs reais.
 * - Implementação atual: store in-memory por sessão, suficiente para simular reservas.
 */

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";
export type ReservationSource = "online" | "internal" | "phone" | "walk_in";

export interface Reservation {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerNotes?: string;
  reservationDate: Date;
  reservationTime: string;
  partySize: number;
  tableId?: string;
  status: ReservationStatus;
  confirmedAt?: Date;
  seatedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledReason?: string;
  source: ReservationSource;
  isOverbooking: boolean;
  overbookingReason?: string;
  relatedOrderId?: string;
  assignedStaffId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoShowHistory {
  id: string;
  reservationId: string;
  restaurantId: string;
  reservationDate: Date;
  reservationTime: string;
  partySize: number;
  customerName: string;
  customerPhone?: string;
  estimatedRevenueLoss: number;
  tableWastedTimeMinutes: number;
  createdAt: Date;
}

export interface OverbookingConfig {
  id: string;
  restaurantId: string;
  enabled: boolean;
  maxOverbookingPercentage: number;
  overbookingWindowHours: number;
  allowOverbookingOnWeekends: boolean;
  allowOverbookingOnHolidays: boolean;
  minPartySizeForOverbooking: number;
}

export interface NoShowStats {
  totalNoShows: number;
  totalReservations: number;
  noShowRate: number;
  totalRevenueLoss: number;
}

const reservationsStore = new Map<string, Reservation>();
const noShowHistoryStore = new Map<string, NoShowHistory>();
const overbookingConfigStore = new Map<string, OverbookingConfig>(); // por restaurantId

function generateId(prefix: string): string {
  // UUID simplificado para ambiente mock; evita depender de globals específicos.
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export class ReservationEngine {
  /**
   * Criar reserva
   */
  async create(reservation: {
    restaurantId: string;
    customerName: string;
    reservationDate: Date;
    reservationTime: string;
    partySize: number;
    customerPhone?: string;
    customerEmail?: string;
    customerNotes?: string;
    source?: ReservationSource;
    tableId?: string;
  }): Promise<string> {
    const id = generateId("reservation");
    const now = new Date();

    const entry: Reservation = {
      id,
      restaurantId: reservation.restaurantId,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail,
      customerNotes: reservation.customerNotes,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      partySize: reservation.partySize,
      tableId: reservation.tableId,
      status: "pending",
      confirmedAt: undefined,
      seatedAt: undefined,
      completedAt: undefined,
      cancelledAt: undefined,
      cancelledReason: undefined,
      source: reservation.source || "internal",
      isOverbooking: false,
      overbookingReason: undefined,
      relatedOrderId: undefined,
      assignedStaffId: undefined,
      createdAt: now,
      updatedAt: now,
    };

    reservationsStore.set(id, entry);
    return id;
  }

  /**
   * Listar reservas
   */
  async list(
    restaurantId: string,
    filters?: {
      date?: Date;
      status?: ReservationStatus[];
      source?: ReservationSource[];
      limit?: number;
    },
  ): Promise<Reservation[]> {
    let items = Array.from(reservationsStore.values()).filter(
      (r) => r.restaurantId === restaurantId,
    );

    if (filters?.date) {
      const dateStr = filters.date.toISOString().split("T")[0];
      items = items.filter(
        (r) => r.reservationDate.toISOString().split("T")[0] === dateStr,
      );
    }

    if (filters?.status && filters.status.length > 0) {
      items = items.filter((r) => filters.status!.includes(r.status));
    }

    if (filters?.source && filters.source.length > 0) {
      items = items.filter((r) => filters.source!.includes(r.source));
    }

    items.sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));

    if (filters?.limit) {
      items = items.slice(0, filters.limit);
    }

    return items;
  }

  /**
   * Listar reservas do dia
   */
  async listForDate(restaurantId: string, date: Date): Promise<Reservation[]> {
    return this.list(restaurantId, { date });
  }

  /**
   * Atualizar status da reserva
   */
  async updateStatus(
    reservationId: string,
    newStatus: ReservationStatus,
    notes?: string,
  ): Promise<void> {
    const existing = reservationsStore.get(reservationId);
    if (!existing) {
      console.warn(
        "[ReservationEngine] updateStatus: reserva não encontrada",
        reservationId,
      );
      return;
    }

    const now = new Date();
    const updated: Reservation = {
      ...existing,
      status: newStatus,
      updatedAt: now,
      confirmedAt: newStatus === "confirmed" ? now : existing.confirmedAt,
      seatedAt: newStatus === "seated" ? now : existing.seatedAt,
      completedAt: newStatus === "completed" ? now : existing.completedAt,
      cancelledAt: newStatus === "cancelled" ? now : existing.cancelledAt,
      cancelledReason:
        newStatus === "cancelled" ? notes : existing.cancelledReason,
    };

    reservationsStore.set(reservationId, updated);

    if (newStatus === "no_show") {
      const historyId = generateId("no_show");
      const entry: NoShowHistory = {
        id: historyId,
        reservationId,
        restaurantId: existing.restaurantId,
        reservationDate: existing.reservationDate,
        reservationTime: existing.reservationTime,
        partySize: existing.partySize,
        customerName: existing.customerName,
        customerPhone: existing.customerPhone,
        estimatedRevenueLoss: existing.partySize * 50, // mock
        tableWastedTimeMinutes: 90,
        createdAt: now,
      };
      noShowHistoryStore.set(historyId, entry);
    }
  }

  /**
   * Calcular impacto de estoque
   */
  async calculateInventoryImpact(reservationId: string): Promise<{
    reservationId: string;
    partySize: number;
    estimatedConsumption: Record<string, number>;
    forecastedDishes: Array<{ dishId: string; quantity: number }>;
  }> {
    const reservation = reservationsStore.get(reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    // Mock simples: estima consumo proporcional ao partySize.
    return {
      reservationId,
      partySize: reservation.partySize,
      estimatedConsumption: {
        beverage: reservation.partySize * 2,
        main_course: reservation.partySize,
      },
      forecastedDishes: [
        { dishId: "mock-dish-1", quantity: reservation.partySize },
      ],
    };
  }

  /**
   * Buscar configuração de overbooking
   */
  async getOverbookingConfig(
    restaurantId: string,
  ): Promise<OverbookingConfig | null> {
    const existing = overbookingConfigStore.get(restaurantId);
    if (existing) return existing;
    return null;
  }

  /**
   * Criar ou atualizar configuração de overbooking
   */
  async upsertOverbookingConfig(config: {
    restaurantId: string;
    enabled?: boolean;
    maxOverbookingPercentage?: number;
    overbookingWindowHours?: number;
    allowOverbookingOnWeekends?: boolean;
    allowOverbookingOnHolidays?: boolean;
    minPartySizeForOverbooking?: number;
  }): Promise<void> {
    const current: OverbookingConfig = overbookingConfigStore.get(
      config.restaurantId,
    ) ?? {
      id: generateId("overbooking_config"),
      restaurantId: config.restaurantId,
      enabled: false,
      maxOverbookingPercentage: 10,
      overbookingWindowHours: 2,
      allowOverbookingOnWeekends: true,
      allowOverbookingOnHolidays: false,
      minPartySizeForOverbooking: 4,
    };

    const updated: OverbookingConfig = {
      ...current,
      enabled: config.enabled ?? current.enabled,
      maxOverbookingPercentage:
        config.maxOverbookingPercentage ?? current.maxOverbookingPercentage,
      overbookingWindowHours:
        config.overbookingWindowHours ?? current.overbookingWindowHours,
      allowOverbookingOnWeekends:
        config.allowOverbookingOnWeekends ?? current.allowOverbookingOnWeekends,
      allowOverbookingOnHolidays:
        config.allowOverbookingOnHolidays ?? current.allowOverbookingOnHolidays,
      minPartySizeForOverbooking:
        config.minPartySizeForOverbooking ?? current.minPartySizeForOverbooking,
    };

    overbookingConfigStore.set(config.restaurantId, updated);
  }

  /**
   * Listar histórico de no-shows
   */
  async listNoShows(
    restaurantId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<NoShowHistory[]> {
    let items = Array.from(noShowHistoryStore.values()).filter(
      (h) => h.restaurantId === restaurantId,
    );

    if (filters?.startDate) {
      const start = filters.startDate.getTime();
      items = items.filter((h) => h.reservationDate.getTime() >= start);
    }

    if (filters?.endDate) {
      const end = filters.endDate.getTime();
      items = items.filter((h) => h.reservationDate.getTime() <= end);
    }

    items.sort(
      (a, b) => b.reservationDate.getTime() - a.reservationDate.getTime(),
    );

    if (filters?.limit) {
      items = items.slice(0, filters.limit);
    }

    return items;
  }

  /**
   * Calcular estatísticas de no-show
   */
  async calculateNoShowStats(
    restaurantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<NoShowStats> {
    const history = await this.listNoShows(restaurantId, {
      startDate,
      endDate,
    });

    const totalNoShows = history.length;
    const totalReservations = Array.from(reservationsStore.values()).filter(
      (r) =>
        r.restaurantId === restaurantId &&
        (!startDate || r.reservationDate >= startDate) &&
        (!endDate || r.reservationDate <= endDate),
    ).length;

    const totalRevenueLoss = history.reduce(
      (acc, h) => acc + h.estimatedRevenueLoss,
      0,
    );

    const noShowRate =
      totalReservations > 0 ? totalNoShows / totalReservations : 0;

    return {
      totalNoShows,
      totalReservations,
      noShowRate,
      totalRevenueLoss,
    };
  }
}

export const reservationEngine = new ReservationEngine();
