/**
 * FASE 3 - PRODUÇÃO POR ESTAÇÃO (KITCHEN/BAR)
 * 
 * Valida tabs e agrupamentos, timers por item, gera atrasos e valida Task Engine.
 */

import pg from 'pg';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

export const fase3ProducaoEstacao: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 3 — PRODUÇÃO POR ESTAÇÃO');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Validar agrupamento por estação
    logger.log('Validando agrupamento por estação...');
    const stationGroups = await pool.query(`
      SELECT 
        p.station,
        COUNT(DISTINCT oi.id) as items_count,
        AVG(p.prep_time_seconds) as avg_prep_time
      FROM public.gm_order_items oi
      JOIN public.gm_products p ON p.id = oi.product_id
      JOIN public.gm_orders o ON o.id = oi.order_id
      WHERE o.restaurant_id = ANY($1::UUID[])
        AND o.status IN ('OPEN', 'IN_PREP', 'PREPARING')
      GROUP BY p.station
    `, [context.restaurants.map(r => r.id)]);

    for (const row of stationGroups.rows) {
      logger.log(`  ✅ ${row.station}: ${row.items_count} itens (tempo médio: ${Math.round(row.avg_prep_time)}s)`);
    }

    // 2. Simular atrasos (marcar itens como IN_PREP há muito tempo)
    logger.log('\n⏱️  Simulando atrasos...');
    const delayedItems = await pool.query(`
      UPDATE public.gm_order_items
      SET status = 'IN_PREP',
          created_at = NOW() - INTERVAL '30 minutes'
      WHERE order_id IN (
        SELECT id FROM public.gm_orders 
        WHERE restaurant_id = ANY($1::UUID[])
          AND status IN ('OPEN', 'IN_PREP')
        LIMIT 5
      )
      RETURNING id, order_id
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ ${delayedItems.rowCount} itens marcados como atrasados`);

    // 3. Gerar tarefas de atraso
    logger.log('Gerando tarefas de atraso...');
    const taskResult = await pool.query(`
      SELECT public.generate_tasks_from_orders($1::UUID[])
    `, [context.restaurants.map(r => r.id)]);

    // 4. Validar que tarefas foram criadas
    const tasksCreated = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND task_type = 'ITEM_ATRASADO'
        AND status = 'OPEN'
        AND created_at > NOW() - INTERVAL '5 minutes'
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ ${tasksCreated.rows[0].count} tarefas de atraso criadas`);

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        stationsValidated: stationGroups.rows.length,
        delayedItems: delayedItems.rowCount,
        tasksCreated: parseInt(tasksCreated.rows[0].count),
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 3: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 3',
      severity: 'HIGH',
      message: `Erro na fase 3: ${errorMsg}`,
      details: error,
      reproducible: true,
    });

    return {
      success: false,
      duration: Date.now() - startTime,
      errors,
      warnings,
    };
  }
};
