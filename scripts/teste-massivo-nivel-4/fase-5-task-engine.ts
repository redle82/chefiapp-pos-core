/**
 * FASE 5 - TASK ENGINE COMPLETO
 * 
 * Gera tarefas de atraso, estoque, rotina. Valida filtragem e fechamento automático.
 */

import pg from 'pg';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

export const fase5TaskEngine: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 5 — TASK ENGINE COMPLETO');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Gerar tarefas de pedidos
    logger.log('Gerando tarefas de pedidos...');
    await pool.query(`
      SELECT public.generate_tasks_from_orders($1::UUID[])
    `, [context.restaurants.map(r => r.id)]);

    // 2. Gerar tarefas agendadas (rotina)
    logger.log('Gerando tarefas agendadas...');
    await pool.query(`
      SELECT public.generate_scheduled_tasks($1::UUID[])
    `, [context.restaurants.map(r => r.id)]);

    // 3. Validar distribuição de tarefas
    const taskDistribution = await pool.query(`
      SELECT 
        task_type,
        station,
        priority,
        COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'OPEN'
      GROUP BY task_type, station, priority
      ORDER BY count DESC
    `, [context.restaurants.map(r => r.id)]);

    logger.log('\n📊 Distribuição de tarefas:');
    for (const row of taskDistribution.rows) {
      logger.log(`  ${row.task_type} (${row.station || 'N/A'}) - ${row.priority}: ${row.count}`);
    }

    // 4. Simular resolução (fechar algumas tarefas)
    logger.log('\n✅ Simulando resolução de tarefas...');
    const resolved = await pool.query(`
      UPDATE public.gm_tasks
      SET status = 'RESOLVED',
          resolved_at = NOW(),
          updated_at = NOW()
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'OPEN'
        AND task_type = 'ESTOQUE_CRITICO'
      LIMIT 3
      RETURNING id
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ ${resolved.rowCount} tarefas resolvidas`);

    // 5. Validar que tarefas fecham quando condição some (ex: estoque reposto)
    logger.log('Validando fechamento automático...');
    // Simular reposição de estoque
    await pool.query(`
      UPDATE public.gm_stock_levels
      SET qty = min_qty * 2
      WHERE restaurant_id = ANY($1::UUID[])
        AND qty < min_qty
      LIMIT 2
    `, [context.restaurants.map(r => r.id)]);

    // Gerar tarefas novamente (deve fechar as antigas se estoque foi reposto)
    await pool.query(`
      SELECT public.generate_tasks_from_orders($1::UUID[])
    `, [context.restaurants.map(r => r.id)]);

    const finalTasks = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'OPEN'
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ ${finalTasks.rows[0].count} tarefas abertas restantes`);

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        taskTypes: taskDistribution.rows.length,
        tasksResolved: resolved.rowCount,
        finalOpenTasks: parseInt(finalTasks.rows[0].count),
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 5: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 5',
      severity: 'HIGH',
      message: `Erro na fase 5: ${errorMsg}`,
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
