/**
 * rule-simulator.ts — Rule Simulator (Dry-run)
 * 
 * Simula regras contra eventos históricos para prever impacto.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface SimulationResult {
  rule_id: string;
  rule_name: string;
  simulation_period_days: number;
  total_events_matched: number;
  total_actions_generated: number;
  actions_by_type: Record<string, number>;
  tasks_created: number;
  escalations: number;
  affected_roles: string[];
  priority_breakdown: {
    P0: number;
    P1: number;
    P2: number;
    P3: number;
  };
  estimated_impact: {
    high_priority_tasks: number;
    notifications: number;
    feature_changes: number;
  };
}

/**
 * Simulate Rule (Simular Regra)
 */
export async function simulateRule(
  restaurantId: string,
  ruleId: string,
  days: number = 7
): Promise<SimulationResult> {
  // Get rule
  const ruleResult = await pool.query(
    `SELECT * FROM operational_event_routing_rules
     WHERE id = $1 AND restaurant_id = $2`,
    [ruleId, restaurantId]
  );

  if (ruleResult.rows.length === 0) {
    throw new Error('Rule not found');
  }

  const rule = ruleResult.rows[0];

  // Get historical events that would match this rule
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const eventsResult = await pool.query(
    `SELECT * FROM operational_events
     WHERE restaurant_id = $1
       AND $2 = ANY(trigger_events)
       AND priority = $3
       AND created_at >= $4
     ORDER BY created_at DESC`,
    [restaurantId, rule.event_type, rule.priority, startDate]
  );

  const matchedEvents = eventsResult.rows;
  const totalEventsMatched = matchedEvents.length;

  // Simulate actions
  const actionsByType: Record<string, number> = {};
  let tasksCreated = 0;
  let escalations = 0;
  const affectedRoles = new Set<string>();
  const priorityBreakdown = { P0: 0, P1: 0, P2: 0, P3: 0 };

  for (const event of matchedEvents) {
    // Count action type
    const actionType = rule.action_type || 'create_task';
    actionsByType[actionType] = (actionsByType[actionType] || 0) + 1;

    // Count tasks
    if (actionType === 'create_task') {
      tasksCreated++;
    }

    // Count escalations (if priority increased)
    if (event.priority === 'P0' && rule.priority === 'P0') {
      escalations++;
    }

    // Track affected roles
    if (rule.target_roles) {
      for (const role of rule.target_roles) {
        affectedRoles.add(role);
      }
    }

    // Count priority
    priorityBreakdown[event.priority as 'P0' | 'P1' | 'P2' | 'P3']++;
  }

  // Calculate estimated impact
  const estimatedImpact = {
    high_priority_tasks: priorityBreakdown.P0 + priorityBreakdown.P1,
    notifications: actionsByType['send_notification'] || 0,
    feature_changes: actionsByType['enable_feature'] || actionsByType['disable_feature'] || 0,
  };

  return {
    rule_id: rule.id,
    rule_name: rule.rule_name || 'Unnamed Rule',
    simulation_period_days: days,
    total_events_matched: totalEventsMatched,
    total_actions_generated: Object.values(actionsByType).reduce((a, b) => a + b, 0),
    actions_by_type: actionsByType,
    tasks_created: tasksCreated,
    escalations,
    affected_roles: Array.from(affectedRoles),
    priority_breakdown: priorityBreakdown,
    estimated_impact: estimatedImpact,
  };
}

