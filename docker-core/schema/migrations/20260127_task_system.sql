/**
 * Task System - Sistema Completo de Tarefas
 * 
 * Inclui:
 * - Tarefas recorrentes
 * - Tarefas geradas por eventos
 * - Histórico completo
 * - Feedback e análise
 */

-- Tarefas recorrentes
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  frequency VARCHAR NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  time_of_day TIME,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = domingo
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  assigned_role VARCHAR, -- owner, manager, employee, cashier, kitchen
  category VARCHAR DEFAULT 'operational' CHECK (category IN ('opening', 'closing', 'cleaning', 'haccp', 'operational', 'maintenance')),
  priority VARCHAR DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  estimated_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, name, frequency)
);

CREATE INDEX idx_recurring_tasks_restaurant ON recurring_tasks(restaurant_id);
CREATE INDEX idx_recurring_tasks_active ON recurring_tasks(is_active) WHERE is_active = true;

-- Tarefas geradas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL,
  event_id UUID, -- Se gerada por evento (referência a events table se existir)
  event_type VARCHAR, -- Tipo de evento que gerou a tarefa
  title VARCHAR NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  assigned_role VARCHAR, -- Se não atribuída a pessoa específica
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  priority VARCHAR DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  category VARCHAR DEFAULT 'operational',
  due_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  feedback TEXT,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  impact_sla JSONB DEFAULT '{}'::JSONB, -- { delay_minutes: 0, affected_orders: [], etc }
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_restaurant ON tasks(restaurant_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tasks_assigned_role ON tasks(assigned_role) WHERE assigned_role IS NOT NULL;
CREATE INDEX idx_tasks_due_at ON tasks(due_at);
CREATE INDEX idx_tasks_recurring ON tasks(recurring_task_id) WHERE recurring_task_id IS NOT NULL;
CREATE INDEX idx_tasks_event ON tasks(event_type) WHERE event_type IS NOT NULL;

-- Histórico de tarefas
CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  action VARCHAR NOT NULL CHECK (action IN ('created', 'assigned', 'started', 'completed', 'cancelled', 'updated', 'feedback_added', 'overdue')),
  actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  actor_role VARCHAR,
  old_status VARCHAR,
  new_status VARCHAR,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_history_task ON task_history(task_id);
CREATE INDEX idx_task_history_actor ON task_history(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_task_history_created ON task_history(created_at);

-- Regras de geração automática de tarefas
CREATE TABLE IF NOT EXISTS task_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL, -- order_delayed, stock_low, employee_absent, etc
  condition JSONB NOT NULL, -- Condições que devem ser satisfeitas
  task_template JSONB NOT NULL, -- Template da tarefa a ser criada
  priority VARCHAR DEFAULT 'normal',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, event_type)
);

CREATE INDEX idx_task_rules_restaurant ON task_rules(restaurant_id);
CREATE INDEX idx_task_rules_active ON task_rules(is_active) WHERE is_active = true;

-- RPC: Criar tarefa recorrente
CREATE OR REPLACE FUNCTION create_recurring_task(
  p_restaurant_id UUID,
  p_name VARCHAR,
  p_description TEXT,
  p_frequency VARCHAR,
  p_time_of_day TIME,
  p_day_of_week INTEGER DEFAULT NULL,
  p_day_of_month INTEGER DEFAULT NULL,
  p_assigned_role VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT 'operational',
  p_priority VARCHAR DEFAULT 'normal',
  p_estimated_minutes INTEGER DEFAULT 15
) RETURNS UUID AS $$
DECLARE
  v_task_id UUID;
BEGIN
  INSERT INTO recurring_tasks (
    restaurant_id, name, description, frequency, time_of_day,
    day_of_week, day_of_month, assigned_role, category, priority, estimated_minutes
  ) VALUES (
    p_restaurant_id, p_name, p_description, p_frequency, p_time_of_day,
    p_day_of_week, p_day_of_month, p_assigned_role, p_category, p_priority, p_estimated_minutes
  ) RETURNING id INTO v_task_id;
  
  RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Gerar tarefas recorrentes para hoje
CREATE OR REPLACE FUNCTION generate_recurring_tasks_for_today(
  p_restaurant_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_task RECORD;
  v_due_at TIMESTAMP;
  v_day_of_week INTEGER;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  FOR v_task IN 
    SELECT * FROM recurring_tasks
    WHERE restaurant_id = p_restaurant_id
      AND is_active = true
      AND (
        (frequency = 'daily')
        OR (frequency = 'weekly' AND day_of_week = v_day_of_week)
        OR (frequency = 'monthly' AND day_of_month = EXTRACT(DAY FROM p_date))
      )
  LOOP
    -- Verificar se já existe tarefa para hoje
    IF NOT EXISTS (
      SELECT 1 FROM tasks
      WHERE restaurant_id = p_restaurant_id
        AND recurring_task_id = v_task.id
        AND DATE(due_at) = p_date
    ) THEN
      -- Calcular due_at
      v_due_at := (p_date + v_task.time_of_day)::TIMESTAMP;
      
      -- Criar tarefa
      INSERT INTO tasks (
        restaurant_id, recurring_task_id, title, description,
        assigned_role, status, priority, category, due_at
      ) VALUES (
        p_restaurant_id, v_task.id, v_task.name, v_task.description,
        v_task.assigned_role, 'pending', v_task.priority, v_task.category, v_due_at
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- RPC: Criar tarefa a partir de evento
CREATE OR REPLACE FUNCTION create_task_from_event(
  p_restaurant_id UUID,
  p_event_type VARCHAR,
  p_event_data JSONB,
  p_title VARCHAR,
  p_description TEXT,
  p_priority VARCHAR DEFAULT 'normal',
  p_due_at TIMESTAMP DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_task_id UUID;
  v_rule RECORD;
  v_task_template JSONB;
  v_assigned_role VARCHAR;
  v_calculated_due_at TIMESTAMP;
BEGIN
  -- Buscar regra para este tipo de evento
  SELECT * INTO v_rule
  FROM task_rules
  WHERE restaurant_id = p_restaurant_id
    AND event_type = p_event_type
    AND is_active = true
  LIMIT 1;
  
  IF v_rule IS NULL THEN
    -- Sem regra, criar tarefa padrão
    v_task_template := jsonb_build_object(
      'title', p_title,
      'description', p_description,
      'priority', p_priority
    );
  ELSE
    v_task_template := v_rule.task_template;
    -- Substituir variáveis do template com dados do evento
    -- (implementação simplificada)
  END IF;
  
  -- Calcular due_at se não fornecido
  IF p_due_at IS NULL THEN
    v_calculated_due_at := NOW() + INTERVAL '1 hour';
  ELSE
    v_calculated_due_at := p_due_at;
  END IF;
  
  -- Extrair assigned_role do template
  v_assigned_role := v_task_template->>'assigned_role';
  
  -- Criar tarefa
  INSERT INTO tasks (
    restaurant_id, event_type, event_id,
    title, description, assigned_role,
    status, priority, due_at, metadata
  ) VALUES (
    p_restaurant_id, p_event_type, (p_event_data->>'id')::UUID,
    COALESCE(v_task_template->>'title', p_title),
    COALESCE(v_task_template->>'description', p_description),
    v_assigned_role,
    'pending',
    COALESCE(v_task_template->>'priority', p_priority),
    v_calculated_due_at,
    p_event_data
  ) RETURNING id INTO v_task_id;
  
  -- Registrar no histórico
  INSERT INTO task_history (task_id, action, metadata)
  VALUES (v_task_id, 'created', jsonb_build_object('event_type', p_event_type));
  
  RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Atualizar status da tarefa
CREATE OR REPLACE FUNCTION update_task_status(
  p_task_id UUID,
  p_new_status VARCHAR,
  p_actor_id UUID DEFAULT NULL,
  p_feedback TEXT DEFAULT NULL,
  p_feedback_rating INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_old_status VARCHAR;
  v_actor_role VARCHAR;
BEGIN
  -- Buscar status atual
  SELECT status INTO v_old_status FROM tasks WHERE id = p_task_id;
  
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  
  -- Buscar role do ator
  IF p_actor_id IS NOT NULL THEN
    SELECT role INTO v_actor_role FROM employees WHERE id = p_actor_id;
  END IF;
  
  -- Atualizar tarefa
  UPDATE tasks
  SET 
    status = p_new_status,
    started_at = CASE WHEN p_new_status = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
    completed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE completed_at END,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN NOW() ELSE cancelled_at END,
    feedback = COALESCE(p_feedback, feedback),
    feedback_rating = COALESCE(p_feedback_rating, feedback_rating),
    updated_at = NOW()
  WHERE id = p_task_id;
  
  -- Registrar no histórico
  INSERT INTO task_history (task_id, action, actor_id, actor_role, old_status, new_status)
  VALUES (p_task_id, 
    CASE 
      WHEN p_new_status = 'in_progress' THEN 'started'
      WHEN p_new_status = 'completed' THEN 'completed'
      WHEN p_new_status = 'cancelled' THEN 'cancelled'
      ELSE 'updated'
    END,
    p_actor_id, v_actor_role, v_old_status, p_new_status);
END;
$$ LANGUAGE plpgsql;

-- RPC: Marcar tarefas como overdue
CREATE OR REPLACE FUNCTION mark_overdue_tasks()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE tasks
  SET status = 'overdue', updated_at = NOW()
  WHERE status IN ('pending', 'in_progress')
    AND due_at < NOW()
    AND status != 'overdue';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Registrar no histórico
  INSERT INTO task_history (task_id, action, metadata)
  SELECT id, 'overdue', jsonb_build_object('due_at', due_at, 'marked_at', NOW())
  FROM tasks
  WHERE status = 'overdue'
    AND id NOT IN (SELECT task_id FROM task_history WHERE action = 'overdue' AND created_at > NOW() - INTERVAL '1 minute');
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recurring_tasks_updated_at
  BEFORE UPDATE ON recurring_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
