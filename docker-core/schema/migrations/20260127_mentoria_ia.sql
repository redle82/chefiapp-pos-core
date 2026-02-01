/**
 * Mentoria IA - Sistema de Mentoria Operacional
 * 
 * Inclui:
 * - Sugestões e recomendações
 * - Alertas inteligentes
 * - Evolução guiada
 * - Histórico de interações
 * - Tom e autoridade
 */

-- Sugestões da IA
CREATE TABLE IF NOT EXISTS mentor_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Tipo e categoria
  suggestion_type VARCHAR NOT NULL, -- optimization, alert, evolution, task, etc
  category VARCHAR DEFAULT 'operational' CHECK (category IN ('operational', 'financial', 'human', 'system', 'growth')),
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Conteúdo
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  reasoning TEXT, -- Por que essa sugestão foi gerada
  
  -- Estado
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'applied', 'dismissed', 'expired')),
  acknowledged_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP,
  applied_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  dismissed_reason TEXT,
  
  -- Contexto
  context JSONB DEFAULT '{}'::JSONB, -- Dados que geraram a sugestão
  related_entity_type VARCHAR, -- task, alert, health, etc
  related_entity_id UUID,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- Sugestões podem expirar
);

CREATE INDEX idx_mentor_suggestions_restaurant ON mentor_suggestions(restaurant_id);
CREATE INDEX idx_mentor_suggestions_status ON mentor_suggestions(status);
CREATE INDEX idx_mentor_suggestions_type ON mentor_suggestions(suggestion_type);
CREATE INDEX idx_mentor_suggestions_priority ON mentor_suggestions(priority);
CREATE INDEX idx_mentor_suggestions_created ON mentor_suggestions(created_at);

-- Recomendações de evolução
CREATE TABLE IF NOT EXISTS mentor_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Tipo de recomendação
  recommendation_type VARCHAR NOT NULL, -- install_module, optimize_config, add_feature, etc
  target VARCHAR NOT NULL, -- module_id, config_section, feature_name, etc
  
  -- Conteúdo
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  benefits JSONB DEFAULT '[]'::JSONB, -- Lista de benefícios
  requirements JSONB DEFAULT '[]'::JSONB, -- Pré-requisitos
  estimated_impact VARCHAR CHECK (estimated_impact IN ('low', 'medium', 'high', 'transformative')),
  
  -- Estado
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'postponed')),
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejected_reason TEXT,
  
  -- Contexto
  context JSONB DEFAULT '{}'::JSONB, -- Por que essa recomendação foi gerada
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mentor_recommendations_restaurant ON mentor_recommendations(restaurant_id);
CREATE INDEX idx_mentor_recommendations_status ON mentor_recommendations(status);
CREATE INDEX idx_mentor_recommendations_type ON mentor_recommendations(recommendation_type);

-- Interações com a mentoria
CREATE TABLE IF NOT EXISTS mentor_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- Tipo de interação
  interaction_type VARCHAR NOT NULL CHECK (interaction_type IN ('suggestion_viewed', 'suggestion_applied', 'suggestion_dismissed', 'recommendation_viewed', 'recommendation_accepted', 'question_asked', 'feedback_given')),
  
  -- Conteúdo
  content TEXT,
  response TEXT, -- Resposta da IA
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text TEXT,
  
  -- Contexto
  related_suggestion_id UUID REFERENCES mentor_suggestions(id) ON DELETE SET NULL,
  related_recommendation_id UUID REFERENCES mentor_recommendations(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}'::JSONB,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mentor_interactions_restaurant ON mentor_interactions(restaurant_id);
CREATE INDEX idx_mentor_interactions_employee ON mentor_interactions(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX idx_mentor_interactions_type ON mentor_interactions(interaction_type);
CREATE INDEX idx_mentor_interactions_created ON mentor_interactions(created_at);

-- Configuração da mentoria por restaurante
CREATE TABLE IF NOT EXISTS mentor_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL UNIQUE REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Preferências
  mentor_active BOOLEAN DEFAULT true,
  mentor_tone VARCHAR DEFAULT 'professional' CHECK (mentor_tone IN ('friendly', 'professional', 'direct', 'supportive')),
  mentor_frequency VARCHAR DEFAULT 'moderate' CHECK (mentor_frequency IN ('minimal', 'moderate', 'frequent', 'aggressive')),
  mentor_authority VARCHAR DEFAULT 'suggestive' CHECK (mentor_authority IN ('suggestive', 'advisory', 'directive')),
  
  -- Filtros
  categories_enabled JSONB DEFAULT '["operational", "financial", "human", "system", "growth"]'::JSONB,
  min_priority VARCHAR DEFAULT 'low' CHECK (min_priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mentor_config_restaurant ON mentor_config(restaurant_id);

-- RPC: Criar sugestão
CREATE OR REPLACE FUNCTION create_mentor_suggestion(
  p_restaurant_id UUID,
  p_suggestion_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_category VARCHAR DEFAULT 'operational',
  p_priority VARCHAR DEFAULT 'medium',
  p_details JSONB DEFAULT '{}'::JSONB,
  p_reasoning TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::JSONB,
  p_related_entity_type VARCHAR DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_expires_at TIMESTAMP DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_suggestion_id UUID;
BEGIN
  INSERT INTO mentor_suggestions (
    restaurant_id, suggestion_type, title, message, category, priority,
    details, reasoning, context, related_entity_type, related_entity_id, expires_at
  ) VALUES (
    p_restaurant_id, p_suggestion_type, p_title, p_message, p_category, p_priority,
    p_details, p_reasoning, p_context, p_related_entity_type, p_related_entity_id, p_expires_at
  ) RETURNING id INTO v_suggestion_id;
  
  RETURN v_suggestion_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Atualizar status da sugestão
CREATE OR REPLACE FUNCTION update_suggestion_status(
  p_suggestion_id UUID,
  p_new_status VARCHAR,
  p_actor_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE mentor_suggestions
  SET 
    status = p_new_status,
    acknowledged_by = CASE WHEN p_new_status = 'acknowledged' THEN p_actor_id ELSE acknowledged_by END,
    acknowledged_at = CASE WHEN p_new_status = 'acknowledged' AND acknowledged_at IS NULL THEN NOW() ELSE acknowledged_at END,
    applied_at = CASE WHEN p_new_status = 'applied' THEN NOW() ELSE applied_at END,
    dismissed_at = CASE WHEN p_new_status = 'dismissed' THEN NOW() ELSE dismissed_at END,
    dismissed_reason = CASE WHEN p_new_status = 'dismissed' THEN p_notes ELSE dismissed_reason END,
    updated_at = NOW()
  WHERE id = p_suggestion_id;
  
  -- Registrar interação
  INSERT INTO mentor_interactions (
    restaurant_id, employee_id, interaction_type, related_suggestion_id, content
  )
  SELECT 
    restaurant_id, p_actor_id,
    CASE 
      WHEN p_new_status = 'acknowledged' THEN 'suggestion_viewed'
      WHEN p_new_status = 'applied' THEN 'suggestion_applied'
      WHEN p_new_status = 'dismissed' THEN 'suggestion_dismissed'
      ELSE 'suggestion_viewed'
    END,
    p_suggestion_id,
    p_notes
  FROM mentor_suggestions WHERE id = p_suggestion_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Criar recomendação
CREATE OR REPLACE FUNCTION create_mentor_recommendation(
  p_restaurant_id UUID,
  p_recommendation_type VARCHAR,
  p_target VARCHAR,
  p_title VARCHAR,
  p_description TEXT,
  p_benefits JSONB DEFAULT '[]'::JSONB,
  p_requirements JSONB DEFAULT '[]'::JSONB,
  p_estimated_impact VARCHAR DEFAULT 'medium',
  p_context JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
  v_recommendation_id UUID;
BEGIN
  INSERT INTO mentor_recommendations (
    restaurant_id, recommendation_type, target, title, description,
    benefits, requirements, estimated_impact, context
  ) VALUES (
    p_restaurant_id, p_recommendation_type, p_target, p_title, p_description,
    p_benefits, p_requirements, p_estimated_impact, p_context
  ) RETURNING id INTO v_recommendation_id;
  
  RETURN v_recommendation_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Atualizar status da recomendação
CREATE OR REPLACE FUNCTION update_recommendation_status(
  p_recommendation_id UUID,
  p_new_status VARCHAR,
  p_actor_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE mentor_recommendations
  SET 
    status = p_new_status,
    accepted_at = CASE WHEN p_new_status = 'accepted' THEN NOW() ELSE accepted_at END,
    rejected_at = CASE WHEN p_new_status = 'rejected' THEN NOW() ELSE rejected_at END,
    rejected_reason = CASE WHEN p_new_status = 'rejected' THEN p_notes ELSE rejected_reason END,
    updated_at = NOW()
  WHERE id = p_recommendation_id;
  
  -- Registrar interação
  INSERT INTO mentor_interactions (
    restaurant_id, employee_id, interaction_type, related_recommendation_id, content
  )
  SELECT 
    restaurant_id, p_actor_id,
    CASE 
      WHEN p_new_status = 'accepted' THEN 'recommendation_accepted'
      WHEN p_new_status = 'rejected' THEN 'recommendation_viewed'
      ELSE 'recommendation_viewed'
    END,
    p_recommendation_id,
    p_notes
  FROM mentor_recommendations WHERE id = p_recommendation_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Analisar sistema e gerar sugestões
CREATE OR REPLACE FUNCTION analyze_system_and_suggest(
  p_restaurant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_health_score JSONB;
  v_active_alerts INTEGER;
  v_pending_tasks INTEGER;
  v_suggestions_count INTEGER := 0;
BEGIN
  -- Buscar health score
  SELECT calculate_restaurant_health_score(p_restaurant_id) INTO v_health_score;
  
  -- Contar alertas ativos
  SELECT COUNT(*) INTO v_active_alerts
  FROM alerts
  WHERE restaurant_id = p_restaurant_id AND status IN ('active', 'escalated');
  
  -- Contar tarefas pendentes
  SELECT COUNT(*) INTO v_pending_tasks
  FROM tasks
  WHERE restaurant_id = p_restaurant_id AND status = 'pending';
  
  -- Gerar sugestões baseadas em health score
  IF (v_health_score->>'overall_status')::text = 'critical' THEN
    PERFORM create_mentor_suggestion(
      p_restaurant_id,
      'alert',
      'Sistema em estado crítico',
      'O sistema está em estado crítico. Revise as métricas de saúde e tome ações imediatas.',
      'system',
      'critical',
      jsonb_build_object('health_score', v_health_score),
      'Health score geral está em estado crítico'
    );
    v_suggestions_count := v_suggestions_count + 1;
  END IF;
  
  -- Gerar sugestões baseadas em alertas
  IF v_active_alerts > 5 THEN
    PERFORM create_mentor_suggestion(
      p_restaurant_id,
      'optimization',
      'Muitos alertas ativos',
      format('Você tem %s alertas ativos. Considere revisar e resolver os mais críticos primeiro.', v_active_alerts),
      'operational',
      'high',
      jsonb_build_object('alert_count', v_active_alerts),
      'Número elevado de alertas ativos'
    );
    v_suggestions_count := v_suggestions_count + 1;
  END IF;
  
  -- Gerar sugestões baseadas em tarefas
  IF v_pending_tasks > 10 THEN
    PERFORM create_mentor_suggestion(
      p_restaurant_id,
      'task',
      'Muitas tarefas pendentes',
      format('Você tem %s tarefas pendentes. Considere delegar ou priorizar.', v_pending_tasks),
      'operational',
      'medium',
      jsonb_build_object('task_count', v_pending_tasks),
      'Número elevado de tarefas pendentes'
    );
    v_suggestions_count := v_suggestions_count + 1;
  END IF;
  
  -- Construir resultado
  v_result := jsonb_build_object(
    'suggestions_created', v_suggestions_count,
    'health_score', v_health_score,
    'active_alerts', v_active_alerts,
    'pending_tasks', v_pending_tasks
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar updated_at
CREATE TRIGGER update_mentor_suggestions_updated_at
  BEFORE UPDATE ON mentor_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentor_recommendations_updated_at
  BEFORE UPDATE ON mentor_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentor_config_updated_at
  BEFORE UPDATE ON mentor_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
