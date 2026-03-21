CREATE TABLE IF NOT EXISTS public.gm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  order_id uuid,
  order_item_id uuid,
  task_type text NOT NULL,
  station text,
  priority text NOT NULL DEFAULT 'MEDIA'::text,
  message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'OPEN'::text,
  assigned_to uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  acknowledged_at timestamp with time zone,
  resolved_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  auto_generated boolean DEFAULT true,
  source_event text
);
