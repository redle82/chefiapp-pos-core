import type { Order, OrderItem } from "../contracts";
import { currencyService } from "../currency/CurrencyService";

interface ExternalOrderPayload {
  id: string;
  source: "ubereats" | "glovo" | "deliveroo";
  customer: {
    name: string;
    phone?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price_cents: number;
    notes?: string;
    external_id?: string;
  }>;
  total_cents: number;
  created_at: string;
}

export class OrderNormalizer {
  /**
   * Converts a generic External Payload into a System Order.
   * @param payload The raw (standardized) payload from the webhook wrapper.
   */
  static normalize(payload: ExternalOrderPayload): Order {
    const items: OrderItem[] = payload.items.map((i, index) => ({
      id: i.external_id || `${payload.id}-${index}`,
      name: i.name,
      quantity: i.quantity,
      price: i.price_cents,
      notes: i.notes || "",
      priceFormatted: OrderNormalizer.formatCurrency(i.price_cents),
    }));

    return {
      id: payload.id, // This might need to be UUID'd or kept as external ID depending on DB strategy
      status: "new",
      items: items,
      total: payload.total_cents,
      createdAt: new Date(payload.created_at),
      updatedAt: new Date(),
      origin: "external",
      service_source: payload.source,
      external_reference: payload.id,
      customerName: payload.customer.name,
      isWebOrder: false,
    };
  }

  private static formatCurrency(cents: number): string {
    return currencyService.formatAmount(cents);
  }
}
