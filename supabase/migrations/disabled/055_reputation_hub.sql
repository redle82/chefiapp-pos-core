-- Migration: 055_reputation_hub.sql
-- Purpose: ReputationHub module - Complete reputation management (inspired by Local Boss)
-- Date: 2025-01-02
-- Note: Using "ReputationHub" name to avoid conflict with competitor "Local Boss"

-- 1. Multi-Location Management
CREATE TABLE IF NOT EXISTS public.reputation_hub_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    google_place_id TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    current_rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    last_sync_at TIMESTAMPTZ,
    enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, location_name)
);

-- 2. Review Response Templates
CREATE TABLE IF NOT EXISTS public.reputation_hub_response_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    tone TEXT NOT NULL CHECK (tone IN ('formal', 'casual', 'friendly', 'professional')),
    category TEXT CHECK (category IN ('positive', 'negative', 'neutral', 'apology', 'thank_you')),
    template_text TEXT NOT NULL,
    variables JSONB DEFAULT '{}'::jsonb, -- Placeholders: {customer_name}, {issue}, etc.
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Review Responses (Sent)
CREATE TABLE IF NOT EXISTS public.reputation_hub_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL, -- References govern_reviews.id or local_boss_reviews.id
    review_source TEXT NOT NULL CHECK (review_source IN ('govern', 'local_boss')),
    location_id UUID REFERENCES public.reputation_hub_locations(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.reputation_hub_response_templates(id) ON DELETE SET NULL,
    response_text TEXT NOT NULL,
    response_tone TEXT,
    ai_generated BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    external_response_id TEXT, -- ID from Google/other platform
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. QR Codes for Review Requests
CREATE TABLE IF NOT EXISTS public.reputation_hub_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.reputation_hub_locations(id) ON DELETE SET NULL,
    qr_code_url TEXT NOT NULL, -- URL to QR code image
    review_link TEXT NOT NULL, -- Direct link to Google review page
    campaign_name TEXT,
    usage_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Review Request Campaigns
CREATE TABLE IF NOT EXISTS public.reputation_hub_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    qr_code_id UUID REFERENCES public.reputation_hub_qr_codes(id) ON DELETE SET NULL,
    target_rating INTEGER CHECK (target_rating >= 1 AND target_rating <= 5),
    current_rating DECIMAL(3,2),
    reviews_needed INTEGER, -- Calculated: reviews needed to reach target_rating
    reviews_received INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Rating Evolution Tracking
CREATE TABLE IF NOT EXISTS public.reputation_hub_rating_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.reputation_hub_locations(id) ON DELETE CASCADE,
    rating DECIMAL(3,2) NOT NULL,
    total_reviews INTEGER NOT NULL,
    positive_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(location_id, recorded_at::date)
);

-- 7. Unanswered Reviews Tracking
CREATE TABLE IF NOT EXISTS public.reputation_hub_unanswered (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL,
    review_source TEXT NOT NULL CHECK (review_source IN ('govern', 'local_boss')),
    location_id UUID REFERENCES public.reputation_hub_locations(id) ON DELETE SET NULL,
    days_unanswered INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(review_id, review_source)
);

-- 8. Social Sharing (Positive Reviews)
CREATE TABLE IF NOT EXISTS public.reputation_hub_social_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL,
    review_source TEXT NOT NULL CHECK (review_source IN ('govern', 'local_boss')),
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'instagram', 'linkedin')),
    share_url TEXT,
    shared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reputation_hub_locations_restaurant ON public.reputation_hub_locations(restaurant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_reputation_hub_templates_restaurant ON public.reputation_hub_response_templates(restaurant_id, category);
CREATE INDEX IF NOT EXISTS idx_reputation_hub_responses_review ON public.reputation_hub_responses(review_id, review_source);
CREATE INDEX IF NOT EXISTS idx_reputation_hub_responses_status ON public.reputation_hub_responses(status, sent_at);
CREATE INDEX IF NOT EXISTS idx_reputation_hub_qr_restaurant ON public.reputation_hub_qr_codes(restaurant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_reputation_hub_campaigns_restaurant ON public.reputation_hub_campaigns(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_reputation_hub_rating_history_location ON public.reputation_hub_rating_history(location_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_hub_unanswered_priority ON public.reputation_hub_unanswered(priority, days_unanswered DESC);

-- RLS Policies
ALTER TABLE public.reputation_hub_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_hub_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_hub_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_hub_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_hub_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_hub_rating_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_hub_unanswered ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_hub_social_shares ENABLE ROW LEVEL SECURITY;

-- Members can view all ReputationHub data
CREATE POLICY "Members can view locations" ON public.reputation_hub_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reputation_hub_locations.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view templates" ON public.reputation_hub_response_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reputation_hub_response_templates.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view responses" ON public.reputation_hub_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reputation_hub_locations
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = reputation_hub_locations.restaurant_id
            WHERE reputation_hub_locations.id = reputation_hub_responses.location_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view QR codes" ON public.reputation_hub_qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reputation_hub_qr_codes.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view campaigns" ON public.reputation_hub_campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reputation_hub_campaigns.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view rating history" ON public.reputation_hub_rating_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reputation_hub_locations
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = reputation_hub_locations.restaurant_id
            WHERE reputation_hub_locations.id = reputation_hub_rating_history.location_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view unanswered" ON public.reputation_hub_unanswered
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reputation_hub_locations
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = reputation_hub_locations.restaurant_id
            WHERE reputation_hub_locations.id = reputation_hub_unanswered.location_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view social shares" ON public.reputation_hub_social_shares
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reputation_hub_responses
            JOIN public.reputation_hub_locations ON reputation_hub_locations.id = reputation_hub_responses.location_id
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = reputation_hub_locations.restaurant_id
            WHERE reputation_hub_responses.id = reputation_hub_social_shares.id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Owners/Managers can manage all ReputationHub data
CREATE POLICY "Owners can manage locations" ON public.reputation_hub_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reputation_hub_locations.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage templates" ON public.reputation_hub_response_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reputation_hub_response_templates.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage responses" ON public.reputation_hub_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.reputation_hub_locations
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = reputation_hub_locations.restaurant_id
            WHERE reputation_hub_locations.id = reputation_hub_responses.location_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage QR codes" ON public.reputation_hub_qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reputation_hub_qr_codes.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage campaigns" ON public.reputation_hub_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reputation_hub_campaigns.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

-- Comments
COMMENT ON TABLE public.reputation_hub_locations IS 'Multi-location management for reputation tracking';
COMMENT ON TABLE public.reputation_hub_response_templates IS 'Templates for responding to reviews (with AI support)';
COMMENT ON TABLE public.reputation_hub_responses IS 'Sent responses to reviews';
COMMENT ON TABLE public.reputation_hub_qr_codes IS 'QR codes for requesting reviews from customers';
COMMENT ON TABLE public.reputation_hub_campaigns IS 'Review request campaigns with goals';
COMMENT ON TABLE public.reputation_hub_rating_history IS 'Rating evolution tracking over time';
COMMENT ON TABLE public.reputation_hub_unanswered IS 'Tracking of unanswered reviews with priority';
COMMENT ON TABLE public.reputation_hub_social_shares IS 'Social media sharing of positive reviews';

