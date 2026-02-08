/**
 * People + Time System - Sistema Completo de Pessoas e Tempo
 * 
 * Inclui:
 * - Perfil operacional de pessoas
 * - Histórico comportamental
 * - Banco de horas
 * - Turno real vs planejado
 * - Correlação tempo ↔ desempenho
 */

-- Perfil operacional de funcionários
CREATE TABLE IF NOT EXISTS employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Perfil operacional
  speed_rating DECIMAL(3,2) DEFAULT 1.0 CHECK (speed_rating >= 0.5 AND speed_rating <= 2.0), -- 0.5 = lento, 1.0 = normal, 2.0 = rápido
  multitask_capability DECIMAL(3,2) DEFAULT 1.0 CHECK (multitask_capability >= 0.5 AND multitask_capability <= 2.0),
  autonomy_level VARCHAR DEFAULT 'medium' CHECK (autonomy_level IN ('low', 'medium', 'high')),
  reliability_score DECIMAL(3,2) DEFAULT 1.0 CHECK (reliability_score >= 0 AND reliability_score <= 1.0),
  
  -- Histórico comportamental
  total_tasks_completed INTEGER DEFAULT 0,
  total_tasks_on_time INTEGER DEFAULT 0,
  total_tasks_delayed INTEGER DEFAULT 0,
  average_task_completion_time DECIMAL(10,2) DEFAULT 0, -- minutos
  average_delay_minutes DECIMAL(10,2) DEFAULT 0,
  
  -- Curva de aprendizado
  learning_curve_data JSONB DEFAULT '[]'::JSONB, -- [{date, performance_score}, ...]
  current_performance_level VARCHAR DEFAULT 'beginner' CHECK (current_performance_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- Impacto no sistema
  impact_score DECIMAL(5,2) DEFAULT 0, -- Score geral de impacto
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, restaurant_id)
);

CREATE INDEX idx_employee_profiles_employee ON employee_profiles(employee_id);
CREATE INDEX idx_employee_profiles_restaurant ON employee_profiles(restaurant_id);
CREATE INDEX idx_employee_profiles_reliability ON employee_profiles(reliability_score);

-- Banco de horas
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shift_logs(id) ON DELETE SET NULL,
  
  -- Entrada/Saída
  clock_in TIMESTAMP NOT NULL,
  clock_out TIMESTAMP,
  break_start TIMESTAMP,
  break_end TIMESTAMP,
  
  -- Cálculos
  total_minutes INTEGER, -- Calculado automaticamente
  break_minutes INTEGER DEFAULT 0,
  worked_minutes INTEGER, -- total_minutes - break_minutes
  overtime_minutes INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  is_late BOOLEAN DEFAULT false,
  is_absent BOOLEAN DEFAULT false,
  late_minutes INTEGER DEFAULT 0,
  
  -- Metadados
  notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX idx_time_entries_restaurant ON time_entries(restaurant_id);
CREATE INDEX idx_time_entries_shift ON time_entries(shift_id) WHERE shift_id IS NOT NULL;
CREATE INDEX idx_time_entries_clock_in ON time_entries(clock_in);
CREATE INDEX idx_time_entries_status ON time_entries(status);

-- Histórico comportamental
CREATE TABLE IF NOT EXISTS behavioral_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Evento comportamental
  event_type VARCHAR NOT NULL CHECK (event_type IN ('task_completed', 'task_delayed', 'task_cancelled', 'late_arrival', 'absence', 'early_departure', 'performance_improvement', 'performance_decline')),
  event_date TIMESTAMP NOT NULL,
  
  -- Dados do evento
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  delay_minutes INTEGER,
  impact_level VARCHAR CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Contexto
  context JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_behavioral_history_employee ON behavioral_history(employee_id);
CREATE INDEX idx_behavioral_history_restaurant ON behavioral_history(restaurant_id);
CREATE INDEX idx_behavioral_history_event_type ON behavioral_history(event_type);
CREATE INDEX idx_behavioral_history_event_date ON behavioral_history(event_date);

-- Comparação turno real vs planejado
CREATE TABLE IF NOT EXISTS shift_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shift_logs(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Planejado
  planned_start TIMESTAMP NOT NULL,
  planned_end TIMESTAMP NOT NULL,
  planned_role VARCHAR,
  planned_tasks TEXT[],
  
  -- Real
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  actual_role VARCHAR,
  actual_tasks_completed INTEGER DEFAULT 0,
  
  -- Diferenças
  start_delay_minutes INTEGER DEFAULT 0,
  end_delay_minutes INTEGER DEFAULT 0,
  tasks_difference INTEGER DEFAULT 0, -- actual - planned
  
  -- Análise
  efficiency_score DECIMAL(3,2) DEFAULT 1.0, -- 1.0 = conforme planejado
  deviation_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shift_comparisons_restaurant ON shift_comparisons(restaurant_id);
CREATE INDEX idx_shift_comparisons_employee ON shift_comparisons(employee_id);
CREATE INDEX idx_shift_comparisons_shift ON shift_comparisons(shift_id) WHERE shift_id IS NOT NULL;

-- Correlação tempo ↔ desempenho
CREATE TABLE IF NOT EXISTS performance_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Período analisado
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Métricas de tempo
  total_hours_worked DECIMAL(10,2),
  average_hours_per_day DECIMAL(5,2),
  overtime_hours DECIMAL(10,2),
  late_arrivals INTEGER DEFAULT 0,
  absences INTEGER DEFAULT 0,
  
  -- Métricas de desempenho
  tasks_completed INTEGER DEFAULT 0,
  tasks_on_time INTEGER DEFAULT 0,
  average_task_time DECIMAL(10,2),
  quality_score DECIMAL(3,2), -- 0-1
  
  -- Correlação
  correlation_score DECIMAL(3,2), -- -1 a 1 (negativo = mais horas = pior desempenho)
  insights JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, period_start, period_end)
);

CREATE INDEX idx_performance_correlations_employee ON performance_correlations(employee_id);
CREATE INDEX idx_performance_correlations_restaurant ON performance_correlations(restaurant_id);
CREATE INDEX idx_performance_correlations_period ON performance_correlations(period_start, period_end);

-- RPC: Criar ou atualizar perfil de funcionário
CREATE OR REPLACE FUNCTION upsert_employee_profile(
  p_employee_id UUID,
  p_restaurant_id UUID,
  p_speed_rating DECIMAL DEFAULT NULL,
  p_multitask_capability DECIMAL DEFAULT NULL,
  p_autonomy_level VARCHAR DEFAULT NULL,
  p_reliability_score DECIMAL DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  INSERT INTO employee_profiles (
    employee_id, restaurant_id, speed_rating, multitask_capability,
    autonomy_level, reliability_score
  ) VALUES (
    p_employee_id, p_restaurant_id,
    COALESCE(p_speed_rating, 1.0),
    COALESCE(p_multitask_capability, 1.0),
    COALESCE(p_autonomy_level, 'medium'),
    COALESCE(p_reliability_score, 1.0)
  )
  ON CONFLICT (employee_id, restaurant_id)
  DO UPDATE SET
    speed_rating = COALESCE(p_speed_rating, employee_profiles.speed_rating),
    multitask_capability = COALESCE(p_multitask_capability, employee_profiles.multitask_capability),
    autonomy_level = COALESCE(p_autonomy_level, employee_profiles.autonomy_level),
    reliability_score = COALESCE(p_reliability_score, employee_profiles.reliability_score),
    last_updated = NOW()
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Registrar entrada de ponto
CREATE OR REPLACE FUNCTION clock_in(
  p_employee_id UUID,
  p_restaurant_id UUID,
  p_shift_id UUID DEFAULT NULL,
  p_clock_in TIMESTAMP DEFAULT NOW()
) RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
  v_planned_start TIMESTAMP;
  v_late_minutes INTEGER := 0;
  v_is_late BOOLEAN := false;
BEGIN
  -- Buscar turno planejado se shift_id fornecido
  IF p_shift_id IS NOT NULL THEN
    SELECT start_time INTO v_planned_start
    FROM shift_logs
    WHERE id = p_shift_id;
    
    IF v_planned_start IS NOT NULL AND p_clock_in > v_planned_start THEN
      v_late_minutes := EXTRACT(EPOCH FROM (p_clock_in - v_planned_start)) / 60;
      v_is_late := true;
    END IF;
  END IF;
  
  -- Criar entrada
  INSERT INTO time_entries (
    employee_id, restaurant_id, shift_id, clock_in, is_late, late_minutes, status
  ) VALUES (
    p_employee_id, p_restaurant_id, p_shift_id, p_clock_in, v_is_late, v_late_minutes, 'active'
  ) RETURNING id INTO v_entry_id;
  
  -- Registrar evento comportamental se atrasado
  IF v_is_late THEN
    INSERT INTO behavioral_history (
      employee_id, restaurant_id, event_type, event_date, delay_minutes, impact_level
    ) VALUES (
      p_employee_id, p_restaurant_id, 'late_arrival', p_clock_in, v_late_minutes,
      CASE 
        WHEN v_late_minutes > 60 THEN 'critical'
        WHEN v_late_minutes > 30 THEN 'high'
        WHEN v_late_minutes > 15 THEN 'medium'
        ELSE 'low'
      END
    );
  END IF;
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Registrar saída de ponto
CREATE OR REPLACE FUNCTION clock_out(
  p_entry_id UUID,
  p_clock_out TIMESTAMP DEFAULT NOW(),
  p_break_minutes INTEGER DEFAULT 0
) RETURNS VOID AS $$
DECLARE
  v_clock_in TIMESTAMP;
  v_total_minutes INTEGER;
  v_worked_minutes INTEGER;
  v_overtime_minutes INTEGER := 0;
BEGIN
  -- Buscar entrada
  SELECT clock_in INTO v_clock_in
  FROM time_entries
  WHERE id = p_entry_id;
  
  IF v_clock_in IS NULL THEN
    RAISE EXCEPTION 'Time entry not found: %', p_entry_id;
  END IF;
  
  -- Calcular minutos
  v_total_minutes := EXTRACT(EPOCH FROM (p_clock_out - v_clock_in)) / 60;
  v_worked_minutes := v_total_minutes - COALESCE(p_break_minutes, 0);
  
  -- Calcular horas extras (acima de 8 horas = 480 minutos)
  IF v_worked_minutes > 480 THEN
    v_overtime_minutes := v_worked_minutes - 480;
  END IF;
  
  -- Atualizar entrada
  UPDATE time_entries
  SET
    clock_out = p_clock_out,
    break_minutes = COALESCE(p_break_minutes, 0),
    total_minutes = v_total_minutes,
    worked_minutes = v_worked_minutes,
    overtime_minutes = v_overtime_minutes,
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_entry_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Atualizar perfil baseado em tarefa completada
CREATE OR REPLACE FUNCTION update_profile_from_task(
  p_employee_id UUID,
  p_restaurant_id UUID,
  p_task_id UUID,
  p_completed_at TIMESTAMP,
  p_was_on_time BOOLEAN,
  p_delay_minutes INTEGER DEFAULT 0
) RETURNS VOID AS $$
DECLARE
  v_profile_id UUID;
  v_current_total INTEGER;
  v_current_on_time INTEGER;
  v_current_delayed INTEGER;
  v_current_avg_time DECIMAL;
  v_current_avg_delay DECIMAL;
BEGIN
  -- Buscar ou criar perfil
  SELECT id INTO v_profile_id
  FROM employee_profiles
  WHERE employee_id = p_employee_id AND restaurant_id = p_restaurant_id;
  
  IF v_profile_id IS NULL THEN
    SELECT upsert_employee_profile(p_employee_id, p_restaurant_id) INTO v_profile_id;
  END IF;
  
  -- Buscar valores atuais
  SELECT 
    total_tasks_completed,
    total_tasks_on_time,
    total_tasks_delayed,
    average_task_completion_time,
    average_delay_minutes
  INTO
    v_current_total,
    v_current_on_time,
    v_current_delayed,
    v_current_avg_time,
    v_current_avg_delay
  FROM employee_profiles
  WHERE id = v_profile_id;
  
  -- Atualizar contadores
  UPDATE employee_profiles
  SET
    total_tasks_completed = v_current_total + 1,
    total_tasks_on_time = v_current_on_time + CASE WHEN p_was_on_time THEN 1 ELSE 0 END,
    total_tasks_delayed = v_current_delayed + CASE WHEN NOT p_was_on_time THEN 1 ELSE 0 END,
    average_delay_minutes = CASE 
      WHEN v_current_total = 0 THEN p_delay_minutes
      ELSE (v_current_avg_delay * v_current_total + p_delay_minutes) / (v_current_total + 1)
    END,
    reliability_score = CASE
      WHEN v_current_total = 0 THEN CASE WHEN p_was_on_time THEN 1.0 ELSE 0.8 END
      ELSE (v_current_on_time + CASE WHEN p_was_on_time THEN 1 ELSE 0 END)::DECIMAL / (v_current_total + 1)
    END,
    last_updated = NOW()
  WHERE id = v_profile_id;
  
  -- Registrar evento comportamental
  INSERT INTO behavioral_history (
    employee_id, restaurant_id, event_type, event_date, task_id, delay_minutes, impact_level
  ) VALUES (
    p_employee_id, p_restaurant_id,
    CASE WHEN p_was_on_time THEN 'task_completed' ELSE 'task_delayed' END,
    p_completed_at,
    p_task_id,
    p_delay_minutes,
    CASE 
      WHEN p_delay_minutes > 60 THEN 'critical'
      WHEN p_delay_minutes > 30 THEN 'high'
      WHEN p_delay_minutes > 15 THEN 'medium'
      ELSE 'low'
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar updated_at
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
