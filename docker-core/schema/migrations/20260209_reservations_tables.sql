-- =====================================================
-- Reservations tables — Docker Core
-- Created: 2026-02-09
-- Purpose: Persist reservations, no-show history, and
--          overbooking config to Postgres (replacing
--          in-memory Map stores in ReservationEngine).
-- =====================================================

-- ─── Reservations ────────────────────────────────────

CREATE TABLE IF NOT EXISTS gm_reservations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES gm_restaurants(id),
    customer_name   TEXT NOT NULL,
    customer_phone  TEXT,
    customer_email  TEXT,
    customer_notes  TEXT,
    reservation_date DATE NOT NULL,
    reservation_time TEXT NOT NULL,       -- "19:30"
    party_size      INT NOT NULL CHECK (party_size > 0),
    table_id        UUID,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','seated','completed','cancelled','no_show')),
    duration_minutes INT NOT NULL DEFAULT 90,
    notes           TEXT,
    confirmed_at    TIMESTAMPTZ,
    seated_at       TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    cancelled_reason TEXT,
    source          TEXT NOT NULL DEFAULT 'internal'
                        CHECK (source IN ('online','internal','phone','walk_in')),
    is_overbooking  BOOLEAN NOT NULL DEFAULT FALSE,
    overbooking_reason TEXT,
    related_order_id UUID,
    assigned_staff_id UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_date
    ON gm_reservations (restaurant_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status
    ON gm_reservations (status);

-- ─── No-Show History ─────────────────────────────────

CREATE TABLE IF NOT EXISTS gm_no_show_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id          UUID NOT NULL REFERENCES gm_reservations(id),
    restaurant_id           UUID NOT NULL REFERENCES gm_restaurants(id),
    reservation_date        DATE NOT NULL,
    reservation_time        TEXT NOT NULL,
    party_size              INT NOT NULL,
    customer_name           TEXT NOT NULL,
    customer_phone          TEXT,
    estimated_revenue_loss  NUMERIC(12,2) NOT NULL DEFAULT 0,
    table_wasted_time_minutes INT NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_no_show_restaurant
    ON gm_no_show_history (restaurant_id, reservation_date);

-- ─── Overbooking Config ─────────────────────────────

CREATE TABLE IF NOT EXISTS gm_overbooking_config (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id                   UUID NOT NULL REFERENCES gm_restaurants(id) UNIQUE,
    enabled                         BOOLEAN NOT NULL DEFAULT FALSE,
    max_overbooking_percentage      INT NOT NULL DEFAULT 10,
    overbooking_window_hours        INT NOT NULL DEFAULT 2,
    allow_overbooking_on_weekends   BOOLEAN NOT NULL DEFAULT TRUE,
    allow_overbooking_on_holidays   BOOLEAN NOT NULL DEFAULT FALSE,
    min_party_size_for_overbooking  INT NOT NULL DEFAULT 4,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS policies ────────────────────────────────────

ALTER TABLE gm_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_no_show_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_overbooking_config ENABLE ROW LEVEL SECURITY;

-- Allow all roles used by PostgREST
GRANT SELECT, INSERT, UPDATE, DELETE ON gm_reservations TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON gm_no_show_history TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON gm_overbooking_config TO anon, authenticated, service_role;

-- Simple permissive policies (tenant-isolation is handled at app layer)
CREATE POLICY reservations_all ON gm_reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY no_show_all ON gm_no_show_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY overbooking_all ON gm_overbooking_config FOR ALL USING (true) WITH CHECK (true);

-- ─── Updated_at trigger ─────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reservations_updated_at
    BEFORE UPDATE ON gm_reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_overbooking_config_updated_at
    BEFORE UPDATE ON gm_overbooking_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
