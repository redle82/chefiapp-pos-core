CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider character varying(50) NOT NULL,
  event_type character varying(100),
  event_id character varying(255) NOT NULL,
  raw_payload jsonb DEFAULT '{}'::jsonb,
  signature character varying(512),
  status character varying(20) DEFAULT 'PENDING'::character varying,
  merchant_code character varying(100),
  order_id character varying(255),
  payment_reference character varying(255),
  verified_at timestamp with time zone,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
