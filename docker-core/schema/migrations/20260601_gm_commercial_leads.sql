-- gm_commercial_leads — Persistência de leads do funil comercial.
-- POST /api/public/lead-capture insere nesta tabela.
-- Ref: docs/Commercial/CRM_LEAD_PAYLOAD_SPEC.md

CREATE TABLE IF NOT EXISTS public.gm_commercial_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  segment TEXT DEFAULT 'small',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  source TEXT NOT NULL,
  placement TEXT,
  device TEXT,
  landing_version TEXT,
  conversion_path TEXT,
  user_agent TEXT,
  referrer TEXT,
  session_event_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_commercial_leads_created_at
  ON public.gm_commercial_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gm_commercial_leads_country
  ON public.gm_commercial_leads (country);
CREATE INDEX IF NOT EXISTS idx_gm_commercial_leads_email
  ON public.gm_commercial_leads (email);

-- RLS: permitir inserção anónima via service role; leitura restrita
ALTER TABLE public.gm_commercial_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role insert" ON public.gm_commercial_leads
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON public.gm_commercial_leads
  FOR SELECT
  TO authenticated
  USING (true);
