-- Migration: 063_voice_routing_rules.sql
-- Purpose: Seed routing rules for Voice Operations Layer events
-- Date: 2025-01-02

-- Routing Rule: voice_reminder → Create Task
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
  'Voice Reminder → Create Task' as rule_name,
  'voice_reminder'::operational_event_type as event_type,
  'P2'::operational_event_priority as priority,
  'create_task' as action_type,
  '{
    "title_template": "Lembrete: {announcement_text}",
    "task_type": "reminder",
    "description": "Lembrete de voz: {announcement_text}"
  }'::jsonb as action_config,
  ARRAY['kitchen', 'staff']::TEXT[] as target_roles,
  true as enabled
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

-- Routing Rule: voice_trigger → Create Task
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
  'Voice Trigger → Create Task' as rule_name,
  'voice_trigger'::operational_event_type as event_type,
  'P1'::operational_event_priority as priority,
  'create_task' as action_type,
  '{
    "title_template": "Ação via voz: {spoken_text}",
    "task_type": "voice_action",
    "description": "Solicitado via Alexa: {spoken_text}"
  }'::jsonb as action_config,
  ARRAY['kitchen', 'cleaner', 'staff']::TEXT[] as target_roles,
  true as enabled
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

-- Routing Rule: voice_ack_timeout → Notify Manager
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
  'Voice Ack Timeout → Notify Manager' as rule_name,
  'voice_ack_timeout'::operational_event_type as event_type,
  'P1'::operational_event_priority as priority,
  'send_notification' as action_type,
  '{
    "notification_type": "alert",
    "message": "Lembrete de voz não confirmado há mais de 5 minutos"
  }'::jsonb as action_config,
  ARRAY['manager']::TEXT[] as target_roles,
  true as enabled
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE public.operational_event_routing_rules IS 'Regras de roteamento para eventos de voz foram adicionadas';

