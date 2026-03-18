/**
 * ReceiptData — Snapshot completo de um recibo fiscal.
 *
 * Capturado no momento do pagamento (antes de limpar o cart).
 * Usado pelo componente FiscalReceipt (ecrã) e pelo template
 * OrderReceipt (impressora ESC/POS).
 */

export interface ReceiptLineItem {
  name: string;
  quantity: number;
  /** Preço unitário base em cêntimos (sem modificadores). */
  unit_price: number;
  /** Total da linha em cêntimos: (unit_price + modifiers) * quantity. */
  line_total: number;
  modifiers?: { name: string; priceDeltaCents: number }[];
}

export interface ReceiptTaxLine {
  /** Label para exibição: "23%", "13%", "6%". */
  rateLabel: string;
  /** Taxa decimal: 0.23, 0.13, 0.06. */
  rate: number;
  /** Base tributável em cêntimos. */
  baseAmount: number;
  /** Imposto em cêntimos. */
  taxAmount: number;
}

export interface ReceiptData {
  /** UUID completo do pedido. */
  orderId: string;
  /** Primeiros 8 caracteres do UUID para exibição. */
  orderIdShort: string;
  /** ISO 8601 timestamp do pagamento. */
  timestamp: string;
  /** Número da mesa (null se take-away/delivery). */
  table: string | null;
  /** Modo do pedido. */
  orderMode: string | null;

  /** Identidade do restaurante (snapshot). */
  restaurant: {
    name: string;
    legalName?: string;
    address?: string;
    taxId?: string;
    phone?: string;
    logoUrl?: string;
    logoPrintUrl?: string;
    receiptExtraText?: string;
  };

  /** Itens do pedido (snapshot do cart). */
  items: ReceiptLineItem[];

  /** Subtotal em cêntimos (soma dos line_total). */
  subtotalCents: number;
  /** Desconto aplicado em cêntimos. */
  discountCents: number;
  /** Motivo do desconto. */
  discountReason?: string;
  /** Imposto total em cêntimos. */
  taxCents: number;
  /** Desdobramento do imposto por taxa. */
  taxBreakdown: ReceiptTaxLine[];
  /** Gorjeta em cêntimos. */
  tipCents: number;
  /** Total final em cêntimos (subtotal + tax - discount + tip). */
  grandTotalCents: number;

  /** Método de pagamento. */
  paymentMethod: "cash" | "card" | "pix";

  /** Dados fiscais (preenchido async quando fiscal está activo). */
  fiscal?: {
    documentNumber: string;
    hashControl: string;
    atcud: string;
  };
}

// ---------------------------------------------------------------------------
// Mapper: ReceiptData → Order + RestaurantIdentity (for ESC/POS printing)
// ---------------------------------------------------------------------------

import type { Order, OrderItem } from "@/domain/order/types";
import type { RestaurantIdentity as PrintRestaurantIdentity } from "../../../core/printing/types";
import type { ReceiptPrintOptions } from "../../../core/printing/templates/OrderReceipt";

/**
 * Convert a ReceiptData snapshot to the Order + RestaurantIdentity shapes
 * expected by `buildOrderReceipt()` / `PrintService.printOrderReceipt()`.
 */
export function mapReceiptForPrint(receipt: ReceiptData): {
  order: Order;
  restaurant: PrintRestaurantIdentity;
  paymentMethodLabel: string;
  options: ReceiptPrintOptions;
} {
  const items: OrderItem[] = receipt.items.map((item, idx) => ({
    id: `item-${idx}`,
    productId: `product-${idx}`,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    modifiers: item.modifiers?.map((m, mi) => ({
      id: `mod-${mi}`,
      name: m.name,
      price: m.priceDeltaCents,
    })),
  }));

  const order: Order = {
    id: receipt.orderId,
    restaurantId: "",
    status: "PAID",
    type: receipt.orderMode === "delivery" ? "delivery" : receipt.orderMode === "take_away" ? "takeaway" : "dine_in",
    items,
    subtotal: receipt.subtotalCents,
    tax: receipt.taxCents,
    discount: receipt.discountCents,
    total: receipt.grandTotalCents,
    tableNumber: receipt.table ?? undefined,
    createdAt: receipt.timestamp,
    updatedAt: receipt.timestamp,
  };

  const restaurant: PrintRestaurantIdentity = {
    name: receipt.restaurant.name,
    address: receipt.restaurant.address,
    nif: receipt.restaurant.taxId,
    phone: receipt.restaurant.phone,
    logoUrl: receipt.restaurant.logoUrl,
  };

  const paymentMethodLabel =
    receipt.paymentMethod === "cash"
      ? "Dinheiro"
      : receipt.paymentMethod === "card"
        ? "Cartao"
        : "MB Way";

  const options: ReceiptPrintOptions = {
    fiscal: receipt.fiscal,
    receiptExtraText: receipt.restaurant.receiptExtraText,
  };

  return { order, restaurant, paymentMethodLabel, options };
}
