import { CoreEvent } from "../event-log/types";
import { Projection } from "./types";
import { Order, OrderItem } from "../core-engine/repo/types";

// Full Read Model for "Order Detail View"
export interface ReadOrderDetail {
    orderId: string;
    tableId: string;
    status: "OPEN" | "PAID" | "CLOSED";
    totalCents: number;
    items: ReadOrderItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ReadOrderItem {
    itemId: string;
    productId: string;
    name: string;
    quantity: number;
    priceCents: number;
    subtotalCents: number;
}

/**
 * OrderDetailProjection
 * 
 * Maintains the full deep structure of an order.
 * Optimized for "Viewing the Bill" or "Kitchen Display".
 */
export class OrderDetailProjection implements Projection {
    readonly projectionName = "order_detail_v1";

    // In-memory storage for V1
    private storage: Map<string, ReadOrderDetail> = new Map();

    async handle(event: CoreEvent): Promise<void> {
        const payload = event.payload;

        // 1. ORDER_CREATED
        if (event.type === "ORDER_CREATED") {
            const order = payload as Order;
            this.storage.set(order.id, {
                orderId: order.id,
                tableId: order.table_id ?? "",
                status: "OPEN",
                totalCents: 0,
                items: [],
                createdAt: event.occurred_at,
                updatedAt: event.occurred_at
            });
        }

        // 2. ORDER_ITEM_ADDED
        if (event.type === "ORDER_ITEM_ADDED") {
            const current = this.storage.get(payload.order_id);
            if (current) {
                const item = payload.item as OrderItem;

                // Add item to list
                current.items.push({
                    itemId: item.id,
                    productId: item.product_id,
                    name: item.name,
                    quantity: item.quantity,
                    priceCents: item.price_snapshot_cents,
                    subtotalCents: item.subtotal_cents
                });

                // Update totals
                current.totalCents += item.subtotal_cents;
                current.updatedAt = event.occurred_at;

                this.storage.set(payload.order_id, current);
            }
        }

        // 3. ORDER_PAID
        if (event.type === "ORDER_PAID") {
            const current = this.storage.get(payload.order_id);
            if (current) {
                current.status = "PAID";
                current.updatedAt = event.occurred_at;
                this.storage.set(payload.order_id, current);
            }
        }
    }

    async reset(): Promise<void> {
        this.storage.clear();
    }

    async getDetail(orderId: string): Promise<ReadOrderDetail | undefined> {
        return this.storage.get(orderId);
    }
}
