-- Passo G (Production Hardening Minimal)
-- Add unified idempotency for web order creation.

alter table web_orders
  add column if not exists idempotency_key text;

-- Unique per restaurant when present.
create unique index if not exists ux_web_orders_restaurant_idempotency
  on web_orders(restaurant_id, idempotency_key)
  where idempotency_key is not null;
