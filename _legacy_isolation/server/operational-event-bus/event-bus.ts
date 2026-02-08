/**
 * event-bus.ts — Operational Event Bus
 * 
 * Sistema nervoso que conecta todos os módulos:
 * - OperationalHub + AppStaff + ReputationHub + TPV
 * 
 * Princípio: "Observação antes de interpretação"
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export type EventType =
  // TPV Events
  | 'order_created'
  | 'order_updated'
  | 'order_paid'
  | 'order_cancelled'
  | 'item_added'
  | 'item_removed'
  // Portioning Events
  | 'portion_drift_detected'
  // Stock Events
  | 'stock_low'
  | 'stock_critical'
  | 'stock_restocked'
  | 'stock_movement'
  // Staff Events
  | 'waiter_call'
  | 'waiter_call_repeated'
  | 'shift_started'
  | 'shift_ended'
  | 'break_started'
  | 'break_ended'
  // Review Events
  | 'review_received'
  | 'review_negative'
  | 'review_positive'
  | 'review_mention_cleanliness'
  | 'review_mention_service'
  | 'review_mention_price'
  | 'review_mention_food'
  // Delivery Events
  | 'delivery_order_received'
  | 'delivery_order_delayed'
  | 'delivery_order_ready'
  // Voice Events
  | 'voice_reminder'
  | 'voice_trigger'
  | 'voice_acknowledged'
  | 'voice_ack_timeout'
  // Operational Events
  | 'peak_hour_detected'
  | 'table_turnover_slow'
  | 'kitchen_delay'
  | 'payment_failed'
  | 'system_error';

export type EventPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type EventStatus = 'pending' | 'processing' | 'routed' | 'acknowledged' | 'resolved' | 'ignored';

export interface OperationalEvent {
  id: string;
  restaurant_id: string;
  event_type: EventType;
  priority: EventPriority;
  status: EventStatus;
  source_module: string;
  source_id?: string;
  context: Record<string, any>;
  target_roles?: string[];
  target_user_id?: string;
  auto_route: boolean;
  created_at: string;
  processed_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  dedupe_key?: string;
}

export interface CreateEventParams {
  restaurant_id: string;
  event_type: EventType;
  priority?: EventPriority;
  source_module: 'tpv' | 'stock' | 'staff' | 'reviews' | 'delivery' | 'analytics' | 'operational' | 'voice' | 'portioning';
  source_id?: string;
  context?: Record<string, any>;
  target_roles?: string[];
  target_user_id?: string;
  auto_route?: boolean;
  dedupe_key?: string;
  dedupe_window_minutes?: number;
}

/**
 * Emit Event (Emitir Evento)
 * 
 * Cria um evento no Event Bus e, se auto_route=true, roteia automaticamente.
 */
export async function emitEvent(params: CreateEventParams): Promise<OperationalEvent> {
  // Check for duplicates (if dedupe_key provided)
  if (params.dedupe_key) {
    const existing = await pool.query(
      `SELECT id FROM operational_events
       WHERE restaurant_id = $1
         AND dedupe_key = $2
         AND created_at > NOW() - INTERVAL '${params.dedupe_window_minutes || 5} minutes'
         AND status != 'resolved'
       LIMIT 1`,
      [params.restaurant_id, params.dedupe_key]
    );

    if (existing.rows.length > 0) {
      // Update existing event priority if new one is higher
      const existingEvent = await pool.query(
        `SELECT priority FROM operational_events WHERE id = $1`,
        [existing.rows[0].id]
      );

      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      const existingPriority = priorityOrder[existingEvent.rows[0].priority as EventPriority];
      const newPriority = priorityOrder[params.priority || 'P2'];

      if (newPriority < existingPriority) {
        // New event has higher priority, update existing
        await pool.query(
          `UPDATE operational_events
           SET priority = $1,
               context = jsonb_set(context, '{duplicate_count}', COALESCE((context->>'duplicate_count')::int, 0) + 1)
           WHERE id = $2`,
          [params.priority || 'P2', existing.rows[0].id]
        );
      } else {
        // Just increment duplicate count
        await pool.query(
          `UPDATE operational_events
           SET context = jsonb_set(context, '{duplicate_count}', COALESCE((context->>'duplicate_count')::int, 0) + 1)
           WHERE id = $1`,
          [existing.rows[0].id]
        );
      }

      // Return existing event
      const result = await pool.query(
        `SELECT * FROM operational_events WHERE id = $1`,
        [existing.rows[0].id]
      );
      return result.rows[0];
    }
  }

  // Create new event
  const result = await pool.query(
    `INSERT INTO operational_events
     (restaurant_id, event_type, priority, source_module, source_id, context, target_roles, target_user_id, auto_route, dedupe_key, dedupe_window_minutes)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      params.restaurant_id,
      params.event_type,
      params.priority || 'P2',
      params.source_module,
      params.source_id || null,
      JSON.stringify(params.context || {}),
      params.target_roles || null,
      params.target_user_id || null,
      params.auto_route ?? true,
      params.dedupe_key || null,
      params.dedupe_window_minutes || 5,
    ]
  );

  const event = result.rows[0];

  // Auto-route if enabled
  if (params.auto_route !== false) {
    await routeEvent(event.id);
  }

  // Send to GovernManage layer (sovereign layer)
  try {
    const { processEvent } = await import('../govern-manage/governance-engine');
    await processEvent(event);
  } catch (err) {
    // GovernManage not available, continue silently
    console.warn('[EventBus] GovernManage not available:', err);
  }

  return event;
}

/**
 * Route Event (Rotear Evento)
 * 
 * Aplica regras de roteamento e cria tarefas/notificações conforme configurado.
 */
export async function routeEvent(eventId: string): Promise<void> {
  // Get event
  const eventResult = await pool.query(
    `SELECT * FROM operational_events WHERE id = $1`,
    [eventId]
  );

  if (eventResult.rows.length === 0) {
    throw new Error('Event not found');
  }

  const event = eventResult.rows[0];

  // Update status to processing
  await pool.query(
    `UPDATE operational_events SET status = 'processing' WHERE id = $1`,
    [eventId]
  );

  // Get routing rules for this event type and priority
  const rulesResult = await pool.query(
    `SELECT * FROM operational_event_routing_rules
     WHERE restaurant_id = $1
       AND event_type = $2
       AND priority = $3
       AND enabled = true`,
    [event.restaurant_id, event.event_type, event.priority]
  );

  if (rulesResult.rows.length === 0) {
    // No routing rules, mark as routed anyway
    await pool.query(
      `UPDATE operational_events SET status = 'routed', processed_at = NOW() WHERE id = $1`,
      [eventId]
    );
    return;
  }

  // Apply routing rules
  for (const rule of rulesResult.rows) {
    if (rule.action_type === 'create_task') {
      // Create AppStaff task
      await createTaskFromEvent(event, rule);
    } else if (rule.action_type === 'send_notification') {
      // Send notification (TODO: implement notification service)
      console.log(`[EventBus] Notification: ${event.event_type}`, event);
      
      // Log decision
      await logDecision({
        restaurant_id: event.restaurant_id,
        event_id: event.id,
        event_type: event.event_type,
        event_priority: event.priority,
        rule_id: rule.id,
        rule_name: rule.rule_name || null,
        action_type: 'notify_manager',
        action_target: rule.target_roles?.[0] || 'manager',
        payload: {
          notification_type: 'alert',
          message: `Evento: ${event.event_type}`,
          priority: event.priority,
        },
        dedupe_key: event.dedupe_key || null,
        dedupe_count: event.context?.duplicate_count || 1,
      });
    } else if (rule.action_type === 'update_dashboard') {
      // Update dashboard (TODO: implement dashboard update)
      console.log(`[EventBus] Dashboard update: ${event.event_type}`, event);
      
      // Log decision
      await logDecision({
        restaurant_id: event.restaurant_id,
        event_id: event.id,
        event_type: event.event_type,
        event_priority: event.priority,
        rule_id: rule.id,
        rule_name: rule.rule_name || null,
        action_type: 'update_dashboard',
        action_target: 'dashboard',
        payload: {
          update_type: 'metric',
          event_type: event.event_type,
        },
        dedupe_key: event.dedupe_key || null,
        dedupe_count: event.context?.duplicate_count || 1,
      });
    }
  }
  
  // If no rules matched, log as ignored
  if (rulesResult.rows.length === 0) {
    await logDecision({
      restaurant_id: event.restaurant_id,
      event_id: event.id,
      event_type: event.event_type,
      event_priority: event.priority,
      action_type: 'ignore',
      action_target: 'system',
      payload: {
        reason: 'no_matching_rules',
      },
      dedupe_key: event.dedupe_key || null,
      dedupe_count: event.context?.duplicate_count || 1,
    });
  }

  // Mark as routed
  await pool.query(
    `UPDATE operational_events SET status = 'routed', processed_at = NOW() WHERE id = $1`,
    [eventId]
  );
}

/**
 * Create Task from Event (Criar Tarefa a partir de Evento)
 */
async function createTaskFromEvent(event: OperationalEvent, rule: any): Promise<void> {
  // Get title from template
  let title = rule.action_config?.title_template || `${event.event_type}`;
  
  // Replace template variables
  if (event.context) {
    for (const [key, value] of Object.entries(event.context)) {
      title = title.replace(`{${key}}`, String(value));
    }
  }

  // Get description from context
  const description = event.context?.description || `Evento: ${event.event_type}`;

  // Create task in AppStaff (via direct insert for now)
  // TODO: Integrate with AppStaff service when available
  const taskResult = await pool.query(
    `INSERT INTO appstaff_tasks
     (restaurant_id, type, title, description, status, priority, assignee_role, context, meta)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7::jsonb, $8::jsonb)
     RETURNING id`,
    [
      event.restaurant_id,
      rule.action_config?.task_type || event.event_type,
      title,
      description,
      event.priority,
      rule.target_roles[0] || null, // Assign to first target role
      JSON.stringify(event.context || {}),
      JSON.stringify({ event_id: event.id, source_module: event.source_module }),
    ]
  );

  const taskId = taskResult.rows[0].id;

  // Link event to task
  await pool.query(
    `INSERT INTO operational_event_tasks
     (event_id, task_id, task_type, task_title, task_description)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      event.id,
      taskId,
      rule.action_config?.task_type || event.event_type,
      title,
      description,
    ]
  );

  // Log decision
  await logDecision({
    restaurant_id: event.restaurant_id,
    event_id: event.id,
    event_type: event.event_type,
    event_priority: event.priority,
    rule_id: rule.id,
    rule_name: rule.rule_name || null,
    action_type: 'create_task',
    action_target: 'appstaff',
    payload: {
      task_id: taskId,
      task_type: rule.action_config?.task_type || event.event_type,
      title,
      description,
      priority: event.priority,
      assignee_role: rule.target_roles[0] || null,
      rule_config: rule.action_config,
    },
    dedupe_key: event.dedupe_key ?? undefined,
    dedupe_count: event.context?.duplicate_count || 1,
  });
}

/**
 * Log Decision (Registrar Decisão)
 */
async function logDecision(params: {
  restaurant_id: string;
  event_id: string;
  event_type: string;
  event_priority: string;
  rule_id?: string;
  rule_name?: string;
  action_type: string;
  action_target?: string;
  payload: Record<string, any>;
  dedupe_key?: string;
  dedupe_count?: number;
}): Promise<void> {
  await pool.query(
    `INSERT INTO govern_decision_log
     (restaurant_id, event_id, event_type, event_priority, rule_id, rule_name, action_type, action_target, payload, dedupe_key, dedupe_count, status, executed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, 'executed', NOW())`,
    [
      params.restaurant_id,
      params.event_id,
      params.event_type,
      params.event_priority,
      params.rule_id || null,
      params.rule_name || null,
      params.action_type,
      params.action_target || null,
      JSON.stringify(params.payload),
      params.dedupe_key || null,
      params.dedupe_count || 1,
    ]
  );
}

/**
 * Get Events (Buscar Eventos)
 */
export async function getEvents(
  restaurantId: string,
  filters?: {
    event_type?: EventType;
    priority?: EventPriority;
    status?: EventStatus;
    source_module?: string;
    limit?: number;
  }
): Promise<OperationalEvent[]> {
  let query = `SELECT * FROM operational_events WHERE restaurant_id = $1`;
  const params: any[] = [restaurantId];
  let paramIndex = 2;

  if (filters?.event_type) {
    query += ` AND event_type = $${paramIndex}`;
    params.push(filters.event_type);
    paramIndex++;
  }

  if (filters?.priority) {
    query += ` AND priority = $${paramIndex}`;
    params.push(filters.priority);
    paramIndex++;
  }

  if (filters?.status) {
    query += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters?.source_module) {
    query += ` AND source_module = $${paramIndex}`;
    params.push(filters.source_module);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
  }

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Resolve Event (Resolver Evento)
 */
export async function resolveEvent(eventId: string, userId: string): Promise<void> {
  await pool.query(
    `UPDATE operational_events
     SET status = 'resolved',
         resolved_at = NOW(),
         resolved_by = $1
     WHERE id = $2`,
    [userId, eventId]
  );
}

