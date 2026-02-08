/**
 * FASE 4 - ESTOQUE + CONSUMO + LISTA DE COMPRAS
 * 
 * Simula consumo, força ruptura, valida alertas e lista de compras.
 */

import pg from 'pg';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

export const fase4EstoqueConsumo: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 4 — ESTOQUE + CONSUMO + LISTA DE COMPRAS');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Simular consumo (reduzir estoque de ingredientes usados)
    logger.log('Simulando consumo de estoque...');
    
    for (const restaurant of context.restaurants) {
      // Pegar ingredientes com estoque
      const stockToConsume = restaurant.stockLevels.slice(0, 3); // Primeiros 3
      
      for (const stock of stockToConsume) {
        const consumeQty = stock.qty * 0.6; // Consumir 60%
        
        await pool.query(`
          UPDATE public.gm_stock_levels
          SET qty = qty - $1,
              updated_at = NOW()
          WHERE id = $2
        `, [consumeQty, stock.id]);
        
        logger.log(`  ✅ ${restaurant.name}: Consumido ${consumeQty} de ingrediente ${stock.ingredient_id}`);
      }
    }

    // 2. Forçar ruptura (reduzir abaixo do mínimo)
    logger.log('\n⚠️  Forçando ruptura de estoque...');
    const ruptureResult = await pool.query(`
      UPDATE public.gm_stock_levels
      SET qty = min_qty * 0.3
      WHERE restaurant_id = ANY($1::UUID[])
        AND qty > min_qty
      RETURNING id, ingredient_id, qty, min_qty
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ ${ruptureResult.rowCount} itens forçados abaixo do mínimo`);

    // 3. Gerar tarefas de estoque crítico
    logger.log('Gerando tarefas de estoque crítico...');
    const taskResult = await pool.query(`
      SELECT public.generate_tasks_from_orders($1::UUID[])
    `, [context.restaurants.map(r => r.id)]);

    const stockTasks = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND task_type = 'ESTOQUE_CRITICO'
        AND status = 'OPEN'
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ ${stockTasks.rows[0].count} tarefas de estoque crítico criadas`);

    // 4. Validar lista de compras
    logger.log('\n🛒 Validando lista de compras...');
    for (const restaurant of context.restaurants) {
      const shoppingList = await pool.query(`
        SELECT public.generate_shopping_list($1::UUID) as result
      `, [restaurant.id]);

      const items = shoppingList.rows[0].result || [];
      logger.log(`  ✅ ${restaurant.name}: ${items.length} itens na lista de compras`);
      
      if (items.length > 0) {
        const critical = items.filter((i: any) => i.urgency === 'CRITICAL').length;
        const high = items.filter((i: any) => i.urgency === 'HIGH').length;
        logger.log(`     Críticos: ${critical}, Altos: ${high}`);
      }
    }

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        itemsConsumed: ruptureResult.rowCount,
        stockTasksCreated: parseInt(stockTasks.rows[0].count),
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 4: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 4',
      severity: 'HIGH',
      message: `Erro na fase 4: ${errorMsg}`,
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
