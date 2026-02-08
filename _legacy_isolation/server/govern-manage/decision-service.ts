/**
 * decision-service.ts — Decision History Service
 * 
 * Serviço para consultar histórico de decisões do GovernManage.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface DecisionLogEntry {
  id: string;
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
  dedupe_count: number;
  status: string;
  executed_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  task_id?: string;
}

export function generateDecisionSummary(d: DecisionLogEntry): string {
  const rule = d.rule_name ? `Regra: ${d.rule_name}` : 'Regra: N/A';
  const actionTarget = d.action_target ? ` → ${d.action_target}` : '';
  const action = `Ação: ${d.action_type}${actionTarget}`;
  const status = `Status: ${d.status}`;
  return [rule, action, status].join(' | ');
}

/**
 * Get Decision History (Buscar Histórico de Decisões)
 */
export async function getDecisionHistory(
  restaurantId: string,
  filters?: {
    event_type?: string;
    priority?: string;
    action_type?: string;
    limit?: number;
  }
): Promise<DecisionLogEntry[]> {
  let query = `
    SELECT 
      d.id,
      d.restaurant_id,
      d.event_id,
      d.event_type,
      d.event_priority,
      d.rule_id,
      d.rule_name,
      d.action_type,
      d.action_target,
      d.payload,
      d.dedupe_key,
      d.dedupe_count,
      d.status,
      d.executed_at,
      d.resolved_at,
      d.resolved_by,
      d.created_at,
      t.task_id
    FROM govern_decision_log d
    LEFT JOIN operational_event_tasks t ON t.event_id = d.event_id
    WHERE d.restaurant_id = $1
  `;
  const params: any[] = [restaurantId];
  let paramIndex = 2;

  if (filters?.event_type) {
    query += ` AND d.event_type = $${paramIndex}`;
    params.push(filters.event_type);
    paramIndex++;
  }

  if (filters?.priority) {
    query += ` AND d.event_priority = $${paramIndex}`;
    params.push(filters.priority);
    paramIndex++;
  }

  if (filters?.action_type) {
    query += ` AND d.action_type = $${paramIndex}`;
    params.push(filters.action_type);
    paramIndex++;
  }

  query += ` ORDER BY d.created_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
  } else {
    query += ` LIMIT 50`;
  }

  const result = await pool.query(query, params);
  return result.rows.map(row => ({
    id: row.id,
    restaurant_id: row.restaurant_id,
    event_id: row.event_id,
    event_type: row.event_type,
    event_priority: row.event_priority,
    rule_id: row.rule_id,
    rule_name: row.rule_name,
    action_type: row.action_type,
    action_target: row.action_target,
    payload: row.payload,
    dedupe_key: row.dedupe_key,
    dedupe_count: row.dedupe_count || 1,
    status: row.status,
    executed_at: row.executed_at,
    resolved_at: row.resolved_at,
    resolved_by: row.resolved_by,
    created_at: row.created_at,
    task_id: row.task_id, // Include task_id if available
  }));
}

/**
 * Get Decision Details (Buscar Detalhes da Decisão)
 */
export async function getDecisionDetails(decisionId: string): Promise<DecisionLogEntry | null> {
  const result = await pool.query(
    `SELECT 
      d.*,
      t.task_id,
      e.context as event_context,
      e.source_module
    FROM govern_decision_log d
    LEFT JOIN operational_events e ON e.id = d.event_id
    LEFT JOIN operational_event_tasks t ON t.event_id = d.event_id
    WHERE d.id = $1`,
    [decisionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    event_id: row.event_id,
    event_type: row.event_type,
    event_priority: row.event_priority,
    rule_id: row.rule_id,
    rule_name: row.rule_name,
    action_type: row.action_type,
    action_target: row.action_target,
    payload: {
      ...row.payload,
      event_context: row.event_context,
      source_module: row.source_module,
    },
    dedupe_key: row.dedupe_key,
    dedupe_count: row.dedupe_count || 1,
    status: row.status,
    executed_at: row.executed_at,
    resolved_at: row.resolved_at,
    resolved_by: row.resolved_by,
    created_at: row.created_at,
    task_id: row.task_id,
  } as any;
}


