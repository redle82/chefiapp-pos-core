/**
 * FASE 0 - LIMPEZA
 * 
 * Fecha pedidos abertos, limpa tarefas de teste, reseta estoque.
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

const RESULTS_DIR = path.join(process.cwd(), 'test-results');

export const fase0Limpeza: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 0 — LIMPEZA');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Fechar todos os pedidos abertos antigos
    logger.log('Fechando pedidos abertos antigos...');
    const closeResult = await pool.query(`
      UPDATE public.gm_orders
      SET status = 'CLOSED', updated_at = NOW()
      WHERE status IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY')
    `);
    logger.log(`✅ ${closeResult.rowCount} pedidos fechados`);

    // 2. Limpar tarefas abertas de testes anteriores
    logger.log('Limpando tarefas abertas de testes anteriores...');
    const taskResult = await pool.query(`
      UPDATE public.gm_tasks
      SET status = 'DISMISSED', updated_at = NOW()
      WHERE status = 'OPEN' AND auto_generated = true
        AND created_at < NOW() - INTERVAL '1 hour'
    `);
    logger.log(`✅ ${taskResult.rowCount} tarefas dispensadas`);

    // 3. Limpar restaurantes de teste anteriores (Alpha, Beta, Gamma, Delta)
    // Deletar em cascata: pedidos -> itens -> produtos -> restaurantes
    logger.log('Limpando restaurantes de teste anteriores...');
    
    // Primeiro, fechar e deletar pedidos dos restaurantes de teste
    const deleteOrders = await pool.query(`
      DELETE FROM public.gm_orders
      WHERE restaurant_id IN (
        SELECT id FROM public.gm_restaurants WHERE slug IN ('alpha', 'beta', 'gamma', 'delta')
      )
    `);
    logger.log(`  ✅ ${deleteOrders.rowCount} pedidos removidos`);
    
    // Depois deletar restaurantes (cascata vai limpar o resto)
    const deleteRestaurants = await pool.query(`
      DELETE FROM public.gm_restaurants
      WHERE slug IN ('alpha', 'beta', 'gamma', 'delta')
    `);
    logger.log(`✅ ${deleteRestaurants.rowCount} restaurantes de teste removidos`);

    // 4. Verificar estoque existente
    logger.log('Verificando estoque existente...');
    const stockResult = await pool.query(`
      SELECT COUNT(*) as count FROM public.gm_stock_levels
    `);
    logger.log(`ℹ️  ${stockResult.rows[0].count} níveis de estoque encontrados (serão resetados na Fase 1)`);

    // 4. Gerar log de reset
    const resetLog = {
      timestamp: new Date().toISOString(),
      ordersClosed: closeResult.rowCount,
      tasksDismissed: taskResult.rowCount,
      restaurantsDeleted: deleteRestaurants.rowCount,
      stockLevelsFound: parseInt(stockResult.rows[0].count),
    };
    
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'RESET_LOG.md'),
      `# Reset Log - ${new Date().toISOString()}\n\n` +
      `## Resultados\n\n` +
      `- Pedidos fechados: ${resetLog.ordersClosed}\n` +
      `- Tarefas dispensadas: ${resetLog.tasksDismissed}\n` +
      `- Restaurantes de teste removidos: ${resetLog.restaurantsDeleted}\n` +
      `- Níveis de estoque encontrados: ${resetLog.stockLevelsFound}\n\n` +
      `## Status\n\n✅ Banco limpo e pronto para teste massivo.\n`
    );

    logger.log('✅ Limpeza concluída');

    return {
      success: true,
      duration: Date.now() - startTime,
      data: resetLog,
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na limpeza: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 0',
      severity: 'CRITICAL',
      message: `Erro na limpeza: ${errorMsg}`,
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
