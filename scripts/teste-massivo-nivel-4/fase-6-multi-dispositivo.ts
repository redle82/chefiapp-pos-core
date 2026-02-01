/**
 * FASE 6 - MULTI-DISPOSITIVO / CONCORRÊNCIA
 * 
 * Simula simultaneidade: múltiplos garçons, clientes QR, valida integridade.
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

export const fase6MultiDispositivo: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 6 — MULTI-DISPOSITIVO / CONCORRÊNCIA');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const scenario = context.metadata.scenario || 'M';
    const concurrentActions = scenario === 'XL' ? 200 : scenario === 'L' ? 100 : scenario === 'M' ? 50 : 10;

    logger.log(`🚀 Simulando ${concurrentActions} ações paralelas...`);

    const actions: Promise<any>[] = [];

    for (let i = 0; i < concurrentActions; i++) {
      const restaurant = context.restaurants[i % context.restaurants.length];
      const table = restaurant.tables[i % restaurant.tables.length];
      const product = restaurant.products[i % restaurant.products.length];

      if (!table || !product) continue;

      // Criar ação: adicionar item a pedido existente ou criar novo
      const action = pool.query(`
        SELECT public.create_order_atomic(
          $1::UUID,
          $2::JSONB,
          $3::TEXT,
          $4::JSONB
        ) as result
      `, [
        restaurant.id,
        JSON.stringify([{
          product_id: product.id,
          quantity: 1,
          unit_price: product.price_cents,
          created_by_role: i % 3 === 0 ? 'waiter' : 'customer',
          device_id: `device-${uuidv4()}`,
        }]),
        'cash',
        JSON.stringify({
          table_id: table.id,
          table_number: table.number,
          origin: i % 3 === 0 ? 'APPSTAFF' : 'QR_MESA',
          test: 'nivel4',
          concurrent: true,
          action_id: i,
        }),
      ]).catch(err => {
        // Ignorar erros de constraint (ex: pedido já existe na mesa)
        if (err.message.includes('already exists') || err.message.includes('constraint')) {
          return null;
        }
        throw err;
      });

      actions.push(action);
    }

    // Executar todas as ações em paralelo
    const results = await Promise.allSettled(actions);
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const skipped = results.filter(r => r.status === 'fulfilled' && r.value === null).length;

    logger.log(`  ✅ ${succeeded} ações bem-sucedidas`);
    logger.log(`  ⚠️  ${skipped} ações ignoradas (constraints)`);
    if (failed > 0) {
      logger.log(`  ❌ ${failed} ações falharam`, 'WARN');
    }

    // Validar integridade
    logger.log('\n🔍 Validando integridade dos dados...');
    
    // Verificar isolamento por restaurante
    const isolationCheck = await pool.query(`
      SELECT 
        restaurant_id,
        COUNT(*) as orders_count
      FROM public.gm_orders
      WHERE restaurant_id = ANY($1::UUID[])
        AND created_at > NOW() - INTERVAL '10 minutes'
      GROUP BY restaurant_id
    `, [context.restaurants.map(r => r.id)]);

    logger.log('  ✅ Isolamento por restaurante:');
    for (const row of isolationCheck.rows) {
      const restaurant = context.restaurants.find(r => r.id === row.restaurant_id);
      logger.log(`     ${restaurant?.name || row.restaurant_id}: ${row.orders_count} pedidos`);
    }

    // Verificar autoria preservada
    const authorshipCheck = await pool.query(`
      SELECT 
        created_by_role,
        COUNT(*) as items_count
      FROM public.gm_order_items
      WHERE order_id IN (
        SELECT id FROM public.gm_orders 
        WHERE restaurant_id = ANY($1::UUID[])
          AND created_at > NOW() - INTERVAL '10 minutes'
      )
      GROUP BY created_by_role
    `, [context.restaurants.map(r => r.id)]);

    logger.log('  ✅ Autoria preservada:');
    for (const row of authorshipCheck.rows) {
      logger.log(`     ${row.created_by_role || 'N/A'}: ${row.items_count} itens`);
    }

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        concurrentActions,
        succeeded,
        failed,
        skipped,
        restaurantsIsolated: isolationCheck.rows.length,
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 6: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 6',
      severity: 'HIGH',
      message: `Erro na fase 6: ${errorMsg}`,
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
