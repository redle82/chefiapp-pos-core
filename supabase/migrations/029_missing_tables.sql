-- Migration: Add missing tables for local development
-- profiles, system_config

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles"
    ON public.profiles FOR SELECT
    TO anon
    USING (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- SYSTEM_CONFIG TABLE (Feature Flags)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.system_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL,
    value JSONB DEFAULT '{}'::jsonb,
    scope TEXT DEFAULT 'global' CHECK (scope IN ('global', 'restaurant', 'user')),
    scope_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(key, scope, scope_id)
);

-- RLS for system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read global config" ON public.system_config;
CREATE POLICY "Anyone can read global config"
    ON public.system_config FOR SELECT
    USING (scope = 'global');

DROP POLICY IF EXISTS "Users can read their own config" ON public.system_config;
CREATE POLICY "Users can read their own config"
    ON public.system_config FOR SELECT
    USING (scope = 'user' AND scope_id = auth.uid());

DROP POLICY IF EXISTS "Restaurant members can read restaurant config" ON public.system_config;
CREATE POLICY "Restaurant members can read restaurant config"
    ON public.system_config FOR SELECT
    USING (
        scope = 'restaurant' AND 
        EXISTS (
            SELECT 1 FROM public.restaurant_members rm
            WHERE rm.restaurant_id = system_config.scope_id
            AND rm.user_id = auth.uid()
        )
    );

-- Insert default feature flags
INSERT INTO public.system_config (key, value, scope, description) VALUES
    ('feature_tpv_enabled', 'true', 'global', 'Enable TPV module'),
    ('feature_kds_enabled', 'true', 'global', 'Enable KDS module'),
    ('feature_menu_enabled', 'true', 'global', 'Enable Menu module'),
    ('feature_orders_enabled', 'true', 'global', 'Enable Orders module'),
    ('feature_staff_enabled', 'true', 'global', 'Enable Staff module'),
    ('feature_training_enabled', 'true', 'global', 'Enable Training module'),
    ('feature_fiscal_enabled', 'false', 'global', 'Enable Fiscal module (beta)'),
    ('maintenance_mode', 'false', 'global', 'System maintenance mode')
ON CONFLICT (key, scope, scope_id) DO NOTHING;

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT SELECT ON public.system_config TO authenticated;
GRANT SELECT ON public.system_config TO anon;

