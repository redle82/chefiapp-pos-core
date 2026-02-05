-- Create enum for feedback types
CREATE TYPE feedback_type AS ENUM ('bug', 'feature', 'other');
-- Create enum for feedback severity
CREATE TYPE feedback_severity AS ENUM ('low', 'medium', 'high', 'critical');
-- Create enum for feedback status
CREATE TYPE feedback_status AS ENUM ('open', 'investigating', 'resolved', 'ignored');
-- Create table beta_feedback
CREATE TABLE IF NOT EXISTS public.beta_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.gm_restaurants(id),
    user_id UUID REFERENCES auth.users(id),
    type feedback_type NOT NULL,
    severity feedback_severity DEFAULT 'low',
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    status feedback_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON public.beta_feedback FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Policy: Users can view their own feedback (optional, but good for history)
CREATE POLICY "Users can view their own feedback" ON public.beta_feedback FOR
SELECT TO authenticated USING (auth.uid() = user_id);
-- Policy: Service role has full access
CREATE POLICY "Service role has full access" ON public.beta_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Grant permissions
GRANT ALL ON public.beta_feedback TO service_role;
GRANT SELECT,
    INSERT ON public.beta_feedback TO authenticated;