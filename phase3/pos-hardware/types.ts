/**
 * Phase 3 — POS & Hardware Ecosystem Adapter
 *
 * Integrates ChefIApp with physical POS hardware (KDS, card readers, printers, tablets).
 *
 * Core principle: ChefIApp is the source of truth; hardware displays/executes decisions.
 * Hardware is replaceable; ChefIApp remains constant.
 */

import { UUID, ISOTimestamp, Decimal } from '../shared/types';

/**
 * Hardware Device: Any physical device integrated with ChefIApp
 */
export interface HardwareDevice {
  id: UUID;
  restaurant_id: UUID;
  device_type: DeviceType;
  device_name: string; // e.g., "Kitchen Display System #1"
  ip_address: string;
  port?: number;
  mac_address?: string;
  vendor: HardwareVendor;
  model?: string;
  firmware_version?: string;
  status: DeviceStatus;
  last_heartbeat: ISOTimestamp;
  is_online: boolean;
  configuration: Record<string, any>; // Device-specific config
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export enum DeviceType {
  KITCHEN_DISPLAY = 'kitchen_display', // KDS
  CARD_READER = 'card_reader', // Payment terminal
  PRINTER = 'printer', // Receipt/label printer
  TABLET = 'tablet', // Staff app on hardware
  CUSTOMER_DISPLAY = 'customer_display', // Screen for customers
  SCALE = 'scale', // For weighing ingredients
}

export enum HardwareVendor {
  VERIFONE = 'verifone', // Card readers, payment terminals
  PAX = 'pax', // Card readers, POS terminals
  EPSON = 'epson', // Printers
  STAR_MICRONICS = 'star_micronics', // Printers
  SQUARE = 'square', // All-in-one POS
  TOAST = 'toast', // POS system
  CUSTOM = 'custom', // Generic USB/Ethernet device
}

export enum DeviceStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
  ERROR = 'error',
}

/**
 * Payment Method: How customer pays
 */
export interface PaymentMethod {
  id: UUID;
  restaurant_id: UUID;
  method_type: PaymentMethodType;
  provider: PaymentProvider; // Stripe, Square, Adyen
  provider_account_id: string; // e.g., Stripe merchant ID
  is_default: boolean;
  enabled: boolean;
  card_schemes?: CardScheme[]; // Visa, Mastercard, Amex, etc.
  fees_percent: Decimal; // Processing fee %
  settlement_days: number; // How many days to settle?
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  DIGITAL_WALLET = 'digital_wallet', // Apple Pay, Google Pay
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  SQUARE = 'square',
  ADYEN = 'adyen',
  PAYPAL = 'paypal',
  LOCAL_PROVIDER = 'local_provider',
}

export enum CardScheme {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
}

/**
 * Payment Transaction: Record of payment
 */
export interface PaymentTransaction {
  id: UUID;
  restaurant_id: UUID;
  order_id: UUID;
  payment_method_id: UUID;
  amount: Decimal;
  currency: string; // EUR, GBP, USD
  status: PaymentStatus;
  provider_transaction_id: string; // e.g., Stripe charge ID
  card_last_four?: string;
  card_brand?: string;
  authorization_code?: string;
  processed_at?: ISOTimestamp;
  settled_at?: ISOTimestamp;
  refunded_at?: ISOTimestamp;
  refund_amount?: Decimal;
  error_code?: string; // If failed
  error_message?: string;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

/**
 * POS Configuration: How hardware is set up
 */
export interface POSConfiguration {
  restaurant_id: UUID;
  // Receipt Settings
  receipt_header?: string;
  receipt_footer?: string;
  print_order_number: boolean;
  print_kitchen_notes: boolean;
  print_loyalty_info: boolean;
  // Payment Settings
  tipping_enabled: boolean;
  tipping_suggestions?: Decimal[]; // e.g., [10, 15, 20] percent
  card_present_required: boolean; // Must card be present?
  // Checkout Settings
  signature_required: boolean;
  id_required_for_alcohol: boolean;
  require_customer_email: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

/**
 * Printer Document: What to print
 */
export interface PrinterDocument {
  id: UUID;
  document_type: PrinterDocumentType;
  recipient_device_id: UUID;
  content: PrinterDocumentContent;
  priority: number; // 1–10, higher = print first
  status: PrintStatus;
  created_at: ISOTimestamp;
  printed_at?: ISOTimestamp;
}

export enum PrinterDocumentType {
  RECEIPT = 'receipt',
  DELIVERY_LABEL = 'delivery_label',
  KITCHEN_TICKET = 'kitchen_ticket',
  INVOICE = 'invoice',
  LOYALTY_CARD = 'loyalty_card',
}

export interface PrinterDocumentContent {
  format: 'text' | 'html' | 'pdf';
  width_mm: number; // For thermal printers, usually 80
  content: string; // Raw text or HTML
}

export enum PrintStatus {
  PENDING = 'pending',
  PRINTING = 'printing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * KDS Order Display: Order routed to kitchen
 */
export interface KDSOrderDisplay {
  id: UUID;
  restaurant_id: UUID;
  order_id: UUID;
  device_id?: UUID; // Which KDS? (optional if broadcast to all)
  station: KitchenStation; // prep, grill, fryer, etc.
  items: {
    menu_item_id: UUID;
    name: string;
    quantity: number;
    special_instructions?: string;
    estimated_prep_time_minutes: number;
  }[];
  priority: 'high' | 'normal' | 'low'; // High = print first
  status: KDSStatus;
  started_at?: ISOTimestamp;
  completed_at?: ISOTimestamp;
  created_at: ISOTimestamp;
}

export enum KitchenStation {
  PREP = 'prep',
  GRILL = 'grill',
  FRYER = 'fryer',
  OVEN = 'oven',
  COLD = 'cold', // Salads, cold items
  ASSEMBLY = 'assembly', // Burgers, subs, etc.
}

export enum KDSStatus {
  NEW = 'new',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  CANCELLED = 'cancelled',
}

/**
 * Hardware Fallback: When device is offline
 */
export interface HardwareFallback {
  primary_device_id: UUID;
  fallback_actions: FallbackAction[];
  enabled: boolean;
}

export enum FallbackAction {
  PRINT_RECEIPT = 'print_receipt', // If card reader fails, print receipt
  MANUAL_ORDER_ENTRY = 'manual_order_entry', // If KDS down, use manual tickets
  EMAIL_RECEIPT = 'email_receipt', // If printer fails, email receipt
  SMS_NOTIFICATION = 'sms_notification', // Notify via SMS
}

/**
 * POS & Hardware Service Interface
 */
export interface POSHardwareService {
  // Device Management
  registerDevice(input: RegisterDeviceInput): Promise<HardwareDevice>;
  getDevice(deviceId: UUID): Promise<HardwareDevice | null>;
  listDevices(restaurantId: UUID): Promise<HardwareDevice[]>;
  updateDeviceStatus(deviceId: UUID, status: DeviceStatus): Promise<HardwareDevice>;
  removeDevice(deviceId: UUID): Promise<void>;

  // Health Monitoring
  checkDeviceHealth(deviceId: UUID): Promise<DeviceHealthStatus>;
  monitorAllDevices(restaurantId: UUID): Promise<DeviceHealthStatus[]>;

  // Payments
  processPayment(input: ProcessPaymentInput): Promise<PaymentTransaction>;
  refundPayment(transactionId: UUID): Promise<PaymentTransaction>;
  getPaymentMethods(restaurantId: UUID): Promise<PaymentMethod[]>;
  addPaymentMethod(input: AddPaymentMethodInput): Promise<PaymentMethod>;

  // Printing
  printDocument(input: PrinterDocumentInput): Promise<PrinterDocument>;
  getPrintQueue(restaurantId: UUID): Promise<PrinterDocument[]>;

  // KDS
  sendOrderToKDS(input: SendOrderToKDSInput): Promise<KDSOrderDisplay>;
  updateKDSOrderStatus(displayId: UUID, status: KDSStatus): Promise<KDSOrderDisplay>;
  getKDSOrders(restaurantId: UUID): Promise<KDSOrderDisplay[]>;

  // Configuration
  getPOSConfig(restaurantId: UUID): Promise<POSConfiguration>;
  updatePOSConfig(restaurantId: UUID, config: Partial<POSConfiguration>): Promise<POSConfiguration>;

  // Fallback
  activateFallback(deviceId: UUID): Promise<void>;
}

/**
 * Input/Output Contracts
 */

export interface RegisterDeviceInput {
  device_type: DeviceType;
  device_name: string;
  ip_address: string;
  vendor: HardwareVendor;
  port?: number;
  configuration?: Record<string, any>;
}

export interface DeviceHealthStatus {
  device_id: UUID;
  is_online: boolean;
  response_time_ms: number;
  last_heartbeat: ISOTimestamp;
  status: DeviceStatus;
  error_message?: string;
}

export interface ProcessPaymentInput {
  order_id: UUID;
  amount: Decimal;
  payment_method_id: UUID;
  card_token?: string; // From card reader
  customer_email?: string;
  tip_amount?: Decimal;
}

export interface AddPaymentMethodInput {
  method_type: PaymentMethodType;
  provider: PaymentProvider;
  provider_account_id: string;
  card_schemes?: CardScheme[];
  fees_percent?: Decimal;
  settlement_days?: number;
}

export interface PrinterDocumentInput {
  document_type: PrinterDocumentType;
  recipient_device_id: UUID;
  order_id?: UUID;
  content: PrinterDocumentContent;
  priority?: number;
}

export interface SendOrderToKDSInput {
  order_id: UUID;
  station: KitchenStation;
  items: {
    menu_item_id: UUID;
    name: string;
    quantity: number;
    special_instructions?: string;
    estimated_prep_time_minutes: number;
  }[];
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Factory Functions
 */

export function createPaymentTransaction(
  restaurantId: UUID,
  orderId: UUID,
  paymentMethodId: UUID,
  amount: Decimal,
): PaymentTransaction {
  return {
    id: crypto.randomUUID() as UUID,
    restaurant_id: restaurantId,
    order_id: orderId,
    payment_method_id: paymentMethodId,
    amount,
    currency: 'EUR',
    status: PaymentStatus.PENDING,
    provider_transaction_id: '',
    created_at: new Date().toISOString() as ISOTimestamp,
    updated_at: new Date().toISOString() as ISOTimestamp,
  };
}

export function createKDSOrderDisplay(
  restaurantId: UUID,
  orderId: UUID,
  station: KitchenStation,
  items: any[],
): KDSOrderDisplay {
  return {
    id: crypto.randomUUID() as UUID,
    restaurant_id: restaurantId,
    order_id: orderId,
    station,
    items,
    priority: 'normal',
    status: KDSStatus.NEW,
    created_at: new Date().toISOString() as ISOTimestamp,
  };
}
