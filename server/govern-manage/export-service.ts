/**
 * export-service.ts — Export Service for Decision History
 * 
 * Exporta Decision History em CSV/JSON para relatórios e análises.
 */

import { Pool } from 'pg';
import { getDecisionHistory, generateDecisionSummary } from './decision-service';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Export Decisions as CSV
 */
export async function exportDecisionsCSV(
  restaurantId: string,
  filters?: {
    event_type?: string;
    priority?: string;
    action_type?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<string> {
  const decisions = await getDecisionHistory(restaurantId, {
    event_type: filters?.event_type,
    priority: filters?.priority as any,
    action_type: filters?.action_type,
    limit: 10000, // Large limit for export
  });

  // Filter by date if provided
  let filtered = decisions;
  if (filters?.start_date || filters?.end_date) {
    filtered = decisions.filter(d => {
      const date = new Date(d.created_at);
      if (filters.start_date && date < new Date(filters.start_date)) return false;
      if (filters.end_date && date > new Date(filters.end_date)) return false;
      return true;
    });
  }

  // CSV Headers
  const headers = [
    'ID',
    'Data/Hora',
    'Tipo de Evento',
    'Prioridade',
    'Regra',
    'Tipo de Ação',
    'Alvo',
    'Status',
    'Tarefa ID',
    'Deduplicações',
    'Resumo',
  ];

  // CSV Rows
  const rows = filtered.map(d => [
    d.id,
    new Date(d.created_at).toISOString(),
    d.event_type,
    d.event_priority,
    d.rule_name || 'N/A',
    d.action_type,
    d.action_target || 'N/A',
    d.status,
    d.task_id || 'N/A',
    d.dedupe_count?.toString() || '1',
    `"${generateDecisionSummary(d).replace(/"/g, '""')}"`, // Escape quotes
  ]);

  // Combine headers and rows
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csv;
}

/**
 * Export Decisions as JSON
 */
export async function exportDecisionsJSON(
  restaurantId: string,
  filters?: {
    event_type?: string;
    priority?: string;
    action_type?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<any> {
  const decisions = await getDecisionHistory(restaurantId, {
    event_type: filters?.event_type,
    priority: filters?.priority as any,
    action_type: filters?.action_type,
    limit: 10000,
  });

  // Filter by date if provided
  let filtered = decisions;
  if (filters?.start_date || filters?.end_date) {
    filtered = decisions.filter(d => {
      const date = new Date(d.created_at);
      if (filters.start_date && date < new Date(filters.start_date)) return false;
      if (filters.end_date && date > new Date(filters.end_date)) return false;
      return true;
    });
  }

  return {
    restaurant_id: restaurantId,
    export_date: new Date().toISOString(),
    filters: filters || {},
    total_decisions: filtered.length,
    decisions: filtered.map(d => ({
      id: d.id,
      created_at: d.created_at,
      event_type: d.event_type,
      event_priority: d.event_priority,
      rule_name: d.rule_name,
      action_type: d.action_type,
      action_target: d.action_target,
      status: d.status,
      task_id: d.task_id,
      dedupe_count: d.dedupe_count,
      summary: generateDecisionSummary(d),
      payload: d.payload,
    })),
  };
}


