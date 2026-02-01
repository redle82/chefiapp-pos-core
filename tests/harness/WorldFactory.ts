/**
 * WorldFactory - Generates simulated restaurant world data
 *
 * Creates deterministic test data based on seed for:
 * - Restaurants (multi-tenant)
 * - Tables (per restaurant)
 * - Orders (with items)
 * - Payments (via various channels)
 * - Events (for event sourcing)
 */

import {
  Order,
  OrderItem,
  Payment,
  Session,
} from "../../core-engine/repo/types";
import { CoreEvent, EventType, StreamId } from "../../event-log/types";
import { PaymentChannel, SeededRandom, WorldConfig } from "./WorldConfig";

// ============================================================================
// GENERATED ENTITY TYPES
// ============================================================================

export interface Restaurant {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  tables: Table[];
}

export interface Table {
  id: string;
  restaurantId: string;
  number: number;
}

export interface GeneratedOrder {
  order: Order;
  items: OrderItem[];
  payments: Payment[];
  channel: PaymentChannel;
  events: CoreEvent[];
}

export interface GeneratedSession {
  session: Session;
  orders: GeneratedOrder[];
  events: CoreEvent[];
}

export interface GeneratedWorld {
  restaurants: Restaurant[];
  sessions: GeneratedSession[];
  allEvents: CoreEvent[];
  stats: WorldStats;
}

export interface WorldStats {
  totalRestaurants: number;
  totalTables: number;
  totalSessions: number;
  totalOrders: number;
  totalItems: number;
  totalPayments: number;
  totalEvents: number;
  totalValueCents: number;
  byChannel: Record<PaymentChannel, number>;
  byCurrency: Record<string, number>;
}

// ============================================================================
// PRODUCT CATALOG (Mock)
// ============================================================================

const PRODUCTS = [
  { id: "prod_001", name: "Espresso", priceEur: 250 },
  { id: "prod_002", name: "Cappuccino", priceEur: 350 },
  { id: "prod_003", name: "Croissant", priceEur: 280 },
  { id: "prod_004", name: "Sandwich", priceEur: 650 },
  { id: "prod_005", name: "Salad", priceEur: 890 },
  { id: "prod_006", name: "Pasta", priceEur: 1250 },
  { id: "prod_007", name: "Pizza", priceEur: 1450 },
  { id: "prod_008", name: "Steak", priceEur: 2490 },
  { id: "prod_009", name: "Wine Glass", priceEur: 650 },
  { id: "prod_010", name: "Beer", priceEur: 450 },
  { id: "prod_011", name: "Dessert", priceEur: 580 },
  { id: "prod_012", name: "Water", priceEur: 150 },
];

const CURRENCY_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.1,
  BRL: 5.5,
};

// ============================================================================
// WORLD FACTORY
// ============================================================================

export class WorldFactory {
  private rng: SeededRandom;
  private config: WorldConfig;
  private eventSequence: number = 0;
  private globalTimestamp: Date;

  constructor(config: WorldConfig) {
    this.config = config;
    this.rng = new SeededRandom(config.seed);
    this.globalTimestamp = new Date("2024-01-01T10:00:00Z");
  }

  generate(): GeneratedWorld {
    const restaurants = this.generateRestaurants();
    const sessions: GeneratedSession[] = [];
    const allEvents: CoreEvent[] = [];

    const stats: WorldStats = {
      totalRestaurants: restaurants.length,
      totalTables: 0,
      totalSessions: 0,
      totalOrders: 0,
      totalItems: 0,
      totalPayments: 0,
      totalEvents: 0,
      totalValueCents: 0,
      byChannel: { TABLE_QR: 0, WEB_LINK: 0, WAITER_CASH: 0, TOTEM: 0 },
      byCurrency: {},
    };

    for (const restaurant of restaurants) {
      stats.totalTables += restaurant.tables.length;

      // Generate sessions for this restaurant
      const sessionCount = Math.ceil(this.config.ordersPerRestaurant / 10); // ~10 orders per session
      for (let s = 0; s < sessionCount; s++) {
        const session = this.generateSession(restaurant);
        sessions.push(session);
        allEvents.push(...session.events);

        stats.totalSessions++;
        stats.totalOrders += session.orders.length;

        for (const order of session.orders) {
          stats.totalItems += order.items.length;
          stats.totalPayments += order.payments.length;
          stats.byChannel[order.channel]++;

          const orderTotal = order.items.reduce(
            (sum, item) => sum + item.subtotal_cents,
            0,
          );
          stats.totalValueCents += orderTotal;

          const curr = restaurant.currency;
          stats.byCurrency[curr] = (stats.byCurrency[curr] || 0) + orderTotal;
        }
      }
    }

    stats.totalEvents = allEvents.length;

    // Sort all events by occurred_at for proper replay order
    allEvents.sort((a, b) => a.occurred_at.getTime() - b.occurred_at.getTime());

    return { restaurants, sessions, allEvents, stats };
  }

  private generateRestaurants(): Restaurant[] {
    const restaurants: Restaurant[] = [];

    for (let i = 0; i < this.config.restaurants; i++) {
      const timezone = this.rng.pick(this.config.timezones);
      const currency = this.rng.pick(this.config.currencies);
      const tables: Table[] = [];

      const restaurantId = this.rng.uuid();

      for (let t = 0; t < this.config.tablesPerRestaurant; t++) {
        tables.push({
          id: this.rng.uuid(),
          restaurantId,
          number: t + 1,
        });
      }

      restaurants.push({
        id: restaurantId,
        name: `Restaurant_${i + 1}`,
        timezone,
        currency,
        tables,
      });
    }

    return restaurants;
  }

  private generateSession(restaurant: Restaurant): GeneratedSession {
    const sessionId = this.rng.uuid();
    const events: CoreEvent[] = [];
    const orders: GeneratedOrder[] = [];

    // SESSION_STARTED
    const sessionStartedEvent = this.createEvent(
      `SESSION:${sessionId}`,
      "SESSION_STARTED",
      { id: sessionId, restaurant_id: restaurant.id },
    );
    events.push(sessionStartedEvent);

    // Generate orders for this session
    const orderCount = this.rng.nextInt(5, 15);
    for (let o = 0; o < orderCount; o++) {
      if (
        orders.length >=
        this.config.ordersPerRestaurant /
          Math.ceil(this.config.ordersPerRestaurant / 10)
      ) {
        break; // Don't exceed average
      }

      const table = this.rng.pick(restaurant.tables);
      const order = this.generateOrder(sessionId, table, restaurant);
      orders.push(order);
      events.push(...order.events);
    }

    // SESSION_CLOSED
    const sessionClosedEvent = this.createEvent(
      `SESSION:${sessionId}`,
      "SESSION_CLOSED",
      { id: sessionId },
    );
    events.push(sessionClosedEvent);

    const session: Session = {
      id: sessionId,
      state: "CLOSED",
      opened_at: sessionStartedEvent.occurred_at,
      closed_at: sessionClosedEvent.occurred_at,
      version: 2,
    };

    return { session, orders, events };
  }

  private generateOrder(
    sessionId: string,
    table: Table,
    restaurant: Restaurant,
  ): GeneratedOrder {
    const orderId = this.rng.uuid();
    const events: CoreEvent[] = [];
    const items: OrderItem[] = [];
    const channel = this.rng.pick(this.config.channels);

    // ORDER_CREATED
    const orderCreatedEvent = this.createEvent(
      `ORDER:${orderId}`,
      "ORDER_CREATED",
      {
        id: orderId,
        session_id: sessionId,
        table_id: table.id,
      },
    );
    events.push(orderCreatedEvent);

    // Generate items
    const itemCount = this.rng.nextInt(1, this.config.itemsPerOrderMax);
    let totalCents = 0;
    const rate = CURRENCY_RATES[restaurant.currency] || 1;

    for (let i = 0; i < itemCount; i++) {
      const product = this.rng.pick(PRODUCTS);
      const quantity = this.rng.nextInt(1, 3);
      const priceInCurrency = Math.round(product.priceEur * rate);
      const subtotal = priceInCurrency * quantity;

      const item: OrderItem = {
        id: this.rng.uuid(),
        order_id: orderId,
        product_id: product.id,
        name: product.name,
        quantity,
        price_snapshot_cents: priceInCurrency,
        subtotal_cents: subtotal,
      };

      items.push(item);
      totalCents += subtotal;

      // ORDER_ITEM_ADDED
      const itemAddedEvent = this.createEvent(
        `ORDER:${orderId}`,
        "ORDER_ITEM_ADDED",
        {
          order_id: orderId,
          item: {
            id: item.id,
            product_id: item.product_id,
            name: item.name,
            quantity: item.quantity,
            price_snapshot_cents: item.price_snapshot_cents,
          },
        },
      );
      events.push(itemAddedEvent);
    }

    // ORDER_LOCKED (finalized)
    const orderLockedEvent = this.createEvent(
      `ORDER:${orderId}`,
      "ORDER_LOCKED",
      { order_id: orderId, total_cents: totalCents },
    );
    events.push(orderLockedEvent);

    // Generate payment
    const paymentId = this.rng.uuid();
    const gatewayRef = `gateway_${this.rng.uuid().slice(0, 8)}`;

    // PAYMENT_CREATED
    const paymentCreatedEvent = this.createEvent(
      `PAYMENT:${paymentId}`,
      "PAYMENT_CREATED",
      {
        id: paymentId,
        order_id: orderId,
        session_id: sessionId,
        amount_cents: totalCents,
        method: channel === "WAITER_CASH" ? "CASH" : "CARD",
        gateway_reference: gatewayRef,
      },
    );
    events.push(paymentCreatedEvent);

    // PAYMENT_CONFIRMED (gateway verified)
    const paymentConfirmedEvent = this.createEvent(
      `PAYMENT:${paymentId}`,
      "PAYMENT_CONFIRMED",
      {
        payment_id: paymentId,
        order_id: orderId,
        amount_cents: totalCents,
        gateway_reference: gatewayRef,
        channel,
      },
    );
    events.push(paymentConfirmedEvent);

    // ORDER_PAID
    const orderPaidEvent = this.createEvent(`ORDER:${orderId}`, "ORDER_PAID", {
      order_id: orderId,
      payment_id: paymentId,
      total_cents: totalCents,
    });
    events.push(orderPaidEvent);

    // ORDER_CLOSED
    const orderClosedEvent = this.createEvent(
      `ORDER:${orderId}`,
      "ORDER_CLOSED",
      { order_id: orderId },
    );
    events.push(orderClosedEvent);

    const payment: Payment = {
      id: paymentId,
      order_id: orderId,
      session_id: sessionId,
      method: channel === "WAITER_CASH" ? "CASH" : "CARD",
      amount_cents: totalCents,
      state: "CONFIRMED",
      version: 2,
    };

    const order: Order = {
      id: orderId,
      table_id: table.id,
      session_id: sessionId,
      state: "CLOSED",
      total_cents: totalCents,
      version: items.length + 4, // CREATE + items + LOCK + PAY + CLOSE
    };

    return { order, items, payments: [payment], channel, events };
  }

  private createEvent(
    streamId: StreamId,
    type: EventType,
    payload: Record<string, any>,
  ): CoreEvent {
    this.eventSequence++;
    this.advanceTime();

    const eventId = this.rng.uuid();
    const streamParts = streamId.split(":");
    const entityStreamVersions = this.getOrCreateStreamVersion(streamId);

    const event: CoreEvent = {
      event_id: eventId,
      stream_id: streamId,
      stream_version: entityStreamVersions,
      type,
      payload,
      occurred_at: new Date(this.globalTimestamp),
      meta: {
        correlation_id: this.rng.uuid(),
        hash_prev: this.rng.uuid(), // Simplified for testing
        hash: this.computeHash(eventId, payload),
        server_timestamp: new Date(this.globalTimestamp).toISOString(),
      },
    };

    return event;
  }

  private streamVersions: Map<string, number> = new Map();

  private getOrCreateStreamVersion(streamId: string): number {
    const current = this.streamVersions.get(streamId) ?? -1; // Start at -1 so first version is 0
    const next = current + 1;
    this.streamVersions.set(streamId, next);
    return next;
  }

  private advanceTime(): void {
    // Advance time by 1-60 seconds randomly
    const delta = this.rng.nextInt(1000, 60000);
    this.globalTimestamp = new Date(this.globalTimestamp.getTime() + delta);
  }

  private computeHash(eventId: string, payload: any): string {
    // Simplified hash for testing (in production, use SHA-256)
    const data = eventId + JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, "0");
  }

  /**
   * Generate only partial (incomplete) orders for testing edge cases
   */
  generateIncompleteOrders(count: number): GeneratedOrder[] {
    const orders: GeneratedOrder[] = [];
    const sessionId = this.rng.uuid();

    for (let i = 0; i < count; i++) {
      const orderId = this.rng.uuid();
      const events: CoreEvent[] = [];
      const items: OrderItem[] = [];

      // Only create order, no payment
      const orderCreatedEvent = this.createEvent(
        `ORDER:${orderId}`,
        "ORDER_CREATED",
        {
          id: orderId,
          session_id: sessionId,
          table_id: this.rng.uuid(),
        },
      );
      events.push(orderCreatedEvent);

      // Add one item
      const product = this.rng.pick(PRODUCTS);
      const item: OrderItem = {
        id: this.rng.uuid(),
        order_id: orderId,
        product_id: product.id,
        name: product.name,
        quantity: 1,
        price_snapshot_cents: product.priceEur,
        subtotal_cents: product.priceEur,
      };
      items.push(item);

      events.push(
        this.createEvent(`ORDER:${orderId}`, "ORDER_ITEM_ADDED", {
          order_id: orderId,
          item,
        }),
      );

      orders.push({
        order: {
          id: orderId,
          session_id: sessionId,
          state: "OPEN",
          version: 2,
        },
        items,
        payments: [],
        channel: "TABLE_QR",
        events,
      });
    }

    return orders;
  }
}
