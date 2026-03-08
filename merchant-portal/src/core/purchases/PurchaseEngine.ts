/**
 * PurchaseEngine - Engine de Compras
 *
 * Gerencia ciclo completo: sugestões → pedidos → recebimentos.
 *
 * IMPORTANTE (PURE DOCKER / DEV_STABLE):
 * - Módulo `purchases` está marcado como dataSource: "mock" em `moduleCatalog`.
 * - Esta engine NÃO deve chamar Supabase nem RPCs reais.
 * - Implementação atual: store in-memory por sessão, suficiente para narrativa de compras.
 */
import { Logger } from "../logger";

export type PurchaseOrderStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "received"
  | "cancelled";

export interface Supplier {
  id: string;
  restaurantId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  leadTimeDays: number;
  paymentTerms: string;
  minimumOrder?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  restaurantId: string;
  supplierId: string;
  orderNumber: string;
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  ingredientId?: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
  receivedAt?: Date;
  createdAt: Date;
}

export interface PurchaseSuggestion {
  id: string;
  restaurantId: string;
  ingredientId?: string;
  supplierId?: string;
  suggestedQuantity: number;
  reason: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "approved" | "rejected" | "converted" | "expired";
  approvedBy?: string;
  approvedAt?: Date;
  convertedToOrderId?: string;
  currentStock?: number;
  minStock?: number;
  forecastedConsumption?: number;
  createdAt: Date;
  expiresAt?: Date;
}

type SupplierKey = string;
type PurchaseOrderKey = string;
type PurchaseSuggestionKey = string;

const suppliersStore = new Map<SupplierKey, Supplier>();
const purchaseOrdersStore = new Map<PurchaseOrderKey, PurchaseOrder>();
const purchaseOrderItemsStore = new Map<
  PurchaseOrderKey,
  PurchaseOrderItem[]
>();
const purchaseSuggestionsStore = new Map<
  PurchaseSuggestionKey,
  PurchaseSuggestion
>();

function generateId(prefix: string): string {
  // UUID simplificado para ambiente mock; evita depender de globals específicos.
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export class PurchaseEngine {
  /**
   * Criar fornecedor
   */
  async createSupplier(supplier: {
    restaurantId: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    leadTimeDays?: number;
    paymentTerms?: string;
    minimumOrder?: number;
  }): Promise<string> {
    const id = generateId("supplier");
    const now = new Date();

    const entry: Supplier = {
      id,
      restaurantId: supplier.restaurantId,
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      leadTimeDays: supplier.leadTimeDays ?? 1,
      paymentTerms: supplier.paymentTerms ?? "net_30",
      minimumOrder: supplier.minimumOrder,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    suppliersStore.set(id, entry);
    return id;
  }

  /**
   * Listar fornecedores
   */
  async listSuppliers(
    restaurantId: string,
    activeOnly: boolean = true,
  ): Promise<Supplier[]> {
    let items = Array.from(suppliersStore.values()).filter(
      (s) => s.restaurantId === restaurantId,
    );
    if (activeOnly) {
      items = items.filter((s) => s.active);
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }

  /**
   * Criar pedido de compra
   */
  async createPurchaseOrder(order: {
    restaurantId: string;
    supplierId: string;
    orderDate?: Date;
    expectedDeliveryDate?: Date;
    notes?: string;
  }): Promise<string> {
    const id = generateId("purchase_order");
    const now = new Date();

    const entry: PurchaseOrder = {
      id,
      restaurantId: order.restaurantId,
      supplierId: order.supplierId,
      orderNumber: `PO-${now.getFullYear()}${now.getMonth() + 1}-${id.slice(
        -4,
      )}`,
      status: "draft",
      orderDate: order.orderDate ?? now,
      expectedDeliveryDate: order.expectedDeliveryDate,
      actualDeliveryDate: undefined,
      subtotal: 0,
      tax: 0,
      total: 0,
      notes: order.notes,
      createdAt: now,
      updatedAt: now,
    };

    purchaseOrdersStore.set(id, entry);
    purchaseOrderItemsStore.set(id, []);
    return id;
  }

  /**
   * Adicionar item ao pedido
   */
  async addOrderItem(item: {
    orderId: string;
    ingredientId?: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }): Promise<string> {
    const order = purchaseOrdersStore.get(item.orderId);
    if (!order) {
      Logger.warn(
        `[PurchaseEngine] addOrderItem: pedido não encontrado: ${item.orderId}`,
      );
      throw new Error("Purchase order not found");
    }

    const id = generateId("purchase_order_item");
    const now = new Date();

    const entry: PurchaseOrderItem = {
      id,
      purchaseOrderId: item.orderId,
      ingredientId: item.ingredientId,
      productName: item.productName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      receivedQuantity: 0,
      receivedAt: undefined,
      createdAt: now,
    };

    const items = purchaseOrderItemsStore.get(item.orderId) ?? [];
    items.push(entry);
    purchaseOrderItemsStore.set(item.orderId, items);

    const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    purchaseOrdersStore.set(item.orderId, {
      ...order,
      subtotal,
      tax,
      total,
      updatedAt: now,
    });

    return id;
  }

  /**
   * Listar pedidos
   */
  async listPurchaseOrders(
    restaurantId: string,
    filters?: {
      status?: PurchaseOrderStatus[];
      limit?: number;
    },
  ): Promise<PurchaseOrder[]> {
    let orders = Array.from(purchaseOrdersStore.values()).filter(
      (o) => o.restaurantId === restaurantId,
    );

    if (filters?.status && filters.status.length > 0) {
      orders = orders.filter((o) => filters.status!.includes(o.status));
    }

    orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());

    if (filters?.limit) {
      orders = orders.slice(0, filters.limit);
    }

    return orders;
  }

  /**
   * Buscar pedido com itens
   */
  async getPurchaseOrderWithItems(orderId: string): Promise<{
    order: PurchaseOrder;
    items: PurchaseOrderItem[];
  }> {
    const order = purchaseOrdersStore.get(orderId);
    if (!order) {
      throw new Error("Purchase order not found");
    }
    const items = purchaseOrderItemsStore.get(orderId) ?? [];
    return { order, items };
  }

  /**
   * Registrar recebimento
   */
  async receiveOrder(orderId: string, receivedBy?: string): Promise<string> {
    const order = purchaseOrdersStore.get(orderId);
    if (!order) {
      throw new Error("Purchase order not found");
    }

    const now = new Date();
    const items = purchaseOrderItemsStore.get(orderId) ?? [];
    const updatedItems = items.map((it) => ({
      ...it,
      receivedQuantity: it.quantity,
      receivedAt: now,
    }));
    purchaseOrderItemsStore.set(orderId, updatedItems);

    purchaseOrdersStore.set(orderId, {
      ...order,
      status: "received",
      actualDeliveryDate: now,
      updatedAt: now,
      notes:
        order.notes ??
        (receivedBy ? `Recebido por ${receivedBy}` : order.notes),
    });

    return orderId;
  }

  /**
   * Gerar sugestões de compra automáticas
   */
  async generateSuggestions(restaurantId: string): Promise<number> {
    // PURE DOCKER / DEV_STABLE:
    // Gera algumas sugestões estáticas com base em compras passadas (mock).
    const id = generateId("purchase_suggestion");
    const now = new Date();

    const suggestion: PurchaseSuggestion = {
      id,
      restaurantId,
      ingredientId: undefined,
      supplierId: undefined,
      suggestedQuantity: 10,
      reason: "Consumo médio alto nas últimas semanas",
      priority: "medium",
      status: "pending",
      approvedBy: undefined,
      approvedAt: undefined,
      convertedToOrderId: undefined,
      currentStock: 2,
      minStock: 8,
      forecastedConsumption: 12,
      createdAt: now,
      expiresAt: undefined,
    };

    purchaseSuggestionsStore.set(id, suggestion);
    return 1;
  }

  /**
   * Listar sugestões
   */
  async listSuggestions(
    restaurantId: string,
    filters?: {
      status?: string[];
      priority?: string[];
    },
  ): Promise<PurchaseSuggestion[]> {
    let items = Array.from(purchaseSuggestionsStore.values()).filter(
      (s) => s.restaurantId === restaurantId,
    );

    if (filters?.status && filters.status.length > 0) {
      items = items.filter((s) => filters.status!.includes(s.status));
    }

    if (filters?.priority && filters.priority.length > 0) {
      items = items.filter((s) => filters.priority!.includes(s.priority));
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items;
  }
}

export const purchaseEngine = new PurchaseEngine();
