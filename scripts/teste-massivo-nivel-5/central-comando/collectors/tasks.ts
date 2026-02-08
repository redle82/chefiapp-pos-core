/**
 * Coletor de Métricas do Task Engine
 * 
 * Coleta tasks criadas/resolvidas, SLA, hard-blocks, distribuição
 */

import pg from 'pg';
import type { Pool } from 'pg';

export interface TaskEngineMetrics {
  creation: CreationMetrics;
  sla: SLAMetrics;
  hardBlocks: HardBlockMetrics;
  distribution: DistributionMetrics;
  alerts: Alert[];
}

export interface CreationMetrics {
  createdPerSecond: number;
  resolvedPerSecond: number;
  escalated: number;
  expired: number;
  byRestaurant: { [restaurantId: string]: number };
  byType: { [type: string]: number };
}

export interface SLAMetrics {
  violated: number;
  atRisk: number; // < 10% do tempo restante
  violationRate: number; // porcentagem
  byType: { [type: string]: { violated: number; total: number } };
  byRestaurant: { [restaurantId: string]: { violated: number; total: number } };
}

export interface HardBlockMetrics {
  active: number;
  chains: HardBlockChain[];
  resolutionTime: number; // ms (tempo médio)
}

export interface HardBlockChain {
  chain: string[]; // IDs de tasks na cadeia
  depth: number;
  oldestTask: Date;
}

export interface DistributionMetrics {
  byRestaurant: { [restaurantId: string]: number };
  byStation: { [station: string]: number };
  byRole: { [role: string]: number };
  byPriority: { [priority: string]: number };
}

export interface Alert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

export async function collectTaskEngineMetrics(
  pool: Pool,
  runId?: string | null,
): Promise<TaskEngineMetrics> {
  const creation = await collectCreationMetrics(pool, runId);
  const sla = await collectSLAMetrics(pool, runId);
  const hardBlocks = await collectHardBlockMetrics(pool, runId);
  const distribution = await collectDistributionMetrics(pool, runId);
  const alerts = generateAlerts(creation, sla, hardBlocks, distribution);

  return {
    creation,
    sla,
    hardBlocks,
    distribution,
    alerts,
  };
}

async function collectCreationMetrics(
  pool: Pool,
  runId?: string | null,
): Promise<CreationMetrics> {
  try {
    // Filtro por run_id: tasks criadas a partir de pedidos com esse run_id
    // ou tasks de restaurantes do teste (fallback)
    const runFilter = runId
      ? `AND (
          EXISTS (
            SELECT 1 FROM public.gm_orders o
            WHERE o.id = ANY(
              SELECT jsonb_array_elements_text(t.context->'order_ids'::text[])::UUID
            )
            AND o.metadata->>'run_id' = $1
          )
          OR t.restaurant_id IN (
            SELECT id FROM public.gm_restaurants
            WHERE name LIKE '%n5%' OR slug LIKE '%-n5'
          )
        )`
      : `AND t.restaurant_id IN (
          SELECT id FROM public.gm_restaurants
          WHERE name LIKE '%n5%' OR slug LIKE '%-n5'
        )`;

    const runParams = runId ? [runId] : [];

    // Tasks criadas por segundo (últimos 60 segundos)
    const createdResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM public.gm_tasks t
      WHERE created_at > NOW() - INTERVAL '60 seconds'
      ${runFilter}
    `,
      runParams,
    ).catch(() => ({ rows: [{ count: 0 }] }));
    
    const createdPerSecond = Math.floor((createdResult.rows[0]?.count || 0) / 60);
    
    // Tasks resolvidas por segundo
    const resolvedResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM public.gm_tasks t
      WHERE status = 'completed'
        AND updated_at > NOW() - INTERVAL '60 seconds'
      ${runFilter}
    `,
      runParams,
    ).catch(() => ({ rows: [{ count: 0 }] }));
    
    const resolvedPerSecond = Math.floor((resolvedResult.rows[0]?.count || 0) / 60);
    
    // Tasks escaladas
    const escalatedResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE context->>'escalated' = 'true'
        AND updated_at > NOW() - INTERVAL '60 seconds'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const escalated = parseInt(escalatedResult.rows[0]?.count || '0');
    
    // Tasks expiradas (assumindo SLA de 30 minutos)
    const expiredResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE status != 'completed'
        AND created_at < NOW() - INTERVAL '30 minutes'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const expired = parseInt(expiredResult.rows[0]?.count || '0');
    
    // Por restaurante
    const byRestaurantResult = await pool.query(`
      SELECT 
        restaurant_id,
        COUNT(*) as count
      FROM public.gm_tasks
      WHERE created_at > NOW() - INTERVAL '60 seconds'
      GROUP BY restaurant_id
      LIMIT 100
    `).catch(() => ({ rows: [] }));
    
    const byRestaurant: { [key: string]: number } = {};
    for (const row of byRestaurantResult.rows) {
      byRestaurant[row.restaurant_id] = parseInt(row.count);
    }
    
    // Por tipo (simplificado)
    const byType: { [key: string]: number } = {};
    
    return {
      createdPerSecond,
      resolvedPerSecond,
      escalated,
      expired,
      byRestaurant,
      byType,
    };
  } catch (e) {
    console.error('[TASKS] Erro ao coletar métricas de criação:', e);
    return {
      createdPerSecond: 0,
      resolvedPerSecond: 0,
      escalated: 0,
      expired: 0,
      byRestaurant: {},
      byType: {},
    };
  }
}

async function collectSLAMetrics(
  pool: Pool,
  runId?: string | null,
): Promise<SLAMetrics> {
  try {
    // Filtro por run_id (mesma lógica)
    const runFilter = runId
      ? `AND (
          EXISTS (
            SELECT 1 FROM public.gm_orders o
            WHERE o.id = ANY(
              SELECT jsonb_array_elements_text(t.context->'order_ids'::text[])::UUID
            )
            AND o.metadata->>'run_id' = $1
          )
          OR t.restaurant_id IN (
            SELECT id FROM public.gm_restaurants
            WHERE name LIKE '%n5%' OR slug LIKE '%-n5'
          )
        )`
      : `AND t.restaurant_id IN (
          SELECT id FROM public.gm_restaurants
          WHERE name LIKE '%n5%' OR slug LIKE '%-n5'
        )`;

    const runParams = runId ? [runId] : [];

    // Tasks com SLA violado (assumindo SLA de 30 minutos)
    const violatedResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM public.gm_tasks t
      WHERE status != 'completed'
        AND created_at < NOW() - INTERVAL '30 minutes'
      ${runFilter}
    `,
      runParams,
    ).catch(() => ({ rows: [{ count: 0 }] }));
    
    const violated = parseInt(violatedResult.rows[0]?.count || '0');
    
    // Tasks em risco (< 10% do tempo restante = < 3 minutos restantes)
    const atRiskResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE status != 'completed'
        AND created_at < NOW() - INTERVAL '27 minutes'
        AND created_at > NOW() - INTERVAL '30 minutes'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const atRisk = parseInt(atRiskResult.rows[0]?.count || '0');
    
    // Total de tasks ativas
    const totalResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE status != 'completed'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const total = parseInt(totalResult.rows[0]?.count || '0');
    const violationRate = total > 0 ? (violated / total) * 100 : 0;
    
    // Por restaurante
    const byRestaurantResult = await pool.query(`
      SELECT 
        restaurant_id,
        COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '30 minutes') as violated,
        COUNT(*) as total
      FROM public.gm_tasks
      WHERE status != 'completed'
      GROUP BY restaurant_id
      LIMIT 100
    `).catch(() => ({ rows: [] }));
    
    const byRestaurant: { [key: string]: { violated: number; total: number } } = {};
    for (const row of byRestaurantResult.rows) {
      byRestaurant[row.restaurant_id] = {
        violated: parseInt(row.violated || '0'),
        total: parseInt(row.total || '0'),
      };
    }
    
    return {
      violated,
      atRisk,
      violationRate,
      byType: {},
      byRestaurant,
    };
  } catch (e) {
    console.error('[TASKS] Erro ao coletar métricas de SLA:', e);
    return {
      violated: 0,
      atRisk: 0,
      violationRate: 0,
      byType: {},
      byRestaurant: {},
    };
  }
}

async function collectHardBlockMetrics(pool: Pool): Promise<HardBlockMetrics> {
  // Simplificado - em produção detectar cadeias de hard-blocks
  return {
    active: 0,
    chains: [],
    resolutionTime: 0,
  };
}

async function collectDistributionMetrics(pool: Pool): Promise<DistributionMetrics> {
  try {
    // Por restaurante
    const byRestaurantResult = await pool.query(`
      SELECT 
        restaurant_id,
        COUNT(*) as count
      FROM public.gm_tasks
      WHERE status != 'completed'
      GROUP BY restaurant_id
      LIMIT 100
    `).catch(() => ({ rows: [] }));
    
    const byRestaurant: { [key: string]: number } = {};
    for (const row of byRestaurantResult.rows) {
      byRestaurant[row.restaurant_id] = parseInt(row.count);
    }
    
    // Por estação (do context)
    const byStation: { [key: string]: number } = {};
    
    // Por role (do context)
    const byRole: { [key: string]: number } = {};
    
    // Por prioridade (do context)
    const byPriority: { [key: string]: number } = {};
    
    return {
      byRestaurant,
      byStation,
      byRole,
      byPriority,
    };
  } catch (e) {
    console.error('[TASKS] Erro ao coletar métricas de distribuição:', e);
    return {
      byRestaurant: {},
      byStation: {},
      byRole: {},
      byPriority: {},
    };
  }
}

function generateAlerts(
  creation: CreationMetrics,
  sla: SLAMetrics,
  hardBlocks: HardBlockMetrics,
  distribution: DistributionMetrics
): Alert[] {
  const alerts: Alert[] = [];
  
  // SLA violado
  if (sla.violated > 0) {
    alerts.push({
      severity: sla.violated > 10 ? 'critical' : 'warning',
      message: `${sla.violated} tasks com SLA violado`,
      timestamp: new Date(),
    });
  }
  
  // Tasks em risco
  if (sla.atRisk > 0) {
    alerts.push({
      severity: 'warning',
      message: `${sla.atRisk} tasks em risco de violar SLA`,
      timestamp: new Date(),
    });
  }
  
  // Taxa de violação alta
  if (sla.violationRate > 10) {
    alerts.push({
      severity: 'critical',
      message: `Taxa de violação de SLA alta: ${sla.violationRate.toFixed(1)}%`,
      timestamp: new Date(),
    });
  }
  
  // Hard-blocks ativos
  if (hardBlocks.active > 0) {
    alerts.push({
      severity: 'warning',
      message: `${hardBlocks.active} hard-blocks ativos`,
      timestamp: new Date(),
    });
  }
  
  return alerts;
}
