CREATE TABLE IF NOT EXISTS public.gm_terminals (
  id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  type text NOT NULL,
  name text NOT NULL,
  registered_at timestamp with time zone DEFAULT now(),
  last_heartbeat_at timestamp with time zone,
  last_seen_at timestamp with time zone,
  status text NOT NULL DEFAULT 'active'::text,
  metadata jsonb DEFAULT '{}'::jsonb
);
