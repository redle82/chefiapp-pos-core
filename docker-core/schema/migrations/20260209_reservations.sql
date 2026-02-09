-- Migration: Create gm_reservations table
-- Gap #9 (Competitive): ReservationBoard — full reservation management

CREATE TABLE IF NOT EXISTS gm_reservations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id),
  table_id    UUID REFERENCES gm_tables(id),
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT,
  customer_email  TEXT,
  party_size      INTEGER NOT NULL DEFAULT 2,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  status      TEXT NOT NULL DEFAULT 'CONFIRMED'
              CHECK (status IN ('CONFIRMED','CANCELLED','NO_SHOW','COMPLETED','SEATED')),
  special_requests TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_date
  ON gm_reservations(restaurant_id, reservation_date);

CREATE INDEX IF NOT EXISTS idx_reservations_status
  ON gm_reservations(restaurant_id, status);

COMMENT ON TABLE gm_reservations IS 'Restaurant table reservations. Gap #9 competitive feature.';
