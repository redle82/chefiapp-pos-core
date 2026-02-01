import { CoreEvent } from "../event-log/types";
import { Projection } from "./types";
import { Order } from "../core-engine/repo/types";

// In-Memory definition for the Read Model
// In a real DB scenario, this would be a SQL Table
export interface ReadOrderSummary {
    orderId: string;
    tableId: string;
    status: "OPEN" | "PAID" | "CLOSED";
    totalCents: number;
    itemCount: number;
    updatedAt: Date;
}

/**
 * OrderSummaryProjection
 * 
 * Maintains a high-speed list of active orders for the "Waiter's Dashboard".
 * O(1) read complexity.
 */
export class OrderSummaryProjection implements Projection {
    readonly projectionName = "order_summary_v1";

    // In-memory storage for V1 (Simulating a specific Read Table)
    private storage: Map<string, ReadOrderSummary> = new Map();

    async handle(event: CoreEvent): Promise<void> {
        const payload = event.payload;

        // 1. ORDER_CREATED
        if (event.type === "ORDER_CREATED") {
            const order = payload as Order;
            this.storage.set(order.id, {
                orderId: order.id,
                tableId: order.table_id ?? 'UNKNOWN',
                status: "OPEN",
                totalCents: 0,
                itemCount: 0,
                updatedAt: event.occurred_at
            });
        }

        // 2. ORDER_ITEM_ADDED
        if (event.type === "ORDER_ITEM_ADDED") {
            const current = this.storage.get(payload.order_id);
            if (current) {
                current.totalCents += payload.item.price_snapshot_cents * payload.item.quantity;
                current.itemCount += 1;
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

        // 4. ORDER_CLOSED
        if (event.type === "ORDER_CLOSED") {
            const current = this.storage.get(payload.order_id);
            if (current) {
                current.status = "CLOSED";
                current.updatedAt = event.occurred_at;
                this.storage.set(payload.order_id, current);
            }
        }
    }

    async reset(): Promise<void> {
        this.storage.clear();
    }

    // -- Read Methods (Public Query API) --

    async getSummary(orderId: string): Promise<ReadOrderSummary | undefined> {
        return this.storage.get(orderId);
    }

    async getActiveOrders(): Promise<ReadOrderSummary[]> {
        return Array.from(this.storage.values())
            .filter(o => o.status === "OPEN" || o.status === "PAID")
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
}
