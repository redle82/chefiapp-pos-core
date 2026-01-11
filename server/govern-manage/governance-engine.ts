/**
 * governance-engine.ts — GovernManage Engine
 * 
 * Sistema que governa os outros sistemas.
 * Camada soberana de orquestração.
 */

import { Pool } from 'pg';
import { OperationalEvent } from '../operational-event-bus/event-bus';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface GovernanceRule {
  id: string;
  restaurant_id: string;
  rule_name: string;
  rule_type: 'event_trigger' | 'signal_cross' | 'pattern_detection' | 'auto_action';
  trigger_events: string[];
  trigger_conditions: Record<string, any>;
  cross_signals: Array<{
    source: string;
    field: string;
    operator: string;
    value: any;
  }>;
  pattern_type?: string;
  pattern_config: Record<string, any>;
  actions: Array<{
    type: string;
    target: string;
    config: Record<string, any>;
  }>;
  priority: string;
  enabled: boolean;
}

export interface SignalValue {
  source: string;
  field: string;
  value: any;
  timestamp: string;
}

/**
 * Process Event (Processar Evento)
 * 
 * GovernManage escuta eventos e decide ações.
 */
export async function processEvent(event: OperationalEvent): Promise<void> {
  // Get active rules for this event type
  const rules = await pool.query(
    `SELECT * FROM govern_rules
     WHERE restaurant_id = $1
       AND enabled = true
       AND $2 = ANY(trigger_events)
     ORDER BY priority ASC`,
    [event.restaurant_id, event.event_type]
  );

  if (rules.rows.length === 0) {
    return; // No rules to apply
  }

  for (const rule of rules.rows) {
    await evaluateRule(rule, event);
  }
}

/**
 * Evaluate Rule (Avaliar Regra)
 */
async function evaluateRule(rule: GovernanceRule, event: OperationalEvent): Promise<void> {
  // Check trigger conditions
  if (!checkTriggerConditions(rule.trigger_conditions, event)) {
    return;
  }

  // If signal_cross rule, check cross signals
  if (rule.rule_type === 'signal_cross' && rule.cross_signals.length > 0) {
    const signalsMatch = await checkCrossSignals(rule.restaurant_id, rule.cross_signals, event);
    if (!signalsMatch) {
      return;
    }
  }

  // If pattern_detection rule, check pattern
  if (rule.rule_type === 'pattern_detection') {
    const patternMatches = await checkPattern(rule.restaurant_id, rule.pattern_type!, rule.pattern_config, event);
    if (!patternMatches) {
      return;
    }
  }

  // Execute actions
  await executeActions(rule, event);
}

/**
 * Check Trigger Conditions (Verificar Condições de Trigger)
 */
function checkTriggerConditions(conditions: Record<string, any>, event: OperationalEvent): boolean {
  if (Object.keys(conditions).length === 0) {
    return true; // No conditions = always match
  }

  // Check priority
  if (conditions.priority && event.priority !== conditions.priority) {
    return false;
  }

  // Check context fields
  if (conditions.context) {
    for (const [key, value] of Object.entries(conditions.context)) {
      if (event.context[key] !== value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check Cross Signals (Verificar Sinais Cruzados)
 */
async function checkCrossSignals(
  restaurantId: string,
  crossSignals: Array<{ source: string; field: string; operator: string; value: any }>,
  event: OperationalEvent
): Promise<boolean> {
  for (const signal of crossSignals) {
    const signalValue = await getSignalValue(restaurantId, signal.source, signal.field, event);
    
    if (signalValue === null) {
      return false; // Signal not available
    }

    // Apply operator
    const matches = applyOperator(signalValue, signal.operator, signal.value);
    if (!matches) {
      return false;
    }
  }

  return true; // All signals match
}

/**
 * Get Signal Value (Buscar Valor do Sinal)
 */
async function getSignalValue(
  restaurantId: string,
  source: string,
  field: string,
  event: OperationalEvent
): Promise<any> {
  // Check cache first
  const cacheKey = `${source}:${field}`;
  const cache = await pool.query(
    `SELECT signal_value, expires_at FROM govern_signal_cache
     WHERE restaurant_id = $1
       AND signal_key = $2
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [restaurantId, cacheKey]
  );

  if (cache.rows.length > 0) {
    return cache.rows[0].signal_value[field];
  }

  // Fetch from source
  let value: any = null;

  if (source === 'stock') {
    // Get stock value
    const stock = await pool.query(
      `SELECT ${field} FROM operational_hub_stock_items
       WHERE restaurant_id = $1
       LIMIT 1`,
      [restaurantId]
    );
    if (stock.rows.length > 0) {
      value = stock.rows[0][field];
    }
  } else if (source === 'reviews') {
    // Get review value from event context or query
    value = event.context[field];
  } else if (source === 'analytics') {
    // Get analytics value
    const today = new Date().toISOString().split('T')[0];
    const analytics = await pool.query(
      `SELECT ${field} FROM operational_hub_analytics_snapshots
       WHERE restaurant_id = $1
         AND snapshot_date = $2
       LIMIT 1`,
      [restaurantId, today]
    );
    if (analytics.rows.length > 0) {
      value = analytics.rows[0][field];
    }
  } else if (source === 'staff') {
    // Get staff value from event context
    value = event.context[field];
  } else if (source === 'operational') {
    // Get operational value from event context
    value = event.context[field];
  }

  // Cache the value (5 minutes TTL)
  if (value !== null) {
    await pool.query(
      `INSERT INTO govern_signal_cache
       (restaurant_id, signal_key, signal_type, signal_value, expires_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW() + INTERVAL '5 minutes')
       ON CONFLICT (restaurant_id, signal_key)
       DO UPDATE SET signal_value = EXCLUDED.signal_value, expires_at = EXCLUDED.expires_at`,
      [restaurantId, cacheKey, source, JSON.stringify({ [field]: value })]
    );
  }

  return value;
}

/**
 * Apply Operator (Aplicar Operador)
 */
function applyOperator(value: any, operator: string, expected: any): boolean {
  switch (operator) {
    case '==':
      return value == expected;
    case '!=':
      return value != expected;
    case '<':
      return value < expected;
    case '<=':
      return value <= expected;
    case '>':
      return value > expected;
    case '>=':
      return value >= expected;
    case 'contains':
      if (Array.isArray(value)) {
        return value.includes(expected);
      }
      if (typeof value === 'string') {
        return value.includes(expected);
      }
      return false;
    case 'not_contains':
      if (Array.isArray(value)) {
        return !value.includes(expected);
      }
      if (typeof value === 'string') {
        return !value.includes(expected);
      }
      return true;
    default:
      return false;
  }
}

/**
 * Check Pattern (Verificar Padrão)
 */
async function checkPattern(
  restaurantId: string,
  patternType: string,
  patternConfig: Record<string, any>,
  event: OperationalEvent
): Promise<boolean> {
  // TODO: Implement pattern detection logic
  // For now, return true (patterns will be detected separately)
  return true;
}

/**
 * Execute Actions (Executar Ações)
 */
async function executeActions(rule: GovernanceRule, event: OperationalEvent): Promise<void> {
  // Record decision
  const decisionResult = await pool.query(
    `INSERT INTO govern_decisions
     (restaurant_id, rule_id, decision_type, trigger_event_id, cross_signals_used, reasoning, action_result)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'pending')
     RETURNING id`,
    [
      rule.restaurant_id,
      rule.id,
      'create_task', // Default decision type
      event.id,
      JSON.stringify(rule.cross_signals),
      `Rule "${rule.rule_name}" triggered by event ${event.event_type}`,
    ]
  );

  const decisionId = decisionResult.rows[0].id;

  // Execute each action
  for (const action of rule.actions) {
    await executeAction(rule.restaurant_id, decisionId, action, event);
  }

  // Update decision status
  await pool.query(
    `UPDATE govern_decisions
     SET action_result = 'success', executed_at = NOW()
     WHERE id = $1`,
    [decisionId]
  );
}

/**
 * Execute Action (Executar Ação)
 */
async function executeAction(
  restaurantId: string,
  decisionId: string,
  action: { type: string; target: string; config: Record<string, any> },
  event: OperationalEvent
): Promise<void> {
  if (action.type === 'create_task' && action.target === 'appstaff') {
    // Create AppStaff task
    const taskResult = await pool.query(
      `INSERT INTO appstaff_tasks
       (restaurant_id, type, title, description, status, priority, assignee_role, context, meta)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7::jsonb, $8::jsonb)
       RETURNING id`,
      [
        restaurantId,
        action.config.task_type || event.event_type,
        action.config.title || `Task from ${event.event_type}`,
        action.config.description || event.context.description || '',
        action.config.priority || event.priority,
        action.config.assignee_role || null,
        JSON.stringify(event.context),
        JSON.stringify({ decision_id: decisionId, rule_id: event.id }),
      ]
    );

    // Record auto-action
    await pool.query(
      `INSERT INTO govern_auto_actions
       (restaurant_id, decision_id, action_type, action_target, action_config, success)
       VALUES ($1, $2, $3, $4, $5::jsonb, true)`,
      [
        restaurantId,
        decisionId,
        action.type,
        action.target,
        JSON.stringify({ task_id: taskResult.rows[0].id, ...action.config }),
      ]
    );
  } else if (action.type === 'send_alert') {
    // Send alert (TODO: implement notification service)
    console.log(`[GovernManage] Alert to ${action.target}:`, action.config.message);
    
    await pool.query(
      `INSERT INTO govern_auto_actions
       (restaurant_id, decision_id, action_type, action_target, action_config, success)
       VALUES ($1, $2, $3, $4, $5::jsonb, true)`,
      [
        restaurantId,
        decisionId,
        action.type,
        action.target,
        JSON.stringify(action.config),
      ]
    );
  } else if (action.type === 'generate_insight') {
    // Generate insight (TODO: implement insight generation)
    console.log(`[GovernManage] Insight for ${action.target}:`, action.config.message);
    
    await pool.query(
      `INSERT INTO govern_auto_actions
       (restaurant_id, decision_id, action_type, action_target, action_config, success)
       VALUES ($1, $2, $3, $4, $5::jsonb, true)`,
      [
        restaurantId,
        decisionId,
        action.type,
        action.target,
        JSON.stringify(action.config),
      ]
    );
  } else if (action.type === 'enable_feature') {
    // Enable feature flag
    await pool.query(
      `INSERT INTO govern_feature_flags
       (restaurant_id, feature_key, enabled, enabled_at)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (restaurant_id, feature_key)
       DO UPDATE SET enabled = true, enabled_at = NOW(), updated_at = NOW()`,
      [restaurantId, action.config.feature_key]
    );
  } else if (action.type === 'disable_feature') {
    // Disable feature flag
    await pool.query(
      `UPDATE govern_feature_flags
       SET enabled = false, updated_at = NOW()
       WHERE restaurant_id = $1
         AND feature_key = $2`,
      [restaurantId, action.config.feature_key]
    );
  }
}

/**
 * Get Feature Flag (Buscar Feature Flag)
 */
export async function getFeatureFlag(restaurantId: string, featureKey: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT enabled FROM govern_feature_flags
     WHERE restaurant_id = $1
       AND feature_key = $2`,
    [restaurantId, featureKey]
  );

  if (result.rows.length === 0) {
    return false; // Default: disabled
  }

  return result.rows[0].enabled;
}

/**
 * Set Feature Flag (Definir Feature Flag)
 */
export async function setFeatureFlag(
  restaurantId: string,
  featureKey: string,
  enabled: boolean,
  userId?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO govern_feature_flags
     (restaurant_id, feature_key, enabled, enabled_at, enabled_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (restaurant_id, feature_key)
     DO UPDATE SET enabled = EXCLUDED.enabled, enabled_at = CASE WHEN EXCLUDED.enabled THEN NOW() ELSE enabled_at END, enabled_by = EXCLUDED.enabled_by, updated_at = NOW()`,
    [restaurantId, featureKey, enabled, enabled ? new Date() : null, userId || null]
  );
}

