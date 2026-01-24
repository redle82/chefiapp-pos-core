-- Create gm_reservations table
CREATE TABLE IF NOT EXISTS gm_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    party_size INTEGER NOT NULL,
    reservation_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW')),
    notes TEXT,
    table_id UUID REFERENCES gm_tables(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gm_reservations ENABLE ROW LEVEL SECURITY;

-- Create Policies (Standard Multi-Tenant)
CREATE POLICY "Enable read access for users in the same restaurant" ON gm_reservations
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM members 
            WHERE restaurant_id = gm_reservations.restaurant_id
        )
    );

CREATE POLICY "Enable insert access for users in the same restaurant" ON gm_reservations
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM members 
            WHERE restaurant_id = gm_reservations.restaurant_id
        )
    );

CREATE POLICY "Enable update access for users in the same restaurant" ON gm_reservations
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM members 
            WHERE restaurant_id = gm_reservations.restaurant_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM members 
            WHERE restaurant_id = gm_reservations.restaurant_id
        )
    );

-- Add to Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE gm_reservations;
