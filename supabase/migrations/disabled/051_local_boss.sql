-- Migration: 051_local_boss.sql
-- Purpose: Create Local Boss module schema for Google Reviews analysis and staff name protection
-- Date: 2025-01-02

-- 1. Review Sources (Google, Yelp, etc.)
CREATE TABLE IF NOT EXISTS public.local_boss_review_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('google', 'yelp', 'tripadvisor', 'facebook')),
    place_id TEXT, -- Google Place ID, Yelp Business ID, etc.
    last_sync_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb, -- Sync frequency, filters, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, source)
);

-- 2. Reviews (Raw + Sanitized)
CREATE TABLE IF NOT EXISTS public.local_boss_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('google', 'yelp', 'tripadvisor', 'facebook')),
    review_id TEXT NOT NULL, -- External review ID (from Google, Yelp, etc.)
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    author TEXT, -- Reviewer name (may be anonymized)
    text_raw TEXT NOT NULL, -- Original text (PRIVATE - contains staff names)
    text_safe TEXT NOT NULL, -- Sanitized text (PUBLIC - staff names redacted)
    language TEXT DEFAULT 'pt', -- Detected language (pt, es, en)
    published_at TIMESTAMPTZ NOT NULL, -- When review was published on source
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, source, review_id)
);

-- 3. Insights (Generated Analysis)
CREATE TABLE IF NOT EXISTS public.local_boss_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100), -- Overall score
    themes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Top themes: [{theme: "tempo", count: 5, sentiment: "negative"}]
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb, -- Actions: [{priority: "high", action: "reduzir tempo de entrega"}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, period_start, period_end)
);

-- 4. Learning Signals (Pattern Detection)
CREATE TABLE IF NOT EXISTS public.local_boss_learning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('staff_name_detected', 'recurring_complaint', 'positive_pattern', 'spam_detected')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Flexible data: {staff_name: "João", review_id: "...", context: "..."}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_sources_restaurant ON public.local_boss_review_sources(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_published ON public.local_boss_reviews(restaurant_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.local_boss_reviews(source, review_id);
CREATE INDEX IF NOT EXISTS idx_insights_restaurant_period ON public.local_boss_insights(restaurant_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_learning_restaurant_type ON public.local_boss_learning(restaurant_id, signal_type, created_at DESC);

-- RLS Policies
ALTER TABLE public.local_boss_review_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_boss_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_boss_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_boss_learning ENABLE ROW LEVEL SECURITY;

-- Members can view reviews/insights for their restaurant
CREATE POLICY "Members can view local boss data" ON public.local_boss_review_sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = local_boss_review_sources.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view reviews" ON public.local_boss_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = local_boss_reviews.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view insights" ON public.local_boss_insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = local_boss_insights.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view learning" ON public.local_boss_learning
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = local_boss_learning.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Owners/Managers can insert/update (for API ingestion)
CREATE POLICY "Owners can manage review sources" ON public.local_boss_review_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = local_boss_review_sources.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage reviews" ON public.local_boss_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = local_boss_reviews.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage insights" ON public.local_boss_insights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = local_boss_insights.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage learning" ON public.local_boss_learning
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = local_boss_learning.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

-- Comments
COMMENT ON TABLE public.local_boss_review_sources IS 'Configuration for review sources (Google, Yelp, etc.)';
COMMENT ON TABLE public.local_boss_reviews IS 'Reviews with raw (private) and safe (public) text versions';
COMMENT ON TABLE public.local_boss_insights IS 'Generated insights and recommendations from reviews';
COMMENT ON TABLE public.local_boss_learning IS 'Learning signals for pattern detection and improvement';

