-- Migration: 065_portioning_routing_rules.sql
-- Purpose: Seed routing rules for Portioning & Cost Real events
-- Date: 2025-01-02

-- Routing Rule: portion_drift_detected → Create Task + Decision Card
INSERT INTO public.operational_event_routing_rules (
  restaurant_id,
  rule_name,
  event_type,
  priority,
  action_type,
  action_config,
  target_roles,
  enabled
)
SELECT 
  r.id as restaurant_id,
  'Portion Drift → Re-training Task' as rule_name,
  'portion_drift_detected'::operational_event_type as event_type,
  'P1'::operational_event_priority as priority,
  'create_task' as action_type,
  '{
    "title_template": "Re-treinamento porcionamento: {base_product_name}",
    "task_type": "portioning_retraining",
    "description": "Variação média de {avg_variation_g}g detectada. Impacto estimado: {impact_yearly_formatted}/ano",
    "context": {
      "session_id": "{session_id}",
      "base_product_id": "{base_product_id}",
      "target_weight_g": "{target_weight_g}",
      "target_thickness_mm": "{target_thickness_mm}",
      "target_portions": "{target_portions}"
    }
  }'::jsonb as action_config,
  ARRAY['manager', 'kitchen']::TEXT[] as target_roles,
  true as enabled
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE public.operational_event_routing_rules IS 'Regras de roteamento para eventos de porcionamento foram adicionadas';

