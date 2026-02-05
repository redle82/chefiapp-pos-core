-- Migration: 052_local_boss_sentiment.sql
-- Purpose: Extend Local Boss with sentiment analysis by topic
-- Date: 2025-01-02

-- Extend local_boss_reviews with sentiment fields
ALTER TABLE public.local_boss_reviews
ADD COLUMN IF NOT EXISTS sentiment_score INTEGER DEFAULT 0, -- -100 to +100
ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::jsonb, -- Array of detected topics
ADD COLUMN IF NOT EXISTS price_sentiment TEXT CHECK (price_sentiment IN ('positive', 'neutral', 'negative', 'not_mentioned'));

-- Create table for daily topic insights
CREATE TABLE IF NOT EXISTS public.local_boss_topic_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    topic TEXT NOT NULL CHECK (topic IN ('service', 'cleanliness', 'price', 'product', 'ambiance', 'wait_time')),
    date DATE NOT NULL,
    sentiment_score INTEGER NOT NULL DEFAULT 0, -- Average sentiment (-100 to +100)
    volume INTEGER NOT NULL DEFAULT 0, -- Number of mentions
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    top_phrases JSONB DEFAULT '[]'::jsonb, -- Top phrases (anonymized)
    why_summary TEXT, -- "Por que" explanation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, topic, date)
);

-- Create table for actionable recommendations
CREATE TABLE IF NOT EXISTS public.local_boss_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    topic TEXT NOT NULL CHECK (topic IN ('service', 'cleanliness', 'price', 'product', 'ambiance', 'wait_time')),
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    action_text TEXT NOT NULL, -- "O que fazer"
    reason_text TEXT NOT NULL, -- "Por quê"
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_local_boss_topic_insights_restaurant_date 
ON public.local_boss_topic_insights(restaurant_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_local_boss_topic_insights_topic 
ON public.local_boss_topic_insights(topic, sentiment_score);

CREATE INDEX IF NOT EXISTS idx_local_boss_actions_restaurant_status 
ON public.local_boss_actions(restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_local_boss_actions_priority 
ON public.local_boss_actions(priority, created_at DESC);

-- RLS Policies
ALTER TABLE public.local_boss_topic_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_boss_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view insights
CREATE POLICY "Members can view topic insights"
ON public.local_boss_topic_insights
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_members
        WHERE restaurant_members.restaurant_id = local_boss_topic_insights.restaurant_id
        AND restaurant_members.user_id = auth.uid()
    )
);

-- Policy: Owners/managers can manage insights
CREATE POLICY "Owners/managers can manage topic insights"
ON public.local_boss_topic_insights
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_members
        WHERE restaurant_members.restaurant_id = local_boss_topic_insights.restaurant_id
        AND restaurant_members.user_id = auth.uid()
        AND restaurant_members.role IN ('owner', 'manager')
    )
);

-- Policy: Members can view actions
CREATE POLICY "Members can view actions"
ON public.local_boss_actions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_members
        WHERE restaurant_members.restaurant_id = local_boss_actions.restaurant_id
        AND restaurant_members.user_id = auth.uid()
    )
);

-- Policy: Owners/managers can manage actions
CREATE POLICY "Owners/managers can manage actions"
ON public.local_boss_actions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_members
        WHERE restaurant_members.restaurant_id = local_boss_actions.restaurant_id
        AND restaurant_members.user_id = auth.uid()
        AND restaurant_members.role IN ('owner', 'manager')
    )
);

