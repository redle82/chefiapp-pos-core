-- Migration: 053_govern_manage.sql
-- Purpose: GovernManage module - Review intelligence and reputation management
-- Date: 2025-01-02

-- 1. Review Sources (Google Business Profile, TripAdvisor, etc.)
CREATE TABLE IF NOT EXISTS public.govern_review_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('google', 'tripadvisor', 'thefork', 'instagram', 'yelp', 'facebook')),
    external_id TEXT NOT NULL, -- Google Place ID, TripAdvisor ID, etc.
    name TEXT, -- Display name
    last_sync_at TIMESTAMPTZ,
    sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')),
    settings JSONB DEFAULT '{}'::jsonb, -- API keys, filters, etc.
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, source, external_id)
);

-- 2. Reviews (Raw + Processed)
CREATE TABLE IF NOT EXISTS public.govern_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('google', 'tripadvisor', 'thefork', 'instagram', 'yelp', 'facebook')),
    external_review_id TEXT NOT NULL, -- Review ID from source
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    author_name TEXT, -- Reviewer name (may be anonymized)
    author_hash TEXT, -- Hash for deduplication (without exposing identity)
    text_raw TEXT NOT NULL, -- Original text (PRIVATE - contains staff names)
    text_safe TEXT NOT NULL, -- Sanitized text (PUBLIC - staff names redacted)
    language TEXT DEFAULT 'pt',
    published_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ, -- When NLP pipeline ran
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, source, external_review_id)
);

-- 3. Review Entities Redacted (Staff names, etc.)
CREATE TABLE IF NOT EXISTS public.govern_review_entities_redacted (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.govern_reviews(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('staff_name', 'phone', 'email', 'address')),
    original_text TEXT NOT NULL, -- What was detected
    original_hash TEXT NOT NULL, -- Hash for deduplication
    masked_label TEXT NOT NULL DEFAULT '[EQUIPE]', -- What it was replaced with
    confidence DECIMAL(3,2) DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(review_id, entity_type, original_hash)
);

-- 4. Review Topics (Topic classification per review)
CREATE TABLE IF NOT EXISTS public.govern_review_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.govern_reviews(id) ON DELETE CASCADE,
    topic TEXT NOT NULL CHECK (topic IN ('price', 'cleanliness', 'service', 'food', 'ambience', 'wait_time', 'value', 'music', 'parking', 'accessibility')),
    sentiment DECIMAL(3,2) NOT NULL CHECK (sentiment >= -1 AND sentiment <= 1), -- -1 (negative) to +1 (positive)
    confidence DECIMAL(3,2) DEFAULT 0.7 CHECK (confidence >= 0 AND confidence <= 1),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(review_id, topic)
);

-- 5. Review Insights (Aggregated insights per restaurant/time window)
CREATE TABLE IF NOT EXISTS public.govern_review_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    window_type TEXT NOT NULL CHECK (window_type IN ('daily', 'weekly', 'monthly')),
    overall_rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    summary_md TEXT, -- Human-readable summary
    churn_reasons_json JSONB DEFAULT '[]'::jsonb, -- Top reasons for churn: [{topic: "wait_time", count: 5, sentiment: -0.8}]
    topic_sentiment_json JSONB DEFAULT '{}'::jsonb, -- Sentiment by topic: {price: -0.3, service: 0.7}
    alerts_json JSONB DEFAULT '[]'::jsonb, -- Alerts: [{type: "rating_drop", severity: "high", message: "..."}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, window_start, window_end, window_type)
);

-- 6. Review Actions (Actionable recommendations)
CREATE TABLE IF NOT EXISTS public.govern_review_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    insight_id UUID REFERENCES public.govern_review_insights(id) ON DELETE SET NULL,
    action_title TEXT NOT NULL,
    action_description TEXT,
    role_target TEXT NOT NULL CHECK (role_target IN ('owner', 'manager', 'waiter', 'kitchen', 'all')),
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
    topic TEXT, -- Related topic
    reason_text TEXT, -- Why this action is needed
    how_to_fix TEXT, -- How to fix it
    appstaff_task_id UUID, -- Link to AppStaff task if created
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_govern_review_sources_restaurant ON public.govern_review_sources(restaurant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_govern_reviews_restaurant_published ON public.govern_reviews(restaurant_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_govern_reviews_source ON public.govern_reviews(source, external_review_id);
CREATE INDEX IF NOT EXISTS idx_govern_reviews_processed ON public.govern_reviews(processed_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_govern_review_entities_review ON public.govern_review_entities_redacted(review_id);
CREATE INDEX IF NOT EXISTS idx_govern_review_topics_review ON public.govern_review_topics(review_id);
CREATE INDEX IF NOT EXISTS idx_govern_review_topics_topic ON public.govern_review_topics(topic, sentiment);
CREATE INDEX IF NOT EXISTS idx_govern_review_insights_restaurant_window ON public.govern_review_insights(restaurant_id, window_end DESC);
CREATE INDEX IF NOT EXISTS idx_govern_review_actions_restaurant_status ON public.govern_review_actions(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_govern_review_actions_priority ON public.govern_review_actions(priority, created_at DESC);

-- RLS Policies
ALTER TABLE public.govern_review_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.govern_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.govern_review_entities_redacted ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.govern_review_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.govern_review_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.govern_review_actions ENABLE ROW LEVEL SECURITY;

-- Members can view all GovernManage data for their restaurant
CREATE POLICY "Members can view review sources" ON public.govern_review_sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_review_sources.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view reviews" ON public.govern_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_reviews.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view entities" ON public.govern_review_entities_redacted
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.govern_reviews
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = govern_reviews.restaurant_id
            WHERE govern_reviews.id = govern_review_entities_redacted.review_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view topics" ON public.govern_review_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.govern_reviews
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = govern_reviews.restaurant_id
            WHERE govern_reviews.id = govern_review_topics.review_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view insights" ON public.govern_review_insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_review_insights.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view actions" ON public.govern_review_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_review_actions.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Owners/Managers can manage all GovernManage data
CREATE POLICY "Owners can manage review sources" ON public.govern_review_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_review_sources.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage reviews" ON public.govern_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_reviews.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage entities" ON public.govern_review_entities_redacted
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.govern_reviews
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = govern_reviews.restaurant_id
            WHERE govern_reviews.id = govern_review_entities_redacted.review_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage topics" ON public.govern_review_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.govern_reviews
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = govern_reviews.restaurant_id
            WHERE govern_reviews.id = govern_review_topics.review_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage insights" ON public.govern_review_insights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_review_insights.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage actions" ON public.govern_review_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_review_actions.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

-- Comments
COMMENT ON TABLE public.govern_review_sources IS 'Configuration for review sources (Google, TripAdvisor, etc.)';
COMMENT ON TABLE public.govern_reviews IS 'Reviews with raw (private) and safe (public) text versions';
COMMENT ON TABLE public.govern_review_entities_redacted IS 'Detected entities (staff names, etc.) that were redacted';
COMMENT ON TABLE public.govern_review_topics IS 'Topic classification per review';
COMMENT ON TABLE public.govern_review_insights IS 'Aggregated insights per restaurant/time window';
COMMENT ON TABLE public.govern_review_actions IS 'Actionable recommendations from review analysis';

