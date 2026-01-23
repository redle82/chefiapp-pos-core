/**
 * Phase 3 — Inventory Management System
 *
 * Tracks ingredient stock, costs, suppliers, and expiration dates.
 * Integrates with menu (removes out-of-stock items) and suppliers (auto-ordering).
 */

import { UUID, ISOTimestamp, Decimal } from '../shared/types';

/**
 * Inventory Item: An ingredient the restaurant stocks
 */
export interface InventoryItem {
  id: UUID;
  restaurant_id: UUID;
  supplier_sku?: string; // Supplier's item code
  name: string; // e.g., "Fresh Mozzarella"
  unit: InventoryUnit; // kg, liter, pieces, boxes
  quantity_on_hand: Decimal; // Current stock
  quantity_reserved: Decimal; // Reserved for pending orders
  quantity_available: Decimal; // on_hand - reserved
  cost_per_unit: Decimal; // Purchase cost (EUR)
  reorder_level: Decimal; // When stock < this, send alert
  reorder_quantity: Decimal; // How much to order at once
  lead_time_days: number; // How long before delivery?
  supplier_id?: UUID; // Primary supplier
  category: InventoryCategory; // ingredients, packaging, supplies
  expiration_date?: ISOTimestamp; // FIFO tracking
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export enum InventoryUnit {
  KILOGRAM = 'kg',
  GRAM = 'g',
  LITER = 'liter',
  MILLILITER = 'ml',
  PIECES = 'pieces',
  BOXES = 'boxes',
  DOZEN = 'dozen',
}

export enum InventoryCategory {
  INGREDIENTS = 'ingredients',
  PACKAGING = 'packaging',
  SUPPLIES = 'supplies',
}

/**
 * Supplier: External vendor for ingredients
 */
export interface Supplier {
  id: UUID;
  restaurant_id: UUID;
  name: string; // e.g., "Alimenta Fresh"
  category: SupplierCategory; // ingredients, packaging, etc.
  api_endpoint?: string; // REST API for automated ordering
  api_key?: string; // Encrypted
  contact_phone?: string;
  contact_email?: string;
  payment_terms?: string; // e.g., "Net 30"
  is_primary: boolean; // Primary supplier for ingredients?
  average_delivery_days: number;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export enum SupplierCategory {
  INGREDIENTS = 'ingredients',
  PACKAGING = 'packaging',
  EQUIPMENT = 'equipment',
  DELIVERY = 'delivery_partner',
}

/**
 * Stock Movement: Audit trail of inventory changes
 */
export interface StockMovement {
  id: UUID;
  restaurant_id: UUID;
  item_id: UUID;
  movement_type: StockMovementType;
  quantity: Decimal;
  unit_cost?: Decimal; // For purchase movements
  reference_id?: UUID; // Order ID, PO ID, etc.
  notes?: string;
  created_by?: UUID; // User who made the change
  created_at: ISOTimestamp;
}

export enum StockMovementType {
  RECEIVE = 'receive', // Purchase order received
  USE = 'use', // Used in order preparation
  ADJUST = 'adjust', // Manual inventory count correction
  WASTE = 'waste', // Spoilage, damage, theft
  RETURN = 'return', // Return to supplier
}

/**
 * Stock Alert: When to notify restaurant
 */
export interface StockAlert {
  id: UUID;
  restaurant_id: UUID;
  item_id: UUID;
  alert_type: StockAlertType;
  threshold: Decimal;
  is_active: boolean;
  created_at: ISOTimestamp;
}

export enum StockAlertType {
  LOW_STOCK = 'low_stock', // Quantity < reorder_level
  EXPIRING_SOON = 'expiring_soon', // Expiration < 7 days
  OUT_OF_STOCK = 'out_of_stock', // Quantity = 0
}

/**
 * Purchase Order: Request to supplier
 */
export interface PurchaseOrder {
  id: UUID;
  restaurant_id: UUID;
  supplier_id: UUID;
  po_number: string; // Supplier's PO ID
  items: POLineItem[];
  total_cost: Decimal;
  status: POStatus;
  delivery_date?: ISOTimestamp;
  notes?: string;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface POLineItem {
  item_id: UUID;
  quantity: Decimal;
  unit_cost: Decimal;
  line_total: Decimal;
}

export enum POStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACKNOWLEDGED = 'acknowledged',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Inventory Cost Report: What does inventory cost?
 */
export interface InventoryCostReport {
  restaurant_id: UUID;
  report_date: ISOTimestamp;
  total_items: number;
  total_value: Decimal; // Sum of (quantity_on_hand * cost_per_unit)
  by_category: {
    category: InventoryCategory;
    value: Decimal;
    item_count: number;
  }[];
  items_below_reorder_level: {
    item_id: UUID;
    name: string;
    quantity: Decimal;
    reorder_level: Decimal;
  }[];
  expiring_soon: {
    item_id: UUID;
    name: string;
    expiration_date: ISOTimestamp;
    days_until_expiry: number;
  }[];
}

/**
 * Inventory System Service Interface
 */
export interface InventoryService {
  // Item Management
  createItem(input: CreateInventoryItemInput): Promise<InventoryItem>;
  getItem(itemId: UUID): Promise<InventoryItem | null>;
  listItems(restaurantId: UUID, category?: InventoryCategory): Promise<InventoryItem[]>;
  updateItem(itemId: UUID, input: UpdateInventoryItemInput): Promise<InventoryItem>;
  deleteItem(itemId: UUID): Promise<void>;

  // Stock Movements
  receiveStock(input: ReceiveStockInput): Promise<StockMovement>;
  useStock(input: UseStockInput): Promise<StockMovement>;
  adjustStock(input: AdjustStockInput): Promise<StockMovement>;
  getStockMovements(restaurantId: UUID, itemId?: UUID): Promise<StockMovement[]>;

  // Suppliers
  createSupplier(input: CreateSupplierInput): Promise<Supplier>;
  listSuppliers(restaurantId: UUID): Promise<Supplier[]>;
  updateSupplier(supplierId: UUID, input: UpdateSupplierInput): Promise<Supplier>;

  // Stock Alerts
  createAlert(input: CreateStockAlertInput): Promise<StockAlert>;
  listAlerts(restaurantId: UUID): Promise<StockAlert[]>;
  checkAlerts(restaurantId: UUID): Promise<StockAlert[]>; // Which alerts triggered?

  // Purchase Orders
  createPurchaseOrder(input: CreatePOInput): Promise<PurchaseOrder>;
  listPurchaseOrders(restaurantId: UUID, status?: POStatus): Promise<PurchaseOrder[]>;
  updatePOStatus(poId: UUID, status: POStatus): Promise<PurchaseOrder>;

  // Reporting
  getCostReport(restaurantId: UUID, date?: ISOTimestamp): Promise<InventoryCostReport>;
  getLowStockItems(restaurantId: UUID): Promise<InventoryItem[]>;
  getExpiringItems(restaurantId: UUID, days?: number): Promise<InventoryItem[]>;
}

/**
 * Input/Output Contracts
 */

export interface CreateInventoryItemInput {
  name: string;
  unit: InventoryUnit;
  cost_per_unit: Decimal;
  reorder_level: Decimal;
  reorder_quantity: Decimal;
  supplier_id?: UUID;
  category?: InventoryCategory;
  supplier_sku?: string;
  lead_time_days?: number;
}

export interface UpdateInventoryItemInput {
  name?: string;
  cost_per_unit?: Decimal;
  reorder_level?: Decimal;
  reorder_quantity?: Decimal;
  supplier_id?: UUID;
  lead_time_days?: number;
}

export interface ReceiveStockInput {
  item_id: UUID;
  quantity: Decimal;
  unit_cost?: Decimal;
  po_id?: UUID;
  expiration_date?: ISOTimestamp;
  notes?: string;
}

export interface UseStockInput {
  item_id: UUID;
  quantity: Decimal;
  reference_id?: UUID; // Order ID that used this stock
  notes?: string;
}

export interface AdjustStockInput {
  item_id: UUID;
  quantity_delta: Decimal; // Can be negative
  reason: string; // 'inventory_count', 'damage', 'theft', etc.
  notes?: string;
}

export interface CreateSupplierInput {
  name: string;
  category: SupplierCategory;
  contact_phone?: string;
  contact_email?: string;
  api_endpoint?: string;
  api_key?: string;
  payment_terms?: string;
  is_primary?: boolean;
  average_delivery_days?: number;
}

export interface UpdateSupplierInput {
  name?: string;
  contact_phone?: string;
  contact_email?: string;
  api_key?: string;
  payment_terms?: string;
  is_primary?: boolean;
  average_delivery_days?: number;
}

export interface CreateStockAlertInput {
  item_id: UUID;
  alert_type: StockAlertType;
  threshold: Decimal;
}

export interface CreatePOInput {
  supplier_id: UUID;
  items: {
    item_id: UUID;
    quantity: Decimal;
    unit_cost: Decimal;
  }[];
  delivery_date?: ISOTimestamp;
  notes?: string;
}

export interface GetCostReportInput {
  restaurant_id: UUID;
  date?: ISOTimestamp;
}

export interface GetCostReportOutput {
  report: InventoryCostReport;
  insights?: string[]; // e.g., "You have €500 in expiring items"
}

/**
 * Factory Functions
 */

export function createInventoryItem(input: CreateInventoryItemInput): InventoryItem {
  return {
    id: crypto.randomUUID() as UUID,
    restaurant_id: '' as UUID, // Set by service
    name: input.name,
    unit: input.unit,
    quantity_on_hand: new Decimal(0),
    quantity_reserved: new Decimal(0),
    quantity_available: new Decimal(0),
    cost_per_unit: input.cost_per_unit,
    reorder_level: input.reorder_level,
    reorder_quantity: input.reorder_quantity,
    lead_time_days: input.lead_time_days ?? 3,
    supplier_id: input.supplier_id,
    category: input.category ?? InventoryCategory.INGREDIENTS,
    supplier_sku: input.supplier_sku,
    created_at: new Date().toISOString() as ISOTimestamp,
    updated_at: new Date().toISOString() as ISOTimestamp,
  };
}

export function calculateInventoryValue(items: InventoryItem[]): Decimal {
  return items.reduce(
    (total, item) => total.plus(item.quantity_on_hand.times(item.cost_per_unit)),
    new Decimal(0),
  );
}

export function isStockLow(item: InventoryItem): boolean {
  return item.quantity_available.lessThan(item.reorder_level);
}

export function isExpiringSoon(item: InventoryItem, days: number = 7): boolean {
  if (!item.expiration_date) return false;
  const expiration = new Date(item.expiration_date);
  const today = new Date();
  const daysUntilExpiry = Math.floor(
    (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysUntilExpiry > 0 && daysUntilExpiry <= days;
}
