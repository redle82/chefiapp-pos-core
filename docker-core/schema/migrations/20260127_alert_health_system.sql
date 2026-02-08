/**
 * Alert + Health System - Sistema de Alertas e Saúde Operacional
 * 
 * Inclui:
 * - Alertas críticos, silenciosos, ignorados
 * - Escalonamento
 * - Histórico de alertas
 * - Health operacional, humano, financeiro
 * - Score único do restaurante
 */

-- Alertas
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Tipo e severidade
  alert_type VARCHAR NOT NULL, -- order_delayed, stock_low, employee_absent, system_error, etc
  severity VARCHAR NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category VARCHAR DEFAULT 'operational' CHECK (category IN ('operational', 'financial', 'human', 'system', 'compliance')),
  
  -- Conteúdo
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  
  -- Estado
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'ignored', 'escalated')),
  acknowledged_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  ignored_at TIMESTAMP,
  ignored_reason TEXT,
  
  -- Escalonamento
  escalation_level INTEGER DEFAULT 0,
  escalated_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  escalated_at TIMESTAMP,
  
  -- Relacionamentos
  related_entity_type VARCHAR, -- order, task, employee, etc
  related_entity_id UUID,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_restaurant ON alerts(restaurant_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_created ON alerts(created_at);
CREATE INDEX idx_alerts_active ON alerts(restaurant_id, status) WHERE status = 'active';

-- Histórico de alertas
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  action VARCHAR NOT NULL CHECK (action IN ('created', 'acknowledged', 'resolved', 'ignored', 'escalated', 'updated')),
  actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  actor_role VARCHAR,
  old_status VARCHAR,
  new_status VARCHAR,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alert_history_alert ON alert_history(alert_id);
CREATE INDEX idx_alert_history_actor ON alert_history(actor_id) WHERE actor_id IS NOT NULL;

-- Health operacional
CREATE TABLE IF NOT EXISTS operational_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Métricas operacionais
  kitchen_delay_minutes DECIMAL(10,2) DEFAULT 0,
  kitchen_overloaded BOOLEAN DEFAULT false,
  dining_room_overloaded BOOLEAN DEFAULT false,
  average_order_time DECIMAL(10,2), -- minutos
  peak_hour_performance DECIMAL(3,2), -- 0-1 score
  
  -- Status
  overall_status VARCHAR DEFAULT 'healthy' CHECK (overall_status IN ('healthy', 'degraded', 'critical')),
  issues_count INTEGER DEFAULT 0,
  
  -- Timestamp
  measured_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, measured_at)
);

CREATE INDEX idx_operational_health_restaurant ON operational_health(restaurant_id);
CREATE INDEX idx_operational_health_measured ON operational_health(measured_at);

-- Health humano
CREATE TABLE IF NOT EXISTS human_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Métricas humanas
  fatigue_level VARCHAR DEFAULT 'normal' CHECK (fatigue_level IN ('normal', 'moderate', 'high', 'critical')),
  overload_score DECIMAL(3,2) DEFAULT 0, -- 0-1
  consecutive_days INTEGER DEFAULT 0,
  hours_this_week DECIMAL(10,2) DEFAULT 0,
  overtime_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR DEFAULT 'healthy' CHECK (status IN ('healthy', 'tired', 'overloaded', 'critical')),
  
  -- Timestamp
  measured_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_human_health_restaurant ON human_health(restaurant_id);
CREATE INDEX idx_human_health_employee ON human_health(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX idx_human_health_measured ON human_health(measured_at);

-- Health financeiro
CREATE TABLE IF NOT EXISTS financial_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Métricas financeiras
  cash_flow_trend VARCHAR CHECK (cash_flow_trend IN ('positive', 'stable', 'negative')),
  margin_percentage DECIMAL(5,2),
  waste_percentage DECIMAL(5,2),
  loss_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Alertas financeiros
  low_margin BOOLEAN DEFAULT false,
  high_waste BOOLEAN DEFAULT false,
  cash_flow_warning BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical')),
  
  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, period_start, period_end)
);

CREATE INDEX idx_financial_health_restaurant ON financial_health(restaurant_id);
CREATE INDEX idx_financial_health_period ON financial_health(period_start, period_end);

-- Score único do restaurante
CREATE TABLE IF NOT EXISTS restaurant_health_score (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Scores individuais
  operational_score DECIMAL(3,2) DEFAULT 1.0, -- 0-1
  human_score DECIMAL(3,2) DEFAULT 1.0, -- 0-1
  financial_score DECIMAL(3,2) DEFAULT 1.0, -- 0-1
  system_score DECIMAL(3,2) DEFAULT 1.0, -- 0-1
  
  -- Score geral
  overall_score DECIMAL(3,2) DEFAULT 1.0, -- 0-1 (média ponderada)
  
  -- Status geral
  overall_status VARCHAR DEFAULT 'healthy' CHECK (overall_status IN ('healthy', 'degraded', 'critical')),
  
  -- Breakdown
  breakdown JSONB DEFAULT '{}'::JSONB, -- Detalhes de cada score
  
  -- Timestamp
  measured_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, measured_at)
);

CREATE INDEX idx_restaurant_health_score_restaurant ON restaurant_health_score(restaurant_id);
CREATE INDEX idx_restaurant_health_score_measured ON restaurant_health_score(measured_at);

-- RPC: Criar alerta
CREATE OR REPLACE FUNCTION create_alert(
  p_restaurant_id UUID,
  p_alert_type VARCHAR,
  p_severity VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_category VARCHAR DEFAULT 'operational',
  p_details JSONB DEFAULT '{}'::JSONB,
  p_related_entity_type VARCHAR DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO alerts (
    restaurant_id, alert_type, severity, title, message, category,
    details, related_entity_type, related_entity_id
  ) VALUES (
    p_restaurant_id, p_alert_type, p_severity, p_title, p_message, p_category,
    p_details, p_related_entity_type, p_related_entity_id
  ) RETURNING id INTO v_alert_id;
  
  -- Registrar no histórico
  INSERT INTO alert_history (alert_id, action, metadata)
  VALUES (v_alert_id, 'created', jsonb_build_object('alert_type', p_alert_type));
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Atualizar status do alerta
CREATE OR REPLACE FUNCTION update_alert_status(
  p_alert_id UUID,
  p_new_status VARCHAR,
  p_actor_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_old_status VARCHAR;
  v_actor_role VARCHAR;
BEGIN
  -- Buscar status atual
  SELECT status INTO v_old_status FROM alerts WHERE id = p_alert_id;
  
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Alert not found: %', p_alert_id;
  END IF;
  
  -- Buscar role do ator
  IF p_actor_id IS NOT NULL THEN
    SELECT role INTO v_actor_role FROM employees WHERE id = p_actor_id;
  END IF;
  
  -- Atualizar alerta
  UPDATE alerts
  SET 
    status = p_new_status,
    acknowledged_by = CASE WHEN p_new_status = 'acknowledged' THEN p_actor_id ELSE acknowledged_by END,
    acknowledged_at = CASE WHEN p_new_status = 'acknowledged' AND acknowledged_at IS NULL THEN NOW() ELSE acknowledged_at END,
    resolved_at = CASE WHEN p_new_status = 'resolved' THEN NOW() ELSE resolved_at END,
    ignored_at = CASE WHEN p_new_status = 'ignored' THEN NOW() ELSE ignored_at END,
    updated_at = NOW()
  WHERE id = p_alert_id;
  
  -- Registrar no histórico
  INSERT INTO alert_history (alert_id, action, actor_id, actor_role, old_status, new_status, notes)
  VALUES (p_alert_id, 
    CASE 
      WHEN p_new_status = 'acknowledged' THEN 'acknowledged'
      WHEN p_new_status = 'resolved' THEN 'resolved'
      WHEN p_new_status = 'ignored' THEN 'ignored'
      WHEN p_new_status = 'escalated' THEN 'escalated'
      ELSE 'updated'
    END,
    p_actor_id, v_actor_role, v_old_status, p_new_status, p_notes);
END;
$$ LANGUAGE plpgsql;

-- RPC: Escalar alerta
CREATE OR REPLACE FUNCTION escalate_alert(
  p_alert_id UUID,
  p_escalated_to UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE alerts
  SET 
    status = 'escalated',
    escalation_level = escalation_level + 1,
    escalated_to = p_escalated_to,
    escalated_at = NOW(),
    updated_at = NOW()
  WHERE id = p_alert_id;
  
  -- Registrar no histórico
  INSERT INTO alert_history (alert_id, action, actor_id, notes)
  VALUES (p_alert_id, 'escalated', p_escalated_to, p_reason);
END;
$$ LANGUAGE plpgsql;

-- RPC: Calcular health score do restaurante
CREATE OR REPLACE FUNCTION calculate_restaurant_health_score(
  p_restaurant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_operational_score DECIMAL := 1.0;
  v_human_score DECIMAL := 1.0;
  v_financial_score DECIMAL := 1.0;
  v_system_score DECIMAL := 1.0;
  v_overall_score DECIMAL;
  v_overall_status VARCHAR;
  
  -- Operacional
  v_kitchen_delay DECIMAL;
  v_kitchen_overloaded BOOLEAN;
  v_dining_overloaded BOOLEAN;
  
  -- Humano
  v_fatigue_count INTEGER;
  v_overload_count INTEGER;
  
  -- Financeiro
  v_financial_status VARCHAR;
BEGIN
  -- Buscar health operacional mais recente
  SELECT kitchen_delay_minutes, kitchen_overloaded, dining_room_overloaded
  INTO v_kitchen_delay, v_kitchen_overloaded, v_dining_overloaded
  FROM operational_health
  WHERE restaurant_id = p_restaurant_id
  ORDER BY measured_at DESC
  LIMIT 1;
  
  -- Calcular score operacional
  IF v_kitchen_delay IS NOT NULL THEN
    IF v_kitchen_delay > 30 THEN
      v_operational_score := 0.5;
    ELSIF v_kitchen_delay > 15 THEN
      v_operational_score := 0.7;
    END IF;
  END IF;
  
  IF v_kitchen_overloaded OR v_dining_overloaded THEN
    v_operational_score := v_operational_score * 0.8;
  END IF;
  
  -- Buscar health humano
  SELECT 
    COUNT(*) FILTER (WHERE fatigue_level IN ('high', 'critical')),
    COUNT(*) FILTER (WHERE overload_score > 0.7)
  INTO v_fatigue_count, v_overload_count
  FROM human_health
  WHERE restaurant_id = p_restaurant_id
    AND measured_at > NOW() - INTERVAL '7 days';
  
  -- Calcular score humano
  IF v_fatigue_count > 0 OR v_overload_count > 0 THEN
    v_human_score := 1.0 - (v_fatigue_count * 0.1 + v_overload_count * 0.1);
    v_human_score := GREATEST(0, v_human_score);
  END IF;
  
  -- Buscar health financeiro mais recente
  SELECT status INTO v_financial_status
  FROM financial_health
  WHERE restaurant_id = p_restaurant_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calcular score financeiro
  IF v_financial_status = 'critical' THEN
    v_financial_score := 0.3;
  ELSIF v_financial_status = 'warning' THEN
    v_financial_score := 0.7;
  END IF;
  
  -- Score do sistema (assumir 1.0 por enquanto, pode ser calculado depois)
  v_system_score := 1.0;
  
  -- Score geral (média ponderada)
  v_overall_score := (
    v_operational_score * 0.4 +
    v_human_score * 0.3 +
    v_financial_score * 0.2 +
    v_system_score * 0.1
  );
  
  -- Status geral
  IF v_overall_score >= 0.8 THEN
    v_overall_status := 'healthy';
  ELSIF v_overall_score >= 0.5 THEN
    v_overall_status := 'degraded';
  ELSE
    v_overall_status := 'critical';
  END IF;
  
  -- Salvar score
  INSERT INTO restaurant_health_score (
    restaurant_id, operational_score, human_score, financial_score, system_score,
    overall_score, overall_status, breakdown
  ) VALUES (
    p_restaurant_id, v_operational_score, v_human_score, v_financial_score, v_system_score,
    v_overall_score, v_overall_status,
    jsonb_build_object(
      'operational', jsonb_build_object('score', v_operational_score, 'kitchen_delay', v_kitchen_delay),
      'human', jsonb_build_object('score', v_human_score, 'fatigue_count', v_fatigue_count, 'overload_count', v_overload_count),
      'financial', jsonb_build_object('score', v_financial_score, 'status', v_financial_status),
      'system', jsonb_build_object('score', v_system_score)
    )
  )
  ON CONFLICT (restaurant_id, measured_at) DO UPDATE SET
    operational_score = v_operational_score,
    human_score = v_human_score,
    financial_score = v_financial_score,
    system_score = v_system_score,
    overall_score = v_overall_score,
    overall_status = v_overall_status,
    breakdown = jsonb_build_object(
      'operational', jsonb_build_object('score', v_operational_score, 'kitchen_delay', v_kitchen_delay),
      'human', jsonb_build_object('score', v_human_score, 'fatigue_count', v_fatigue_count, 'overload_count', v_overload_count),
      'financial', jsonb_build_object('score', v_financial_score, 'status', v_financial_status),
      'system', jsonb_build_object('score', v_system_score)
    );
  
  -- Construir resultado
  v_result := jsonb_build_object(
    'overall_score', v_overall_score,
    'overall_status', v_overall_status,
    'scores', jsonb_build_object(
      'operational', v_operational_score,
      'human', v_human_score,
      'financial', v_financial_score,
      'system', v_system_score
    ),
    'breakdown', jsonb_build_object(
      'operational', jsonb_build_object('kitchen_delay', v_kitchen_delay, 'overloaded', v_kitchen_overloaded OR v_dining_overloaded),
      'human', jsonb_build_object('fatigue_count', v_fatigue_count, 'overload_count', v_overload_count),
      'financial', jsonb_build_object('status', v_financial_status)
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar updated_at
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
