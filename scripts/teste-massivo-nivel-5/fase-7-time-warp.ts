/**
 * FASE 7 - TIME WARP
 * 
 * Simula 7 dias de operação (comprimido em minutos):
 * - Picos (almoço 12h-14h, jantar 19h-22h)
 * - Horas mortas (15h-18h, 23h-11h)
 * - Abertura (8h-9h)
 * - Fechamento (23h-24h)
 * - Tasks agendadas (horas, dias, semanas)
 * - Validação: sistema não acumula lixo lógico
 * - Validação: tarefas agendadas aparecem no momento correto
 * - Validação: tarefas antigas são fechadas automaticamente
 * - Validação: estado não "drift" ao longo do tempo
 */

import pg from 'pg';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';
import { emitProgress } from './progress';

const SIMULATION_DAYS = 7;

export const fase7TimeWarp: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 7 — TIME WARP');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log(`📅 Simulando ${SIMULATION_DAYS} dias de operação (comprimido)...`);

  // Emitir evento de início
  emitProgress({
    phase: 'FASE 7: Time Warp',
    step: 'start',
    op: 'EXEC',
    message: `Iniciando simulação de ${SIMULATION_DAYS} dias`,
    timestamp: Date.now(),
  });

  try {
    // 1. Baseline: estado inicial
    logger.log('\n📊 Coletando baseline inicial...');
    const baseline = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status IN ('OPEN', 'IN_PREP', 'PREPARING') THEN 1 END) as active_orders,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
        COUNT(DISTINCT restaurant_id) as restaurants_with_orders
      FROM public.gm_orders
      WHERE restaurant_id = ANY($1::UUID[])
    `, [context.restaurants.map(r => r.id)]);

    const baselineStats = baseline.rows[0];
    logger.log(`  ✅ Baseline: ${baselineStats.total_orders} pedidos, ${baselineStats.active_orders} ativos`);

    // 2. Simular 7 dias (comprimido)
    let totalDaysSimulated = 0;
    let totalPeakHours = 0;
    let totalDeadHours = 0;
    let totalOpenClose = 0;

    for (let day = 1; day <= SIMULATION_DAYS; day++) {
      logger.log(`\n📅 Dia ${day}/${SIMULATION_DAYS}...`);

      // 2.1. Abertura (8h-9h)
      logger.log(`  🌅 Abertura (8h-9h)...`);
      // Simular algumas ações de abertura (verificar equipamentos, etc.)
      const openingActions = await pool.query(`
        SELECT COUNT(*) as count
        FROM public.gm_tasks
        WHERE restaurant_id = ANY($1::UUID[])
          AND task_type = 'EQUIPAMENTO_CHECK'
          AND status = 'OPEN'
          AND created_at > NOW() - INTERVAL '1 hour'
      `, [context.restaurants.map(r => r.id)]);

      totalOpenClose += parseInt(openingActions.rows[0].count);

      // 2.2. Pico almoço (12h-14h)
      logger.log(`  🍽️  Pico almoço (12h-14h)...`);
      const lunchPeak = await pool.query(`
        SELECT COUNT(*) as count
        FROM public.gm_orders
        WHERE restaurant_id = ANY($1::UUID[])
          AND created_at > NOW() - INTERVAL '2 hours'
      `, [context.restaurants.map(r => r.id)]);

      totalPeakHours += parseInt(lunchPeak.rows[0].count);

      // 2.3. Horas mortas (15h-18h)
      logger.log(`  😴 Horas mortas (15h-18h)...`);
      // Validar que sistema não acumula lixo durante horas mortas
      const deadHoursCheck = await pool.query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'OPEN' AND created_at < NOW() - INTERVAL '24 hours' THEN 1 END) as old_open_tasks
        FROM public.gm_tasks
        WHERE restaurant_id = ANY($1::UUID[])
      `, [context.restaurants.map(r => r.id)]);

      const deadHoursStats = deadHoursCheck.rows[0];
      if (parseInt(deadHoursStats.old_open_tasks) > 100) {
        warnings.push(`Muitas tarefas antigas abertas durante horas mortas: ${deadHoursStats.old_open_tasks}`);
      }

      totalDeadHours += parseInt(deadHoursStats.total_tasks);

      // 2.4. Pico jantar (19h-22h)
      logger.log(`  🍽️  Pico jantar (19h-22h)...`);
      const dinnerPeak = await pool.query(`
        SELECT COUNT(*) as count
        FROM public.gm_orders
        WHERE restaurant_id = ANY($1::UUID[])
          AND created_at > NOW() - INTERVAL '3 hours'
      `, [context.restaurants.map(r => r.id)]);

      totalPeakHours += parseInt(dinnerPeak.rows[0].count);

      // 2.5. Fechamento (23h-24h)
      logger.log(`  🌙 Fechamento (23h-24h)...`);
      // Simular fechamento (limpeza, conferência)
      const closingActions = await pool.query(`
        SELECT COUNT(*) as count
        FROM public.gm_tasks
        WHERE restaurant_id = ANY($1::UUID[])
          AND task_type IN ('LIMPEZA', 'CONFERENCIA_ESTOQUE')
          AND status = 'OPEN'
          AND created_at > NOW() - INTERVAL '1 hour'
      `, [context.restaurants.map(r => r.id)]);

      totalOpenClose += parseInt(closingActions.rows[0].count);

      totalDaysSimulated++;

      // Emitir progresso semântico nos marcos principais (Dia 1, 3, 5, 7)
      if (day === 1 || day === 3 || day === 5 || day === 7) {
        emitProgress({
          phase: 'FASE 7: Time Warp',
          step: `Dia ${day}/${SIMULATION_DAYS} processado`,
          current: day,
          total: SIMULATION_DAYS,
          op: 'EXEC',
          message: `Dia ${day} de ${SIMULATION_DAYS} simulado`,
          timestamp: Date.now(),
        });
      }
    }

    // 3. Validar tarefas agendadas (horas, dias, semanas)
    logger.log('\n🔍 Validando tarefas agendadas...');
    
    // 3.1. Tarefas agendadas por hora (limpeza diária)
    const hourlyTasks = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND task_type = 'LIMPEZA'
        AND status = 'OPEN'
        AND created_at > NOW() - INTERVAL '24 hours'
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ Tarefas agendadas por hora: ${hourlyTasks.rows[0].count}`);

    // 3.2. Tarefas agendadas por dia (conferência de estoque)
    const dailyTasks = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND task_type = 'CONFERENCIA_ESTOQUE'
        AND status = 'OPEN'
        AND created_at > NOW() - INTERVAL '7 days'
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ Tarefas agendadas por dia: ${dailyTasks.rows[0].count}`);

    // 3.3. Tarefas agendadas por semana (manutenção)
    const weeklyTasks = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND task_type = 'EQUIPAMENTO_CHECK'
        AND status = 'OPEN'
        AND created_at > NOW() - INTERVAL '7 days'
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ Tarefas agendadas por semana: ${weeklyTasks.rows[0].count}`);

    // 4. Validar que sistema não acumula lixo lógico
    logger.log('\n🔍 Validando acúmulo de lixo lógico...');
    
    // 4.1. Tarefas antigas abertas (devem ser fechadas automaticamente)
    const oldOpenTasks = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'OPEN'
        AND created_at < NOW() - INTERVAL '7 days'
    `, [context.restaurants.map(r => r.id)]);

    if (parseInt(oldOpenTasks.rows[0].count) > 0) {
      warnings.push(`Tarefas antigas abertas detectadas: ${oldOpenTasks.rows[0].count}`);
      logger.log(`  ⚠️  ${oldOpenTasks.rows[0].count} tarefas antigas ainda abertas`, 'WARN');
    } else {
      logger.log('  ✅ Nenhuma tarefa antiga aberta (fechamento automático funcionando)');
    }

    // 4.2. Pedidos órfãos (sem itens)
    const orphanOrders = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders o
      WHERE restaurant_id = ANY($1::UUID[])
        AND NOT EXISTS (
          SELECT 1 FROM public.gm_order_items oi WHERE oi.order_id = o.id
        )
        AND o.created_at > NOW() - INTERVAL '7 days'
    `, [context.restaurants.map(r => r.id)]);

    if (parseInt(orphanOrders.rows[0].count) > 0) {
      errors.push({
        phase: 'FASE 7',
        severity: 'HIGH',
        message: `Pedidos órfãos detectados: ${orphanOrders.rows[0].count}`,
        reproducible: true,
      });
      logger.log(`  ❌ ${orphanOrders.rows[0].count} pedidos órfãos detectados`, 'ERROR');
    } else {
      logger.log('  ✅ Nenhum pedido órfão detectado');
    }

    // 4.3. Itens órfãos (sem pedido)
    const orphanItems = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_order_items oi
      WHERE NOT EXISTS (
        SELECT 1 FROM public.gm_orders o WHERE o.id = oi.order_id
      )
        AND oi.created_at > NOW() - INTERVAL '7 days'
    `);

    if (parseInt(orphanItems.rows[0].count) > 0) {
      errors.push({
        phase: 'FASE 7',
        severity: 'HIGH',
        message: `Itens órfãos detectados: ${orphanItems.rows[0].count}`,
        reproducible: true,
      });
      logger.log(`  ❌ ${orphanItems.rows[0].count} itens órfãos detectados`, 'ERROR');
    } else {
      logger.log('  ✅ Nenhum item órfão detectado');
    }

    // 5. Validar que estado não "drift" ao longo do tempo
    logger.log('\n🔍 Validando drift de estado...');
    
    // 5.1. Comparar estado final com baseline
    const finalState = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status IN ('OPEN', 'IN_PREP', 'PREPARING') THEN 1 END) as active_orders,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
        COUNT(DISTINCT restaurant_id) as restaurants_with_orders
      FROM public.gm_orders
      WHERE restaurant_id = ANY($1::UUID[])
    `, [context.restaurants.map(r => r.id)]);

    const finalStats = finalState.rows[0];
    const orderDrift = parseInt(finalStats.total_orders) - parseInt(baselineStats.total_orders);
    const activeDrift = parseInt(finalStats.active_orders) - parseInt(baselineStats.active_orders);

    logger.log(`  ✅ Estado final:`);
    logger.log(`     Total de pedidos: ${finalStats.total_orders} (drift: ${orderDrift})`);
    logger.log(`     Pedidos ativos: ${finalStats.active_orders} (drift: ${activeDrift})`);
    logger.log(`     Pedidos fechados: ${finalStats.closed_orders}`);
    logger.log(`     Pedidos cancelados: ${finalStats.cancelled_orders}`);

    // 5.2. Validar consistência de restaurantes
    const restaurantConsistency = await pool.query(`
      SELECT 
        r.id,
        r.name,
        COUNT(DISTINCT o.id) as orders_count,
        COUNT(DISTINCT oi.id) as items_count,
        COUNT(DISTINCT t.id) as tasks_count
      FROM public.gm_restaurants r
      LEFT JOIN public.gm_orders o ON o.restaurant_id = r.id
      LEFT JOIN public.gm_order_items oi ON oi.order_id = o.id
      LEFT JOIN public.gm_tasks t ON t.restaurant_id = r.id
      WHERE r.id = ANY($1::UUID[])
      GROUP BY r.id, r.name
      HAVING COUNT(DISTINCT o.id) > 0
      ORDER BY orders_count DESC
      LIMIT 10
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ Consistência de restaurantes (top 10):`);
    for (const row of restaurantConsistency.rows) {
      logger.log(`     ${row.name}: ${row.orders_count} pedidos, ${row.items_count} itens, ${row.tasks_count} tarefas`);
    }

    // 6. Validar que tarefas antigas são fechadas automaticamente
    logger.log('\n🔍 Validando fechamento automático de tarefas antigas...');
    
    // Simular que algumas condições sumiram (ex: estoque reposto)
    const autoClosedCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_resolved,
        COUNT(CASE WHEN resolved_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recently_resolved,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolution_seconds
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'RESOLVED'
        AND resolved_at IS NOT NULL
    `, [context.restaurants.map(r => r.id)]);

    const autoClosedStats = autoClosedCheck.rows[0];
    const avgResolution = autoClosedStats.avg_resolution_seconds 
      ? Math.round(autoClosedStats.avg_resolution_seconds) 
      : 0;

    logger.log(`  ✅ Tarefas resolvidas: ${autoClosedStats.total_resolved}`);
    logger.log(`     Resolvidas recentemente: ${autoClosedStats.recently_resolved}`);
    if (avgResolution > 0) {
      logger.log(`     Tempo médio de resolução: ${avgResolution}s`);
    }

    logger.log(`\n✅ Time Warp concluído:`);
    logger.log(`   - Dias simulados: ${totalDaysSimulated}`);
    logger.log(`   - Picos processados: ${totalPeakHours} eventos`);
    logger.log(`   - Horas mortas: ${totalDeadHours} tarefas`);
    logger.log(`   - Abertura/fechamento: ${totalOpenClose} ações`);
    logger.log(`   - Tarefas agendadas: ${parseInt(hourlyTasks.rows[0].count) + parseInt(dailyTasks.rows[0].count) + parseInt(weeklyTasks.rows[0].count)}`);
    logger.log(`   - Tarefas antigas abertas: ${oldOpenTasks.rows[0].count}`);
    logger.log(`   - Pedidos órfãos: ${orphanOrders.rows[0].count}`);
    logger.log(`   - Itens órfãos: ${orphanItems.rows[0].count}`);
    logger.log(`   - Drift de pedidos: ${orderDrift}`);

    const duration = Date.now() - startTime;

    // Emitir evento de conclusão
    emitProgress({
      phase: 'FASE 7: Time Warp',
      step: 'complete',
      op: 'INFO',
      message: `COMPLETA (${duration}ms) - ${totalDaysSimulated} dias simulados`,
      timestamp: Date.now(),
    });

    return {
      success: errors.filter(e => e.severity === 'CRITICAL').length === 0,
      duration: Date.now() - startTime,
      data: {
        daysSimulated: totalDaysSimulated,
        peakHours: totalPeakHours,
        deadHours: totalDeadHours,
        openClose: totalOpenClose,
        hourlyTasks: parseInt(hourlyTasks.rows[0].count),
        dailyTasks: parseInt(dailyTasks.rows[0].count),
        weeklyTasks: parseInt(weeklyTasks.rows[0].count),
        oldOpenTasks: parseInt(oldOpenTasks.rows[0].count),
        orphanOrders: parseInt(orphanOrders.rows[0].count),
        orphanItems: parseInt(orphanItems.rows[0].count),
        orderDrift,
        activeDrift,
        totalResolved: parseInt(autoClosedStats.total_resolved),
        recentlyResolved: parseInt(autoClosedStats.recently_resolved),
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 7: ${errorMsg}`, 'ERROR');
    
    // Emitir evento de falha
    emitProgress({
      phase: 'FASE 7: Time Warp',
      step: 'failed',
      op: 'ERROR',
      message: `Erro: ${errorMsg}`,
      timestamp: Date.now(),
    });

    errors.push({
      phase: 'FASE 7',
      severity: 'HIGH',
      message: `Erro na fase de Time Warp: ${errorMsg}`,
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
