import { StandardProjectionManager } from "../../projections/StandardProjectionManager";
import { OrderSummaryProjection } from "../../projections/OrderSummaryProjection";
import { DailySalesProjection } from "../../projections/DailySalesProjection";
import { OrderDetailProjection } from "../../projections/OrderDetailProjection";
import { CoreEvent } from "../../event-log/types";
import { Order, OrderItem } from "../../core-engine/repo/types";

// Mock Event Store (We don't need reading for handleEvent)
const mockEventStore: any = {
    readAll: jest.fn().mockResolvedValue([]),
    append: jest.fn()
};

describe("Gate 7: UI Projections", () => {
    let manager: StandardProjectionManager;
    let orderSummary: OrderSummaryProjection;
    let dailySales: DailySalesProjection;
    let orderDetail: OrderDetailProjection;

    beforeEach(() => {
        mockEventStore.readAll.mockClear();

        manager = new StandardProjectionManager(mockEventStore);
        orderSummary = new OrderSummaryProjection();
        dailySales = new DailySalesProjection();
        orderDetail = new OrderDetailProjection();

        manager.register(orderSummary);
        manager.register(dailySales);
        manager.register(orderDetail);
    });

    test("Should project Order Created -> Added -> Paid cycle (Summary)", async () => {
        const orderId = "ord_proj_1";
        const tableId = "T1";
        const now = new Date();

        // 1. Event: ORDER_CREATED
        const createdEvent: CoreEvent = {
            event_id: "evt_1",
            stream_id: `ORDER:${orderId}`,
            stream_version: 1,
            type: "ORDER_CREATED",
            occurred_at: now,
            payload: {
                id: orderId,
                table_id: tableId,
                state: "OPEN",
                total_cents: 0
            } as Order
        };

        await manager.handleEvent(createdEvent);

        // Assert 1
        let summary = await orderSummary.getSummary(orderId);
        expect(summary).toBeDefined();
        expect(summary?.status).toBe("OPEN");
        expect(summary?.totalCents).toBe(0);

        // 2. Event: ORDER_ITEM_ADDED (Burger $10.00)
        const itemEvent: CoreEvent = {
            event_id: "evt_2",
            stream_id: `ORDER:${orderId}`,
            stream_version: 2,
            type: "ORDER_ITEM_ADDED",
            occurred_at: new Date(now.getTime() + 1000),
            payload: {
                order_id: orderId,
                item: {
                    id: "item_1",
                    order_id: orderId,
                    product_id: "burger",
                    name: "Burger",
                    price_snapshot_cents: 1000,
                    quantity: 2,
                    subtotal_cents: 2000
                } as OrderItem
            }
        };

        await manager.handleEvent(itemEvent);

        // Assert 2
        summary = await orderSummary.getSummary(orderId);
        expect(summary?.totalCents).toBe(2000); // 2 * 1000
        expect(summary?.itemCount).toBe(1);

        // 3. Event: ORDER_PAID
        const paidEvent: CoreEvent = {
            event_id: "evt_3",
            stream_id: `ORDER:${orderId}`,
            stream_version: 3,
            type: "ORDER_PAID",
            occurred_at: new Date(now.getTime() + 2000),
            payload: {
                order_id: orderId,
                total_cents: 2000
            }
        };

        await manager.handleEvent(paidEvent);

        // Assert 3
        summary = await orderSummary.getSummary(orderId);
        expect(summary?.status).toBe("PAID");
    });

    test("Should project Daily Sales from Payment Events", async () => {
        const now = new Date("2025-12-25T12:00:00Z");

        // 1. Payment 1 (Credit)
        const p1: CoreEvent = {
            event_id: "evt_pay_1",
            stream_id: "PAYMENT:p1",
            type: "PAYMENT_CONFIRMED",
            occurred_at: now,
            payload: {
                amount_cents: 5000,
                method: "CREDIT_CARD"
            }
        } as any;

        // 2. Payment 2 (Pix)
        const p2: CoreEvent = {
            event_id: "evt_pay_2",
            stream_id: "PAYMENT:p2",
            type: "PAYMENT_CONFIRMED",
            occurred_at: now, // Same day
            payload: {
                amount_cents: 2000,
                method: "PIX"
            }
        } as any;

        await manager.handleEvent(p1);
        await manager.handleEvent(p2);

        const dateKey = "2025-12-25";
        const report = await dailySales.getReport(dateKey);

        expect(report).toBeDefined();
        expect(report?.totalSalesCents).toBe(7000); // 5000 + 2000
    });

    test("Should project Order Details correctly", async () => {
        const orderId = "ord_detail_1";

        // 1. Create
        await manager.handleEvent({
            type: "ORDER_CREATED",
            payload: { id: orderId, table_id: "T99" },
            occurred_at: new Date()
        } as any);

        // 2. Add Item
        await manager.handleEvent({
            type: "ORDER_ITEM_ADDED",
            payload: {
                order_id: orderId,
                item: {
                    id: "itm_1",
                    product_id: "prod_steak",
                    name: "Steak",
                    quantity: 1,
                    price_snapshot_cents: 5000,
                    subtotal_cents: 5000
                }
            },
            occurred_at: new Date()
        } as any);

        const detail = await orderDetail.getDetail(orderId);
        expect(detail).toBeDefined();
        expect(detail?.items.length).toBe(1);
        expect(detail?.items[0].name).toBe("Steak");
        expect(detail?.totalCents).toBe(5000);
        expect(detail?.tableId).toBe("T99");
    });
});
