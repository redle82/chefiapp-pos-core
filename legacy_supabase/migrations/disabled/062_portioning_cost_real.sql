-- Migration: 062_portioning_cost_real.sql
-- Purpose: Porcionamento & Custo Real - Industrialização artesanal com matemática
-- Date: 2025-01-02
-- Note: "Sem porcionamento matemático, você acha que vende... mas na verdade você está doando comida."

-- 1. Base Products (Peças/Produtos-Base)
CREATE TABLE IF NOT EXISTS public.portioning_base_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
    -- Product Identity
    name TEXT NOT NULL, -- Ex: "Picanha Premium", "Salmão Inteiro"
    description TEXT,
    category TEXT, -- 'meat', 'fish', 'vegetable', 'other'
    
    -- Cost & Weight
    cost_total DECIMAL(10,2) NOT NULL, -- Preço da peça (R$)
    weight_total_g INTEGER NOT NULL, -- Peso total em gramas
    
    -- Loss Configuration
    loss_percent DECIMAL(5,2) DEFAULT 0.00, -- Perda estimada (%): gordura, osso, aparo, cocção
    loss_breakdown JSONB DEFAULT '{}'::jsonb, -- {fat: 5, bone: 8, trim: 3, cooking: 2} (%)
    
    -- Portion Target
    portion_weight_g INTEGER NOT NULL, -- Gramatura alvo da porção (g)
    portion_thickness_mm INTEGER, -- Espessura alvo (mm) - para padronização visual
    
    -- Calculated Fields (cached)
    cost_per_gram DECIMAL(10,4), -- custo_total / weight_total_g
    cost_per_portion DECIMAL(10,2), -- cost_per_gram × portion_weight_g
    portions_theoretical INTEGER, -- weight_total_g / portion_weight_g
    portions_real INTEGER, -- portions_theoretical × (1 - loss_percent)
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Portioning Sessions (Sessões de Porcionamento)
CREATE TABLE IF NOT EXISTS public.portioning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    base_product_id UUID NOT NULL REFERENCES public.portioning_base_products(id) ON DELETE CASCADE,
    
    -- Session Info
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    prepared_by UUID REFERENCES auth.users(id), -- Quem porcionou
    
    -- Target
    target_portions INTEGER NOT NULL, -- Quantas porções devem ser feitas
    target_weight_g INTEGER NOT NULL, -- Gramatura alvo por porção
    target_thickness_mm INTEGER, -- Espessura alvo
    
    -- Actual Results
    actual_portions INTEGER, -- Quantas porções foram realmente feitas
    actual_total_weight_g INTEGER, -- Peso total das porções feitas
    actual_avg_weight_g DECIMAL(10,2), -- Peso médio real das porções
    
    -- Variation Analysis
    variation_avg_g DECIMAL(10,2), -- Variação média: actual_avg_weight_g - target_weight_g
    variation_percent DECIMAL(5,2), -- (variation_avg_g / target_weight_g) × 100
    max_variation_g DECIMAL(10,2), -- Maior variação individual
    min_variation_g DECIMAL(10,2), -- Menor variação individual
    
    -- Cost Impact
    cost_impact DECIMAL(10,2), -- Impacto no custo (se positivo = perda, se negativo = ganho)
    cost_impact_per_month DECIMAL(10,2), -- Projeção mensal (se mantiver essa variação)
    cost_impact_per_year DECIMAL(10,2), -- Projeção anual
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Portion Measurements (Medições Individuais)
CREATE TABLE IF NOT EXISTS public.portion_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.portioning_sessions(id) ON DELETE CASCADE,
    
    -- Measurement
    portion_number INTEGER NOT NULL, -- Número da porção (1, 2, 3...)
    actual_weight_g DECIMAL(10,2) NOT NULL, -- Peso real medido
    actual_thickness_mm INTEGER, -- Espessura real (se medida)
    
    -- Variation
    variation_g DECIMAL(10,2), -- actual_weight_g - target_weight_g
    variation_percent DECIMAL(5,2), -- (variation_g / target_weight_g) × 100
    
    -- Status
    is_within_tolerance BOOLEAN, -- Se está dentro da tolerância aceitável
    tolerance_limit_g INTEGER DEFAULT 10, -- Limite de tolerância (g) - configurável
    
    -- Metadata
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    measured_by UUID REFERENCES auth.users(id)
);

-- 4. Portioning Alerts (Alertas de Variação)
CREATE TABLE IF NOT EXISTS public.portioning_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    base_product_id UUID REFERENCES public.portioning_base_products(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.portioning_sessions(id) ON DELETE CASCADE,
    
    -- Alert Type
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'portion_drift_detected', -- Variação média > limite
        'high_variation_session', -- Sessão com variação muito alta
        'cost_threshold_exceeded', -- Custo projetado > limite
        'training_needed' -- Necessita re-treinamento
    )),
    
    -- Alert Data
    variation_avg_g DECIMAL(10,2),
    variation_percent DECIMAL(5,2),
    cost_impact_per_month DECIMAL(10,2),
    cost_impact_per_year DECIMAL(10,2),
    
    -- Thresholds
    threshold_limit_g INTEGER, -- Limite configurado que foi ultrapassado
    monthly_sales INTEGER, -- Vendas mensais usadas no cálculo
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    
    -- Integration
    operational_event_id UUID REFERENCES public.operational_events(id),
    decision_id UUID REFERENCES public.govern_decisions(id),
    task_id UUID, -- Tarefa criada no AppStaff
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Portioning Configuration (Configuração Global)
CREATE TABLE IF NOT EXISTS public.portioning_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
    -- Tolerance Limits
    default_tolerance_g INTEGER DEFAULT 10, -- Tolerância padrão (g)
    strict_tolerance_g INTEGER DEFAULT 5, -- Tolerância estrita (g)
    warning_threshold_g INTEGER DEFAULT 8, -- Limite de aviso (g)
    alert_threshold_g INTEGER DEFAULT 15, -- Limite de alerta (g)
    
    -- Cost Impact Thresholds
    monthly_cost_impact_threshold DECIMAL(10,2) DEFAULT 500.00, -- Limite de impacto mensal (R$)
    annual_cost_impact_threshold DECIMAL(10,2) DEFAULT 5000.00, -- Limite de impacto anual (R$)
    
    -- Auto-Alert Settings
    auto_alert_enabled BOOLEAN DEFAULT true,
    auto_create_task BOOLEAN DEFAULT true,
    auto_notify_manager BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id)
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_portioning_base_products_restaurant ON public.portioning_base_products(restaurant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_portioning_sessions_restaurant ON public.portioning_sessions(restaurant_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_portioning_sessions_product ON public.portioning_sessions(base_product_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_portion_measurements_session ON public.portion_measurements(session_id, portion_number);
CREATE INDEX IF NOT EXISTS idx_portioning_alerts_restaurant ON public.portioning_alerts(restaurant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portioning_alerts_product ON public.portioning_alerts(base_product_id, status);

-- 7. Functions

-- Function: Calculate cost per gram
CREATE OR REPLACE FUNCTION public.calculate_cost_per_gram(cost_total DECIMAL, weight_total_g INTEGER)
RETURNS DECIMAL(10,4) AS $$
BEGIN
    RETURN cost_total / NULLIF(weight_total_g, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Calculate cost per portion
CREATE OR REPLACE FUNCTION public.calculate_cost_per_portion(cost_per_gram DECIMAL, portion_weight_g INTEGER)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN cost_per_gram * portion_weight_g;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Calculate theoretical portions
CREATE OR REPLACE FUNCTION public.calculate_theoretical_portions(weight_total_g INTEGER, portion_weight_g INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(weight_total_g / NULLIF(portion_weight_g, 0));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Calculate real portions (with loss)
CREATE OR REPLACE FUNCTION public.calculate_real_portions(theoretical_portions INTEGER, loss_percent DECIMAL)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(theoretical_portions * (1 - (loss_percent / 100.0)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Calculate cost impact
CREATE OR REPLACE FUNCTION public.calculate_cost_impact(
    variation_g DECIMAL,
    cost_per_gram DECIMAL,
    monthly_sales INTEGER
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    -- Se variation_g > 0 = perda (dando mais do que deveria)
    -- Se variation_g < 0 = ganho (dando menos do que deveria)
    RETURN variation_g * cost_per_gram * monthly_sales;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger: Auto-calculate fields on base_product update
CREATE OR REPLACE FUNCTION public.update_portioning_calculations()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate cost per gram
    NEW.cost_per_gram := calculate_cost_per_gram(NEW.cost_total, NEW.weight_total_g);
    
    -- Calculate cost per portion
    NEW.cost_per_portion := calculate_cost_per_portion(NEW.cost_per_gram, NEW.portion_weight_g);
    
    -- Calculate theoretical portions
    NEW.portions_theoretical := calculate_theoretical_portions(NEW.weight_total_g, NEW.portion_weight_g);
    
    -- Calculate real portions (with loss)
    NEW.portions_real := calculate_real_portions(NEW.portions_theoretical, NEW.loss_percent);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portioning_calculations
BEFORE INSERT OR UPDATE ON public.portioning_base_products
FOR EACH ROW
EXECUTE FUNCTION public.update_portioning_calculations();

-- 8. RLS Policies
ALTER TABLE public.portioning_base_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portioning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portion_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portioning_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portioning_config ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant members can view base products
CREATE POLICY "Restaurant members can view base products"
ON public.portioning_base_products FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can manage base products
CREATE POLICY "Restaurant members can manage base products"
ON public.portioning_base_products FOR ALL
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager', 'chef')
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can view sessions
CREATE POLICY "Restaurant members can view sessions"
ON public.portioning_sessions FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can create/update sessions
CREATE POLICY "Restaurant members can manage sessions"
ON public.portioning_sessions FOR ALL
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can view measurements
CREATE POLICY "Restaurant members can view measurements"
ON public.portion_measurements FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.portioning_sessions ps
        WHERE ps.id = portion_measurements.session_id
        AND (
            ps.restaurant_id IN (
                SELECT restaurant_id FROM public.restaurant_members
                WHERE user_id = auth.uid()
            )
            OR
            ps.restaurant_id IN (
                SELECT id FROM public.gm_restaurants
                WHERE owner_id = auth.uid()
            )
        )
    )
);

-- Policy: Restaurant members can create measurements
CREATE POLICY "Restaurant members can create measurements"
ON public.portion_measurements FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.portioning_sessions ps
        WHERE ps.id = portion_measurements.session_id
        AND (
            ps.restaurant_id IN (
                SELECT restaurant_id FROM public.restaurant_members
                WHERE user_id = auth.uid()
            )
            OR
            ps.restaurant_id IN (
                SELECT id FROM public.gm_restaurants
                WHERE owner_id = auth.uid()
            )
        )
    )
);

-- Policy: Restaurant members can view alerts
CREATE POLICY "Restaurant members can view alerts"
ON public.portioning_alerts FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can manage config
CREATE POLICY "Restaurant members can manage config"
ON public.portioning_config FOR ALL
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- 9. Add new event types to operational_event_type enum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'operational_event_type'
    ) THEN
        ALTER TYPE operational_event_type ADD VALUE IF NOT EXISTS 'portion_drift_detected';
        ALTER TYPE operational_event_type ADD VALUE IF NOT EXISTS 'portion_high_variation';
        ALTER TYPE operational_event_type ADD VALUE IF NOT EXISTS 'portion_cost_threshold_exceeded';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
END $$;

-- 10. Feature Flag (GovernManage)
INSERT INTO public.govern_feature_flags (restaurant_id, feature_key, enabled, metadata)
SELECT 
    id,
    'portioning_cost_real_enabled',
    false, -- Desabilitado por padrão
    '{"description": "Porcionamento & Custo Real - Industrialização artesanal com matemática", "requires_training": true}'::jsonb
FROM public.gm_restaurants
ON CONFLICT (restaurant_id, feature_key) DO NOTHING;

-- 11. Comments (Documentação)
COMMENT ON TABLE public.portioning_base_products IS 'Peças/produtos-base para porcionamento. Ex: Picanha Premium, Salmão Inteiro.';
COMMENT ON TABLE public.portioning_sessions IS 'Sessões de porcionamento: quando uma peça é cortada em porções.';
COMMENT ON TABLE public.portion_measurements IS 'Medições individuais de cada porção feita.';
COMMENT ON TABLE public.portioning_alerts IS 'Alertas de variação detectada no porcionamento.';
COMMENT ON TABLE public.portioning_config IS 'Configuração global de tolerâncias e limites.';
COMMENT ON COLUMN public.portioning_base_products.loss_percent IS 'Perda total estimada: gordura, osso, aparo, cocção (%)';
COMMENT ON COLUMN public.portioning_base_products.cost_per_gram IS 'Custo por grama: cost_total / weight_total_g (calculado automaticamente)';
COMMENT ON COLUMN public.portioning_base_products.cost_per_portion IS 'Custo por porção: cost_per_gram × portion_weight_g (calculado automaticamente)';
COMMENT ON COLUMN public.portioning_sessions.variation_avg_g IS 'Variação média: actual_avg_weight_g - target_weight_g (se positivo = perda, se negativo = ganho)';

