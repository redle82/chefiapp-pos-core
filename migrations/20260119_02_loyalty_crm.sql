-- Create gm_customers table
CREATE TABLE IF NOT EXISTS public.gm_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    points_balance INTEGER DEFAULT 0,
    total_spend_cents BIGINT DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visit_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, phone)
);

-- Create gm_loyalty_logs table
CREATE TABLE IF NOT EXISTS public.gm_loyalty_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    customer_id UUID NOT NULL REFERENCES public.gm_customers(id),
    order_id UUID, -- Optional linkage to an order
    points_amount INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_loyalty_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gm_customers
CREATE POLICY "Staff can view customers" ON public.gm_customers
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can insert customers" ON public.gm_customers
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM public.members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can update customers" ON public.gm_customers
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.members WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for gm_loyalty_logs
CREATE POLICY "Staff can view loyalty logs" ON public.gm_loyalty_logs
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can insert loyalty logs" ON public.gm_loyalty_logs
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM public.members WHERE user_id = auth.uid()
        )
    );

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.gm_customers;
