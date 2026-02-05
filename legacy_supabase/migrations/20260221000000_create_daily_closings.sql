-- Create daily_closings table
CREATE TABLE IF NOT EXISTS public.daily_closings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    sales_gross INTEGER NOT NULL DEFAULT 0, -- Total orders amount
    sales_net INTEGER NOT NULL DEFAULT 0, -- Total after potential refunds (future)
    
    payment_methods JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "cash": 1000, "card": 2000 }
    
    cash_register_balance INTEGER NOT NULL DEFAULT 0, -- Expected cash
    cash_counted INTEGER NOT NULL DEFAULT 0, -- Physical count
    cash_difference INTEGER NOT NULL DEFAULT 0, -- Over/Short
    
    notes TEXT,
    
    created_by UUID REFERENCES auth.users(id), -- User who closed
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for internal users" ON public.daily_closings FOR
SELECT USING (
    auth.uid() IN (
        SELECT user_id
        FROM public.restaurant_members
        WHERE restaurant_id = daily_closings.restaurant_id
    )
);

CREATE POLICY "Enable insert access for internal users" ON public.daily_closings FOR
INSERT WITH CHECK (
    auth.uid() IN (
        SELECT user_id
        FROM public.restaurant_members
        WHERE restaurant_id = daily_closings.restaurant_id
    )
);

-- RPC: Close Day
-- Calculates totals, closes turns, saves snapshot.
CREATE OR REPLACE FUNCTION public.close_day(
    p_restaurant_id UUID,
    p_counted_cash INTEGER,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_last_closing TIMESTAMPTZ;
    v_start_period TIMESTAMPTZ;
    v_now TIMESTAMPTZ := now();
    v_gross INTEGER := 0;
    v_cash_balance INTEGER := 0;
    v_payment_methods JSONB := '{}'::jsonb;
    v_closing_id UUID;
    v_record RECORD;
BEGIN
    -- 1. Determine Start of Period (Last closing time or genesis)
    SELECT closed_at INTO v_last_closing
    FROM public.daily_closings
    WHERE restaurant_id = p_restaurant_id
    ORDER BY closed_at DESC
    LIMIT 1;

    IF v_last_closing IS NULL THEN
        -- Fallback to first order ever or 24h ago? Let's use 2000-01-01 for genesis
        v_start_period := '2000-01-01 00:00:00+00';
    ELSE
        v_start_period := v_last_closing;
    END IF;

    -- 2. Calculate Totals from Orders (Completed/Paid)
    -- We assume 'completed' status means paid in this simplified model.
    -- Or we check payment_status = 'paid'.
    
    FOR v_record IN 
        SELECT 
            payment_method, 
            SUM(total_amount) as method_total
        FROM public.gm_orders
        WHERE restaurant_id = p_restaurant_id
          AND created_at > v_start_period
          AND (status = 'completed' OR status = 'delivered' OR status = 'ready') 
          -- Ideally check payment_status = 'paid' if robust, but let's stick to status for now or assume all non-cancelled are valid sales for Z-Report logic
          AND status != 'canceled'
        GROUP BY payment_method
    LOOP
        -- Accumulate Gross
        v_gross := v_gross + COALESCE(v_record.method_total, 0);
        
        -- Build Payment Methods JSON
        v_payment_methods := jsonb_set(
            v_payment_methods, 
            ARRAY[COALESCE(v_record.payment_method, 'unknown')], 
            to_jsonb(COALESCE(v_record.method_total, 0))
        );
        
        -- Accumulate System Cash
        IF v_record.payment_method = 'cash' THEN
            v_cash_balance := v_cash_balance + COALESCE(v_record.method_total, 0);
        END IF;
    END LOOP;

    -- 3. Close Active Turn Sessions
    UPDATE public.turn_sessions
    SET 
        ended_at = v_now,
        status = 'closed'
    WHERE restaurant_id = p_restaurant_id
      AND status = 'active';

    -- 4. Insert Closing Record
    INSERT INTO public.daily_closings (
        restaurant_id,
        opened_at,
        closed_at,
        sales_gross,
        sales_net,
        payment_methods,
        cash_register_balance,
        cash_counted,
        cash_difference,
        notes,
        created_by
    ) VALUES (
        p_restaurant_id,
        v_start_period,
        v_now,
        v_gross,
        v_gross, -- Net = Gross for now (no tax/discount logic yet)
        v_payment_methods,
        v_cash_balance,
        p_counted_cash,
        p_counted_cash - v_cash_balance,
        p_notes,
        auth.uid()
    ) RETURNING id INTO v_closing_id;

    -- 5. Return Summary
    RETURN jsonb_build_object(
        'id', v_closing_id,
        'gross', v_gross,
        'cash_diff', p_counted_cash - v_cash_balance
    );
END;
$$;
