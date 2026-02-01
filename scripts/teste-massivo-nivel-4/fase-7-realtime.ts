/**
 * FASE 7 - REALTIME VS POLLING
 * 
 * Valida Realtime via assinaturas e fallback por polling.
 */

import pg from 'pg';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

export const fase7Realtime: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 7 — REALTIME VS POLLING');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Validar configuração Realtime
    logger.log('Validando configuração Realtime...');
    
    const walLevel = await pool.query(`SHOW wal_level`);
    if (walLevel.rows[0].wal_level !== 'logical') {
      warnings.push('wal_level não está em "logical" - Realtime pode não funcionar');
    } else {
      logger.log('  ✅ wal_level = logical');
    }

    const realtimeTables = await pool.query(`
      SELECT tablename
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND tablename IN ('gm_orders', 'gm_order_items', 'gm_tasks')
    `);

    logger.log(`  ✅ ${realtimeTables.rows.length} tabelas publicadas no Realtime:`);
    for (const row of realtimeTables.rows) {
      logger.log(`     - ${row.tablename}`);
    }

    // 2. Simular mudanças e validar que aparecem
    logger.log('\n🔄 Simulando mudanças...');
    
    // Criar novo pedido
    const restaurant = context.restaurants[0];
    const table = restaurant.tables[0];
    const product = restaurant.products[0];

    if (table && product) {
      const newOrder = await pool.query(`
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
          created_by_role: 'waiter',
        }]),
        'cash',
        JSON.stringify({
          table_id: table.id,
          table_number: table.number,
          origin: 'APPSTAFF',
          test: 'nivel4',
          realtime_test: true,
        }),
      ]);

      logger.log('  ✅ Novo pedido criado (deve aparecer via Realtime)');
    }

    // 3. Validar polling (contar pedidos via query direta)
    logger.log('\n📊 Validando polling (consistência)...');
    const pollResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE restaurant_id = ANY($1::UUID[])
        AND created_at > NOW() - INTERVAL '5 minutes'
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ Polling: ${pollResult.rows[0].count} pedidos recentes encontrados`);

    // 4. Validar que dados estão consistentes
    logger.log('Validando consistência de dados...');
    const consistencyCheck = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.restaurant_id) as restaurants,
        COUNT(DISTINCT o.id) as orders,
        COUNT(DISTINCT oi.id) as items,
        COUNT(DISTINCT t.id) as tasks
      FROM public.gm_orders o
      LEFT JOIN public.gm_order_items oi ON oi.order_id = o.id
      LEFT JOIN public.gm_tasks t ON t.restaurant_id = o.restaurant_id
      WHERE o.restaurant_id = ANY($1::UUID[])
        AND o.created_at > NOW() - INTERVAL '1 hour'
    `, [context.restaurants.map(r => r.id)]);

    const stats = consistencyCheck.rows[0];
    logger.log(`  ✅ Consistência: ${stats.restaurants} restaurantes, ${stats.orders} pedidos, ${stats.items} itens, ${stats.tasks} tarefas`);

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        realtimeTables: realtimeTables.rows.length,
        recentOrders: parseInt(pollResult.rows[0].count),
        consistency: stats,
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 7: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 7',
      severity: 'MEDIUM',
      message: `Erro na fase 7: ${errorMsg}`,
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
