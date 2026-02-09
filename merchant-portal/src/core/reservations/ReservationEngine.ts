/**
 * ReservationEngine - Engine de Reservas
 *
 * Gerencia reservas online, internas, overbooking e no-shows.
 *
 * DOCKER CORE — PostgREST persistence.
 * Todas as operações são persistidas em:
 *  - gm_reservations
 *  - gm_no_show_history
 *  - gm_overbooking_config
 *
 * Fallback: se o Core não responder, escrevemos em memória local
 * para não bloquear a operação do restaurante.
 */
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

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

// In-memory fallback when Core is unreachable
const localCache = new Map<string, Reservation>();

/** Map DB row (snake_case) → domain object (camelCase) */
function rowToReservation(row: any): Reservation {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    customerNotes: row.customer_notes ?? undefined,
    reservationDate: new Date(row.reservation_date),
    reservationTime: row.reservation_time,
    partySize: row.party_size,
    tableId: row.table_id ?? undefined,
    status: row.status as ReservationStatus,
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined,
    seatedAt: row.seated_at ? new Date(row.seated_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
    cancelledReason: row.cancelled_reason ?? undefined,
    source: row.source as ReservationSource,
    isOverbooking: row.is_overbooking ?? false,
    overbookingReason: row.overbooking_reason ?? undefined,
    relatedOrderId: row.related_order_id ?? undefined,
    assignedStaffId: row.assigned_staff_id ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToNoShow(row: any): NoShowHistory {
  return {
    id: row.id,
    reservationId: row.reservation_id,
    restaurantId: row.restaurant_id,
    reservationDate: new Date(row.reservation_date),
    reservationTime: row.reservation_time,
    partySize: row.party_size,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? undefined,
    estimatedRevenueLoss: Number(row.estimated_revenue_loss ?? 0),
    tableWastedTimeMinutes: row.table_wasted_time_minutes ?? 0,
    createdAt: new Date(row.created_at),
  };
}

function rowToOverbookingConfig(row: any): OverbookingConfig {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    enabled: row.enabled ?? false,
    maxOverbookingPercentage: row.max_overbooking_percentage ?? 10,
    overbookingWindowHours: row.overbooking_window_hours ?? 2,
    allowOverbookingOnWeekends: row.allow_overbooking_on_weekends ?? true,
    allowOverbookingOnHolidays: row.allow_overbooking_on_holidays ?? false,
    minPartySizeForOverbooking: row.min_party_size_for_overbooking ?? 4,
  };
}

export class ReservationEngine {
  private getClient() {
    try {
      return getDockerCoreFetchClient();
    } catch {
      return null;
    }
  }

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
    const client = this.getClient();
    const dateStr =
      reservation.reservationDate instanceof Date
        ? reservation.reservationDate.toISOString().split("T")[0]
        : String(reservation.reservationDate);

    if (client) {
      const { data, error } = await client
        .from("gm_reservations")
        .insert({
          restaurant_id: reservation.restaurantId,
          customer_name: reservation.customerName,
          customer_phone: reservation.customerPhone ?? null,
          customer_email: reservation.customerEmail ?? null,
          customer_notes: reservation.customerNotes ?? null,
          reservation_date: dateStr,
          reservation_time: reservation.reservationTime,
          party_size: reservation.partySize,
          table_id: reservation.tableId ?? null,
          status: "pending",
          source: reservation.source || "internal",
          is_overbooking: false,
        })
        .select("id")
        .single();

      if (!error && data) {
        return data.id;
      }
      console.warn(
        "[ReservationEngine] Core insert failed, using fallback:",
        error,
      );
    }

    // Fallback: in-memory
    const id = `reservation_${Math.random()
      .toString(36)
      .slice(2)}_${Date.now()}`;
    const now = new Date();
    localCache.set(id, {
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
      source: reservation.source || "internal",
      isOverbooking: false,
      createdAt: now,
      updatedAt: now,
    });
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
    const client = this.getClient();

    if (client) {
      let query = client
        .from("gm_reservations")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("reservation_time", { ascending: true });

      if (filters?.date) {
        const dateStr = filters.date.toISOString().split("T")[0];
        query = query.eq("reservation_date", dateStr);
      }

      if (filters?.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }

      if (filters?.source && filters.source.length > 0) {
        query = query.in("source", filters.source);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (!error && data) {
        return data.map(rowToReservation);
      }
      console.warn(
        "[ReservationEngine] Core list failed, using fallback:",
        error,
      );
    }

    // Fallback: in-memory
    let items = Array.from(localCache.values()).filter(
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
    if (filters?.limit) items = items.slice(0, filters.limit);
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
    const client = this.getClient();
    const now = new Date().toISOString();

    const updatePayload: Record<string, any> = { status: newStatus };
    if (newStatus === "confirmed") updatePayload.confirmed_at = now;
    if (newStatus === "seated") updatePayload.seated_at = now;
    if (newStatus === "completed") updatePayload.completed_at = now;
    if (newStatus === "cancelled") {
      updatePayload.cancelled_at = now;
      if (notes) updatePayload.cancelled_reason = notes;
    }

    if (client) {
      // Get current reservation for no-show handling
      const { data: existing } = await client
        .from("gm_reservations")
        .select("*")
        .eq("id", reservationId)
        .single();

      const { error } = await client
        .from("gm_reservations")
        .update(updatePayload)
        .eq("id", reservationId);

      if (error) {
        console.warn("[ReservationEngine] Core updateStatus failed:", error);
      }

      // Record no-show history
      if (newStatus === "no_show" && existing) {
        await client.from("gm_no_show_history").insert({
          reservation_id: reservationId,
          restaurant_id: existing.restaurant_id,
          reservation_date: existing.reservation_date,
          reservation_time: existing.reservation_time,
          party_size: existing.party_size,
          customer_name: existing.customer_name,
          customer_phone: existing.customer_phone,
          estimated_revenue_loss: existing.party_size * 50,
          table_wasted_time_minutes: 90,
        });
      }
      return;
    }

    // Fallback: in-memory
    const existing = localCache.get(reservationId);
    if (!existing) {
      console.warn("[ReservationEngine] reservation not found:", reservationId);
      return;
    }
    const nowDate = new Date();
    localCache.set(reservationId, {
      ...existing,
      status: newStatus,
      updatedAt: nowDate,
      confirmedAt: newStatus === "confirmed" ? nowDate : existing.confirmedAt,
      seatedAt: newStatus === "seated" ? nowDate : existing.seatedAt,
      completedAt: newStatus === "completed" ? nowDate : existing.completedAt,
      cancelledAt: newStatus === "cancelled" ? nowDate : existing.cancelledAt,
      cancelledReason:
        newStatus === "cancelled" ? notes : existing.cancelledReason,
    });
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
    const client = this.getClient();
    let partySize = 0;

    if (client) {
      const { data } = await client
        .from("gm_reservations")
        .select("party_size")
        .eq("id", reservationId)
        .single();
      if (data) partySize = data.party_size;
    } else {
      const r = localCache.get(reservationId);
      if (r) partySize = r.partySize;
    }

    if (!partySize) throw new Error("Reservation not found");

    return {
      reservationId,
      partySize,
      estimatedConsumption: {
        beverage: partySize * 2,
        main_course: partySize,
      },
      forecastedDishes: [{ dishId: "forecast-dish-1", quantity: partySize }],
    };
  }

  /**
   * Buscar configuração de overbooking
   */
  async getOverbookingConfig(
    restaurantId: string,
  ): Promise<OverbookingConfig | null> {
    const client = this.getClient();

    if (client) {
      const { data, error } = await client
        .from("gm_overbooking_config")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (!error && data) return rowToOverbookingConfig(data);
    }

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
    const client = this.getClient();
    if (!client) return;

    const payload: Record<string, any> = {
      restaurant_id: config.restaurantId,
    };
    if (config.enabled !== undefined) payload.enabled = config.enabled;
    if (config.maxOverbookingPercentage !== undefined)
      payload.max_overbooking_percentage = config.maxOverbookingPercentage;
    if (config.overbookingWindowHours !== undefined)
      payload.overbooking_window_hours = config.overbookingWindowHours;
    if (config.allowOverbookingOnWeekends !== undefined)
      payload.allow_overbooking_on_weekends = config.allowOverbookingOnWeekends;
    if (config.allowOverbookingOnHolidays !== undefined)
      payload.allow_overbooking_on_holidays = config.allowOverbookingOnHolidays;
    if (config.minPartySizeForOverbooking !== undefined)
      payload.min_party_size_for_overbooking =
        config.minPartySizeForOverbooking;

    const { error } = await client
      .from("gm_overbooking_config")
      .upsert(payload, { onConflict: "restaurant_id" });

    if (error) {
      console.warn(
        "[ReservationEngine] upsertOverbookingConfig failed:",
        error,
      );
    }
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
    const client = this.getClient();

    if (client) {
      let query = client
        .from("gm_no_show_history")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("reservation_date", { ascending: false });

      if (filters?.startDate) {
        query = query.gte(
          "reservation_date",
          filters.startDate.toISOString().split("T")[0],
        );
      }
      if (filters?.endDate) {
        query = query.lte(
          "reservation_date",
          filters.endDate.toISOString().split("T")[0],
        );
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (!error && data) return data.map(rowToNoShow);
    }

    return [];
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
    const totalRevenueLoss = history.reduce(
      (acc, h) => acc + h.estimatedRevenueLoss,
      0,
    );

    // Count total reservations in range for no-show rate
    const client = this.getClient();
    let totalReservations = 0;

    if (client) {
      let query = client
        .from("gm_reservations")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId);

      if (startDate) {
        query = query.gte(
          "reservation_date",
          startDate.toISOString().split("T")[0],
        );
      }
      if (endDate) {
        query = query.lte(
          "reservation_date",
          endDate.toISOString().split("T")[0],
        );
      }

      const { count } = await query;
      totalReservations = count ?? 0;
    }

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
