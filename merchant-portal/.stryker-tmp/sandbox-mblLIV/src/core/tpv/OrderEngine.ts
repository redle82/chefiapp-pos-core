/**
 * Order Engine - Núcleo do TPV Real
 *
 * Gerencia pedidos como entidades vivas com estados controlados e persistência real.
 *
 * Estados:
 * - OPEN: Pedido aberto, pode ser modificado
 * - IN_PREP: Pedido enviado para cozinha
 * - READY: Pedido pronto
 * - PAID: Pedido pago
 * - CANCELLED: Pedido cancelado
 */

// LEGACY / LAB — order creation via CoreOrdersApi; blocked in Docker mode
import { createOrderAtomic } from "../infra/CoreOrdersApi";
import { supabase } from "../supabase";

import { Logger } from "../logger";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "canceled";
export type PaymentStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "FAILED";
export type PaymentMethod = "cash" | "card" | "pix" | "loyalty";

export class OrderEngineError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "OrderEngineError";
  }
}

export interface OrderItemInput {
  productId?: string;
  name: string;
  priceCents: number;
  quantity: number;
  modifiers?: any[];
  notes?: string;
  categoryName?: string;
  consumptionGroupId?: string | null; // Para divisão de conta
  /** Ronda / course number (1 = primeira, 2 = segunda, etc.) */
  course?: number;
}

export interface OrderInput {
  restaurantId: string;
  tableNumber?: number;
  tableId?: string;
  operatorId?: string;
  cashRegisterId?: string;
  source?: "tpv" | "web" | "app";
  notes?: string;
  items: OrderItemInput[];
  syncMetadata?: {
    localId: string;
    syncAttempts: number;
    lastSyncAt: string;
  };
}

export interface Order {
  id: string;
  restaurantId: string;
  tableNumber?: number;
  tableId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalCents: number;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  source: "tpv" | "web" | "app";
  operatorId?: string;
  operatorName?: string;
  cashRegisterId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  nameSnapshot: string;
  priceSnapshot: number; // em centavos
  quantity: number;
  subtotalCents: number;
  modifiers?: any[];
  notes?: string;
  categoryName?: string;
  createdAt: Date;
  // KDS Fields
  status?: "pending" | "preparing" | "ready" | "voided";
  startedAt?: Date;
  completedAt?: Date;
  stationId?: string;
}

export class OrderEngine {
  /**
   * Criar novo pedido via RPC create_order_atomic.
   * Exposto para testes E2E e chamadas server-side que precisam criar pedido de forma atômica.
   * UI usa Kernel/OrderContext; este método usa o mesmo RPC para consistência.
   */
  static async createOrder(input: OrderInput): Promise<Order> {
    if (!input.items?.length) {
      throw new OrderEngineError(
        "Pedido deve ter pelo menos um item.",
        "ORDER_NO_ITEMS",
      );
    }
    const rpcItems = input.items.map((item) => ({
      product_id: item.productId ?? null,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.priceCents,
    }));
    const syncMetadata: Record<string, unknown> = {
      origin:
        input.source === "web"
          ? "WEB"
          : input.source === "app"
          ? "APP"
          : "CAIXA",
    };
    if (input.tableId) syncMetadata.table_id = input.tableId;
    if (input.tableNumber != null)
      syncMetadata.table_number = input.tableNumber;

    const { data, error } = await createOrderAtomic({
      p_restaurant_id: input.restaurantId,
      p_items: rpcItems,
      p_payment_method: "cash",
      p_sync_metadata: syncMetadata,
    });

    if (error) {
      Logger.error("ORDER_CREATE_FAILED", error, {
        restaurantId: input.restaurantId,
      });
      throw new OrderEngineError(
        error.message ?? "Falha ao criar pedido.",
        error.code ?? "ORDER_CREATE_FAILED",
      );
    }
    if (!data?.id) {
      throw new OrderEngineError(
        "RPC não retornou ID do pedido.",
        "ORDER_CREATE_FAILED",
      );
    }
    return this.getOrderById(data.id);
  }

  /**
   * Buscar pedido por ID
   */
  static async getOrderById(orderId: string): Promise<Order> {
    const chain = (supabase as any)
      .from("gm_orders")
      .select(
        `
                *,
                items:gm_order_items(*)
            `,
      )
      .eq("id", orderId)
      .single();
    const { data: orderData, error } = (await chain) as {
      data: unknown;
      error: { message?: string } | null;
    };

    if (error) {
      Logger.error("ORDER_FETCH_FAILED", error, { orderId });
      throw new OrderEngineError(
        `Pedido não encontrado. Verifique se o ID está correto.`,
        "ORDER_NOT_FOUND",
      );
    }
    if (!orderData) {
      throw new OrderEngineError(
        "Pedido não encontrado. Ele pode ter sido cancelado ou já finalizado.",
        "ORDER_NOT_FOUND",
      );
    }

    return this.mapDbOrderToOrder(
      orderData as Parameters<typeof OrderEngine.mapDbOrderToOrder>[0],
    );
  }

  /**
   * Atualizar status do pedido
   */
  // --- WRITE METHODS REMOVED FOR SOVEREIGNTY ---
  // All modifications must go through Kernel.execute()
  // createOrder() remains as it uses Atomic RPC (Server-Side Logic)

  /**
   * Buscar pedido ativo por mesa
   */
  static async getActiveOrderByTable(
    restaurantId: string,
    tableId: string,
  ): Promise<Order | null> {
    const chain = (supabase as any)
      .from("gm_orders")
      .select(
        `
                *,
                items:gm_order_items(*)
            `,
      )
      .eq("restaurant_id", restaurantId)
      .eq("table_id", tableId)
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = (await chain) as {
      data: unknown;
      error: { message?: string } | null;
    };

    if (error) {
      Logger.error("ORDER_FETCH_BY_TABLE_FAILED", error, {
        restaurantId,
        tableId,
      });
      throw new OrderEngineError(
        "Erro ao buscar pedido da mesa. Tente novamente.",
        "ORDER_FETCH_FAILED",
      );
    }
    if (!data) return null;

    return this.mapDbOrderToOrder(
      data as Parameters<typeof OrderEngine.mapDbOrderToOrder>[0],
    );
  }

  /**
   * Buscar pedidos ativos do restaurante
   */
  static async getActiveOrders(restaurantId: string): Promise<Order[]> {
    const chain = (supabase as any)
      .from("gm_orders")
      .select(
        `
                *,
                items:gm_order_items(*)
            `,
      )
      .eq("restaurant_id", restaurantId)
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: false });
    const { data, error } = (await chain) as {
      data: unknown[] | null;
      error: { message?: string } | null;
    };

    if (error) {
      Logger.error("ACTIVE_ORDERS_FETCH_FAILED", error, { restaurantId });
      throw new OrderEngineError(
        "Erro ao buscar pedidos ativos. Tente novamente.",
        "ORDERS_FETCH_FAILED",
      );
    }

    type DbOrder = Parameters<typeof OrderEngine.mapDbOrderToOrder>[0];
    return (data || []).map((row) => this.mapDbOrderToOrder(row as DbOrder));
  }

  /**
   * Mapear dados do banco para Order
   */
  private static mapDbOrderToOrder(dbOrder: any): Order {
    return {
      id: dbOrder.id,
      restaurantId: dbOrder.restaurant_id,
      tableNumber: dbOrder.table_number || dbOrder.sync_metadata?.table_number,
      tableId: dbOrder.table_id,
      status: dbOrder.status as OrderStatus,
      paymentStatus: dbOrder.payment_status as PaymentStatus,
      totalCents: dbOrder.total_amount, // Schema uses total_amount
      subtotalCents: dbOrder.total_amount, // MVP: Subtotal = Total
      taxCents: 0,
      discountCents: 0,
      source: dbOrder.source || dbOrder.sync_metadata?.origin || "tpv",
      operatorId: dbOrder.operator_id,
      cashRegisterId: dbOrder.cash_register_id,
      notes: dbOrder.notes || dbOrder.sync_metadata?.notes,
      createdAt: new Date(dbOrder.created_at),
      updatedAt: new Date(dbOrder.updated_at),
      items: (dbOrder.items || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        nameSnapshot: item.product_name, // Schema uses product_name
        priceSnapshot: item.unit_price, // Schema uses unit_price
        quantity: item.quantity,
        subtotalCents: item.total_price, // Schema uses total_price
        modifiers: item.modifiers || [],
        notes: item.notes,
        categoryName: item.category_name, // Map Category (Mission 55)
        createdAt: new Date(item.created_at || new Date()),
        // KDS Mapping
        status: item.status || "pending",
        startedAt: item.started_at ? new Date(item.started_at) : undefined,
        completedAt: item.completed_at
          ? new Date(item.completed_at)
          : undefined,
        stationId: item.station_id,
      })),
    };
  }
}
