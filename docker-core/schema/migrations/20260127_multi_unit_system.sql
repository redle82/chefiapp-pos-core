/**
 * Multi-Unit System - Sistema de Gestão Multi-unidade e Franquia
 * 
 * Inclui:
 * - Noção de grupo
 * - Herança de configuração
 * - Comparação entre unidades
 * - Benchmark interno
 */

-- Grupos de restaurantes
CREATE TABLE IF NOT EXISTS restaurant_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados básicos
  name VARCHAR NOT NULL,
  description TEXT,
  group_type VARCHAR DEFAULT 'franchise' CHECK (group_type IN ('franchise', 'chain', 'corporate', 'custom')),
  
  -- Configuração
  parent_group_id UUID REFERENCES restaurant_groups(id) ON DELETE SET NULL, -- Grupos hierárquicos
  master_restaurant_id UUID REFERENCES restaurant(id) ON DELETE SET NULL, -- Restaurante mestre (template)
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_restaurant_groups_parent ON restaurant_groups(parent_group_id) WHERE parent_group_id IS NOT NULL;
CREATE INDEX idx_restaurant_groups_master ON restaurant_groups(master_restaurant_id) WHERE master_restaurant_id IS NOT NULL;

-- Associação restaurante ↔ grupo
CREATE TABLE IF NOT EXISTS restaurant_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL UNIQUE REFERENCES restaurant(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES restaurant_groups(id) ON DELETE CASCADE,
  
  -- Papel na hierarquia
  role VARCHAR DEFAULT 'member' CHECK (role IN ('master', 'template', 'member', 'franchisee')),
  
  -- Herança
  inherits_config BOOLEAN DEFAULT true,
  inherits_menu BOOLEAN DEFAULT false,
  inherits_pricing BOOLEAN DEFAULT false,
  inherits_schedule BOOLEAN DEFAULT false,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, group_id)
);

CREATE INDEX idx_restaurant_group_members_restaurant ON restaurant_group_members(restaurant_id);
CREATE INDEX idx_restaurant_group_members_group ON restaurant_group_members(group_id);
CREATE INDEX idx_restaurant_group_members_role ON restaurant_group_members(role);

-- Herança de configuração
CREATE TABLE IF NOT EXISTS configuration_inheritance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES restaurant_groups(id) ON DELETE CASCADE,
  
  -- Configuração herdada
  config_type VARCHAR NOT NULL, -- menu, pricing, schedule, staff_roles, etc
  config_key VARCHAR NOT NULL,
  config_value JSONB NOT NULL,
  
  -- Aplicação
  applies_to_role VARCHAR DEFAULT 'all' CHECK (applies_to_role IN ('all', 'member', 'franchisee', 'template')),
  override_allowed BOOLEAN DEFAULT true, -- Permite que unidades sobrescrevam
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, config_type, config_key)
);

CREATE INDEX idx_configuration_inheritance_group ON configuration_inheritance(group_id);
CREATE INDEX idx_configuration_inheritance_type ON configuration_inheritance(config_type);

-- Overrides locais (quando unidade sobrescreve configuração do grupo)
CREATE TABLE IF NOT EXISTS configuration_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  inherited_config_id UUID REFERENCES configuration_inheritance(id) ON DELETE CASCADE,
  
  -- Override
  config_type VARCHAR NOT NULL,
  config_key VARCHAR NOT NULL,
  override_value JSONB NOT NULL,
  override_reason TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, inherited_config_id)
);

CREATE INDEX idx_configuration_overrides_restaurant ON configuration_overrides(restaurant_id);
CREATE INDEX idx_configuration_overrides_inherited ON configuration_overrides(inherited_config_id) WHERE inherited_config_id IS NOT NULL;

-- Benchmarks e comparações
CREATE TABLE IF NOT EXISTS unit_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES restaurant_groups(id) ON DELETE CASCADE,
  
  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Métricas agregadas do grupo
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  
  -- Métricas por unidade (JSONB agregado)
  unit_metrics JSONB DEFAULT '{}'::JSONB, -- {restaurant_id: {revenue, orders, etc}}
  
  -- Rankings
  top_performers JSONB DEFAULT '[]'::JSONB, -- [{restaurant_id, metric, rank}]
  bottom_performers JSONB DEFAULT '[]'::JSONB,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, period_start, period_end)
);

CREATE INDEX idx_unit_benchmarks_group ON unit_benchmarks(group_id);
CREATE INDEX idx_unit_benchmarks_period ON unit_benchmarks(period_start, period_end);

-- Comparações entre unidades
CREATE TABLE IF NOT EXISTS unit_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES restaurant_groups(id) ON DELETE CASCADE,
  
  -- Comparação
  comparison_date DATE NOT NULL,
  metric_type VARCHAR NOT NULL, -- revenue, orders, rating, efficiency, etc
  
  -- Resultados
  best_unit_id UUID REFERENCES restaurant(id) ON DELETE SET NULL,
  worst_unit_id UUID REFERENCES restaurant(id) ON DELETE SET NULL,
  average_value DECIMAL(12,2),
  median_value DECIMAL(12,2),
  standard_deviation DECIMAL(12,2),
  
  -- Detalhes
  comparison_data JSONB DEFAULT '{}'::JSONB, -- Dados completos da comparação
  insights JSONB DEFAULT '[]'::JSONB, -- Insights gerados
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_unit_comparisons_group ON unit_comparisons(group_id);
CREATE INDEX idx_unit_comparisons_date ON unit_comparisons(comparison_date);
CREATE INDEX idx_unit_comparisons_metric ON unit_comparisons(metric_type);

-- RPC: Criar grupo
CREATE OR REPLACE FUNCTION create_restaurant_group(
  p_name VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_group_type VARCHAR DEFAULT 'franchise',
  p_parent_group_id UUID DEFAULT NULL,
  p_master_restaurant_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
BEGIN
  INSERT INTO restaurant_groups (
    name, description, group_type, parent_group_id, master_restaurant_id
  ) VALUES (
    p_name, p_description, p_group_type, p_parent_group_id, p_master_restaurant_id
  ) RETURNING id INTO v_group_id;
  
  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Adicionar restaurante ao grupo
CREATE OR REPLACE FUNCTION add_restaurant_to_group(
  p_restaurant_id UUID,
  p_group_id UUID,
  p_role VARCHAR DEFAULT 'member',
  p_inherits_config BOOLEAN DEFAULT true,
  p_inherits_menu BOOLEAN DEFAULT false,
  p_inherits_pricing BOOLEAN DEFAULT false,
  p_inherits_schedule BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_member_id UUID;
BEGIN
  INSERT INTO restaurant_group_members (
    restaurant_id, group_id, role,
    inherits_config, inherits_menu, inherits_pricing, inherits_schedule
  ) VALUES (
    p_restaurant_id, p_group_id, p_role,
    p_inherits_config, p_inherits_menu, p_inherits_pricing, p_inherits_schedule
  )
  ON CONFLICT (restaurant_id, group_id) DO UPDATE SET
    role = p_role,
    inherits_config = p_inherits_config,
    inherits_menu = p_inherits_menu,
    inherits_pricing = p_inherits_pricing,
    inherits_schedule = p_inherits_schedule,
    updated_at = NOW()
  RETURNING id INTO v_member_id;
  
  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Aplicar configuração herdada
CREATE OR REPLACE FUNCTION apply_inherited_configuration(
  p_restaurant_id UUID,
  p_config_type VARCHAR,
  p_config_key VARCHAR
) RETURNS JSONB AS $$
DECLARE
  v_group_id UUID;
  v_inherited_config JSONB;
  v_override JSONB;
  v_result JSONB;
BEGIN
  -- Buscar grupo do restaurante
  SELECT group_id INTO v_group_id
  FROM restaurant_group_members
  WHERE restaurant_id = p_restaurant_id
  LIMIT 1;
  
  IF v_group_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Restaurant not in a group');
  END IF;
  
  -- Buscar configuração herdada
  SELECT config_value INTO v_inherited_config
  FROM configuration_inheritance
  WHERE group_id = v_group_id
    AND config_type = p_config_type
    AND config_key = p_config_key;
  
  -- Buscar override local (se existir)
  SELECT override_value INTO v_override
  FROM configuration_overrides
  WHERE restaurant_id = p_restaurant_id
    AND config_type = p_config_type
    AND config_key = p_config_key;
  
  -- Retornar override se existir, senão configuração herdada
  v_result := COALESCE(v_override, v_inherited_config);
  
  RETURN jsonb_build_object(
    'value', v_result,
    'inherited', v_override IS NULL,
    'overridden', v_override IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- RPC: Calcular benchmark do grupo
CREATE OR REPLACE FUNCTION calculate_group_benchmark(
  p_group_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_unit_metrics JSONB := '{}'::JSONB;
  v_total_revenue DECIMAL := 0;
  v_total_orders INTEGER := 0;
  v_total_customers INTEGER := 0;
  v_restaurant RECORD;
BEGIN
  -- Iterar sobre restaurantes do grupo
  FOR v_restaurant IN
    SELECT r.id, r.name
    FROM restaurant r
    JOIN restaurant_group_members rgm ON rgm.restaurant_id = r.id
    WHERE rgm.group_id = p_group_id
  LOOP
    -- Calcular métricas da unidade (simplificado - pode ser melhorado)
    -- TODO: Integrar com dados reais de pedidos, vendas, etc
    
    -- Adicionar ao JSONB de métricas
    v_unit_metrics := v_unit_metrics || jsonb_build_object(
      v_restaurant.id::TEXT,
      jsonb_build_object(
        'name', v_restaurant.name,
        'revenue', 0, -- Placeholder
        'orders', 0, -- Placeholder
        'customers', 0 -- Placeholder
      )
    );
  END LOOP;
  
  -- Salvar benchmark
  INSERT INTO unit_benchmarks (
    group_id, period_start, period_end,
    total_revenue, total_orders, total_customers,
    unit_metrics
  ) VALUES (
    p_group_id, p_period_start, p_period_end,
    v_total_revenue, v_total_orders, v_total_customers,
    v_unit_metrics
  )
  ON CONFLICT (group_id, period_start, period_end) DO UPDATE SET
    total_revenue = v_total_revenue,
    total_orders = v_total_orders,
    total_customers = v_total_customers,
    unit_metrics = v_unit_metrics;
  
  v_result := jsonb_build_object(
    'group_id', p_group_id,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'total_revenue', v_total_revenue,
    'total_orders', v_total_orders,
    'total_customers', v_total_customers,
    'unit_metrics', v_unit_metrics
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- RPC: Comparar unidades
CREATE OR REPLACE FUNCTION compare_units(
  p_group_id UUID,
  p_metric_type VARCHAR,
  p_comparison_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_best_unit_id UUID;
  v_worst_unit_id UUID;
  v_average_value DECIMAL;
  v_comparison_data JSONB := '{}'::JSONB;
BEGIN
  -- Comparar unidades (simplificado - pode ser melhorado)
  -- TODO: Integrar com dados reais
  
  -- Salvar comparação
  INSERT INTO unit_comparisons (
    group_id, comparison_date, metric_type,
    best_unit_id, worst_unit_id, average_value,
    comparison_data
  ) VALUES (
    p_group_id, p_comparison_date, p_metric_type,
    v_best_unit_id, v_worst_unit_id, v_average_value,
    v_comparison_data
  );
  
  v_result := jsonb_build_object(
    'group_id', p_group_id,
    'metric_type', p_metric_type,
    'comparison_date', p_comparison_date,
    'best_unit_id', v_best_unit_id,
    'worst_unit_id', v_worst_unit_id,
    'average_value', v_average_value,
    'comparison_data', v_comparison_data
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar updated_at
CREATE TRIGGER update_restaurant_groups_updated_at
  BEFORE UPDATE ON restaurant_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_group_members_updated_at
  BEFORE UPDATE ON restaurant_group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuration_inheritance_updated_at
  BEFORE UPDATE ON configuration_inheritance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuration_overrides_updated_at
  BEFORE UPDATE ON configuration_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
