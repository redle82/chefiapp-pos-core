/**
 * task-why-service.ts — "Why Badge" Service
 * 
 * Serviço para buscar "por quê" uma tarefa foi criada (qual regra, qual evento).
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface TaskWhyInfo {
  task_id: string;
  decision_id?: string;
  event_id?: string;
  event_type?: string;
  event_priority?: string;
  rule_id?: string;
  rule_name?: string;
  decision_summary?: string;
  created_at?: string;
}

/**
 * Get Why Info for Task (Buscar "Por Quê" da Tarefa)
 */
export async function getTaskWhyInfo(taskId: string): Promise<TaskWhyInfo | null> {
  // Find decision that created this task
  const result = await pool.query(
    `SELECT 
      d.id as decision_id,
      d.event_id,
      d.event_type,
      d.event_priority,
      d.rule_id,
      d.rule_name,
      d.created_at,
      d.payload
    FROM govern_decision_log d
    WHERE d.action_type = 'create_task'
      AND d.payload->>'task_id' = $1
    ORDER BY d.created_at DESC
    LIMIT 1`,
    [taskId]
  );

  if (result.rows.length === 0) {
    // Try alternative: check operational_event_tasks
    const altResult = await pool.query(
      `SELECT 
        t.event_id,
        e.event_type,
        e.priority as event_priority,
        e.context
      FROM operational_event_tasks t
      JOIN operational_events e ON e.id = t.event_id
      WHERE t.task_id = $1
      LIMIT 1`,
      [taskId]
    );

    if (altResult.rows.length === 0) {
      return null;
    }

    const row = altResult.rows[0];
    return {
      task_id: taskId,
      event_id: row.event_id,
      event_type: row.event_type,
      event_priority: row.event_priority,
      decision_summary: `Criada por evento: ${row.event_type}`,
    };
  }

  const row = result.rows[0];
  return {
    task_id: taskId,
    decision_id: row.decision_id,
    event_id: row.event_id,
    event_type: row.event_type,
    event_priority: row.event_priority,
    rule_id: row.rule_id,
    rule_name: row.rule_name,
    decision_summary: row.rule_name
      ? `Criada por regra "${row.rule_name}" após evento ${row.event_type}`
      : `Criada após evento ${row.event_type}`,
    created_at: row.created_at,
  };
}

/**
 * Get Why Info for Multiple Tasks (Batch)
 */
export async function getTasksWhyInfo(taskIds: string[]): Promise<Map<string, TaskWhyInfo>> {
  if (taskIds.length === 0) {
    return new Map();
  }

  const result = await pool.query(
    `SELECT 
      d.payload->>'task_id' as task_id,
      d.id as decision_id,
      d.event_id,
      d.event_type,
      d.event_priority,
      d.rule_id,
      d.rule_name,
      d.created_at
    FROM govern_decision_log d
    WHERE d.action_type = 'create_task'
      AND d.payload->>'task_id' = ANY($1::text[])
    ORDER BY d.created_at DESC`,
    [taskIds]
  );

  const map = new Map<string, TaskWhyInfo>();

  for (const row of result.rows) {
    map.set(row.task_id, {
      task_id: row.task_id,
      decision_id: row.decision_id,
      event_id: row.event_id,
      event_type: row.event_type,
      event_priority: row.event_priority,
      rule_id: row.rule_id,
      rule_name: row.rule_name,
      decision_summary: row.rule_name
        ? `Criada por regra "${row.rule_name}" após evento ${row.event_type}`
        : `Criada após evento ${row.event_type}`,
      created_at: row.created_at,
    });
  }

  return map;
}

