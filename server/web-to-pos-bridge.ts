import type { PoolClient } from 'pg';
import { v4 as uuid } from 'uuid';
import type { CoreEvent, EventMetadata, EventType, StreamId } from '../event-log/types';

function splitStreamId(streamId: StreamId): { streamType: string; streamId: string } {
  const parts = streamId.split(':');
  if (parts.length < 2) throw new Error('Invalid stream_id format');
  return { streamType: parts[0], streamId: parts.slice(1).join(':') };
}

import crypto from 'crypto';

function calculateEventHash(
  prevHash: string,
  type: string,
  streamId: string,
  version: number,
  payload: any,
  meta: any
): string {
  const content =
    prevHash +
    type +
    streamId +
    String(version) +
    JSON.stringify(payload) +
    JSON.stringify(meta);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function getNextStreamInfoTx(client: PoolClient, stream_id: StreamId): Promise<{ version: number; prevHash: string }> {
  const res = await client.query(
    `select stream_version, hash
     from event_store
     where stream_id = $1
     order by stream_version desc
     limit 1`,
    [stream_id]
  );
  if (res.rows.length === 0) {
    return { version: 1, prevHash: '' };
  }
  return { version: Number(res.rows[0].stream_version) + 1, prevHash: res.rows[0].hash };
}

async function appendCoreEventTx(
  client: PoolClient,
  input: Omit<CoreEvent, 'event_id' | 'stream_version' | 'occurred_at' | 'meta'> & {
    occurred_at?: Date;
    idempotency_key?: string;
    meta?: EventMetadata;
  }
): Promise<CoreEvent> {
  const occurredAt = input.occurred_at || new Date();
  const { version, prevHash } = await getNextStreamInfoTx(client, input.stream_id);

  const metaObj: EventMetadata = {
    ...(input.meta || {}),
    causation_id: (input as any).causation_id,
    correlation_id: (input as any).correlation_id,
    actor_ref: (input as any).actor_ref,
    idempotency_key: input.idempotency_key,
    hash_prev: prevHash,
  };

  const hash = calculateEventHash(prevHash, input.type, input.stream_id, version, input.payload, metaObj);
  metaObj.hash = hash;

  const event: CoreEvent = {
    event_id: uuid(),
    stream_id: input.stream_id,
    stream_version: version,
    type: input.type,
    payload: input.payload,
    occurred_at: occurredAt,
    meta: metaObj,
    // Backwards compat (flattened)
    causation_id: metaObj.causation_id,
    correlation_id: metaObj.correlation_id,
    actor_ref: metaObj.actor_ref,
    idempotency_key: metaObj.idempotency_key,
    hash_prev: metaObj.hash_prev,
    hash: metaObj.hash,
  };

  await client.query(
    `insert into event_store
      (event_id, stream_id, stream_version, type, payload, occurred_at, 
       causation_id, correlation_id, actor_ref, idempotency_key, hash_prev, hash)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      event.event_id,
      event.stream_id,
      event.stream_version,
      event.type,
      JSON.stringify(event.payload),
      event.occurred_at,
      event.causation_id || null,
      event.correlation_id || null,
      event.actor_ref || null,
      event.idempotency_key || null,
      event.hash_prev,
      event.hash
    ]
  );

  return event;
}

export type WebOriginMeta = {
  restaurant_id: string;
  origin: 'WEB';
  source: 'WEB_PAGE';
};

export async function emitWebOrderCreatedTx(client: PoolClient, params: {
  restaurant_id: string;
  order_id: string;
  session_id: string;
  table_id?: string | null;
  total_cents: number;
  currency: string;
  items: Array<{ item_id: string; product_id: string; name: string; quantity: number; price_snapshot_cents: number }>;
  payment: { payment_id: string; method: string; amount_cents: number };
}): Promise<{ events: CoreEvent[] }> {
  const events: CoreEvent[] = [];

  // Ensure a session stream exists for WEB orders (single session per restaurant)
  const sessionStream: StreamId = `SESSION:${params.session_id}`;
  // Check if session exists (optimization: check version)
  const { version: nextSessionVer } = await getNextStreamInfoTx(client, sessionStream);

  if (nextSessionVer === 1) {
    events.push(await appendCoreEventTx(client, {
      stream_id: sessionStream,
      type: 'SESSION_STARTED',
      payload: { origin: 'WEB', source: 'WEB_PAGE', restaurant_id: params.restaurant_id },
      actor_ref: 'WEB_MODULE',
      idempotency_key: `web_session_started:${params.session_id}`,
    }));
  }

  const orderStream: StreamId = `ORDER:${params.order_id}`;

  events.push(await appendCoreEventTx(client, {
    stream_id: orderStream,
    type: 'ORDER_CREATED',
    payload: {
      session_id: params.session_id,
      table_id: params.table_id || undefined,
      restaurant_id: params.restaurant_id,
      origin: 'WEB',
      source: 'WEB_PAGE',
      currency: params.currency,
    },
    actor_ref: 'WEB_MODULE',
    idempotency_key: `web_order_created:${params.order_id}`,
  }));

  // Web orders already carry totals at creation; lock immediately.
  events.push(await appendCoreEventTx(client, {
    stream_id: orderStream,
    type: 'ORDER_LOCKED',
    payload: {
      order_id: params.order_id,
      session_id: params.session_id,
      total_cents: params.total_cents,
      restaurant_id: params.restaurant_id,
      origin: 'WEB',
      source: 'WEB_PAGE',
      currency: params.currency,
    },
    actor_ref: 'WEB_MODULE',
    idempotency_key: `web_order_locked:${params.order_id}`,
  }));

  for (const item of params.items) {
    events.push(await appendCoreEventTx(client, {
      stream_id: orderStream,
      type: 'ORDER_ITEM_ADDED',
      payload: {
        order_id: params.order_id,
        item_id: item.item_id,
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price_snapshot_cents: item.price_snapshot_cents,
        restaurant_id: params.restaurant_id,
        origin: 'WEB',
        source: 'WEB_PAGE',
      },
      actor_ref: 'WEB_MODULE',
      idempotency_key: `web_order_item_added:${params.order_id}:${item.item_id}`,
    }));
  }

  // Payment stream
  const paymentStream: StreamId = `PAYMENT:${params.payment.payment_id}`;
  events.push(await appendCoreEventTx(client, {
    stream_id: paymentStream,
    type: 'PAYMENT_CREATED',
    payload: {
      payment_id: params.payment.payment_id,
      order_id: params.order_id,
      session_id: params.session_id,
      method: params.payment.method,
      amount_cents: params.payment.amount_cents,
      restaurant_id: params.restaurant_id,
      origin: 'WEB',
      source: 'WEB_PAGE',
    },
    actor_ref: 'WEB_MODULE',
    idempotency_key: `web_payment_created:${params.payment.payment_id}`,
  }));

  return { events };
}

export async function emitWebPaymentConfirmedTx(client: PoolClient, params: {
  restaurant_id: string;
  session_id: string;
  order_id: string;
  payment_id: string;
}): Promise<{ events: CoreEvent[] }> {
  const events: CoreEvent[] = [];
  const paymentStream: StreamId = `PAYMENT:${params.payment_id}`;
  events.push(await appendCoreEventTx(client, {
    stream_id: paymentStream,
    type: 'PAYMENT_CONFIRMED',
    payload: {
      payment_id: params.payment_id,
      order_id: params.order_id,
      session_id: params.session_id,
      restaurant_id: params.restaurant_id,
      origin: 'WEB',
      source: 'WEB_PAGE',
    },
    actor_ref: 'WEB_MODULE',
    idempotency_key: `web_payment_confirmed:${params.payment_id}`,
  }));

  const orderStream: StreamId = `ORDER:${params.order_id}`;
  events.push(await appendCoreEventTx(client, {
    stream_id: orderStream,
    type: 'ORDER_PAID',
    payload: {
      order_id: params.order_id,
      payment_id: params.payment_id,
      session_id: params.session_id,
      restaurant_id: params.restaurant_id,
      origin: 'WEB',
      source: 'WEB_PAGE',
    },
    actor_ref: 'WEB_MODULE',
    idempotency_key: `web_order_paid:${params.order_id}`,
  }));

  return { events };
}

export async function emitWebPaymentFailedTx(client: PoolClient, params: {
  restaurant_id: string;
  session_id: string;
  order_id: string;
  payment_id: string;
  failure?: { code?: string; message?: string };
}): Promise<{ events: CoreEvent[] }> {
  const events: CoreEvent[] = [];
  const paymentStream: StreamId = `PAYMENT:${params.payment_id}`;
  events.push(await appendCoreEventTx(client, {
    stream_id: paymentStream,
    type: 'PAYMENT_FAILED',
    payload: {
      payment_id: params.payment_id,
      order_id: params.order_id,
      session_id: params.session_id,
      restaurant_id: params.restaurant_id,
      origin: 'WEB',
      source: 'WEB_PAGE',
      failure: params.failure,
    },
    actor_ref: 'WEB_MODULE',
    idempotency_key: `web_payment_failed:${params.payment_id}`,
  }));

  return { events };
}

export function getWebSessionIdForRestaurant(restaurantId: string): string {
  return `WEB_${restaurantId}`;
}
