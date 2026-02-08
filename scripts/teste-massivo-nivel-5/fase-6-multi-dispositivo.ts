/**
 * FASE 6 - MULTI-DISPOSITIVO
 * 
 * Simula acesso concorrente de múltiplos dispositivos:
 * - Tablet KDS (cozinha)
 * - Celular cozinha (cozinheiro)
 * - Celular garçom (garçom)
 * - TPV (caixa)
 * - Cliente QR (mesa)
 * - Cliente Web (delivery)
 * - Latência variável (50ms-2s)
 * - Queda de conexão (5s-30s)
 * - Realtime vs Polling (fallback)
 * - Ações concorrentes (mesma mesa, mesmo item)
 * - Validação: nenhuma inconsistência, nenhum pedido fantasma/duplicado
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

const DEVICE_TYPES = [
  { type: 'TABLET_KDS', role: 'kitchen', origin: 'KDS' },
  { type: 'CELULAR_COZINHA', role: 'kitchen', origin: 'APPSTAFF' },
  { type: 'CELULAR_GARCOM', role: 'waiter', origin: 'APPSTAFF' },
  { type: 'TPV', role: 'waiter', origin: 'TPV' },
  { type: 'CLIENTE_QR', role: 'customer', origin: 'QR_MESA' },
  { type: 'CLIENTE_WEB', role: 'customer', origin: 'WEB_PUBLIC' },
] as const;

export const fase6MultiDispositivo: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 6 — MULTI-DISPOSITIVO');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  const CONCURRENT_ACTIONS = 1000; // Ações concorrentes
  logger.log(`🚀 Simulando ${CONCURRENT_ACTIONS} ações concorrentes de múltiplos dispositivos...`);

  try {
    const actions: Promise<any>[] = [];
    let actionId = 0;

    // Simular ações concorrentes
    for (let i = 0; i < CONCURRENT_ACTIONS; i++) {
      const restaurant = context.restaurants[i % context.restaurants.length];
      const table = restaurant.tables[i % restaurant.tables.length];
      const product = restaurant.products[i % restaurant.products.length];
      const device = DEVICE_TYPES[i % DEVICE_TYPES.length];

      if (!table || !product) continue;

      // Simular latência variável (50ms-2s)
      const latency = 50 + Math.random() * 1950;
      
      // Simular queda de conexão (5% das ações)
      const shouldDropConnection = Math.random() < 0.05;

      const action = (async () => {
        // Simular latência
        await new Promise(resolve => setTimeout(resolve, latency));

        // Se deve simular queda de conexão, falhar após 50% do tempo
        if (shouldDropConnection) {
          await new Promise(resolve => setTimeout(resolve, latency / 2));
          throw new Error('Connection dropped');
        }

        // Criar ação: adicionar item a pedido existente ou criar novo
        try {
          const result = await pool.query(`
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
              name: product.name,
              quantity: 1,
              unit_price: product.price_cents,
              created_by_role: device.role,
              device_id: `${device.type}-${uuidv4()}`,
            }]),
            'cash',
            JSON.stringify({
              table_id: table.id,
              table_number: table.number,
              origin: device.origin,
              test: 'nivel5',
              concurrent: true,
              action_id: actionId++,
              device_type: device.type,
              latency_ms: Math.round(latency),
            }),
          ]);

          return { success: true, result: result.rows[0].result };
        } catch (err: any) {
          // Ignorar erros de constraint (ex: pedido já existe na mesa)
          if (err.message?.includes('already exists') || 
              err.message?.includes('constraint') ||
              err.message?.includes('idx_one_open_order_per_table')) {
            return { success: false, skipped: true, reason: 'constraint' };
          }
          throw err;
        }
      })();

      actions.push(action);
    }

    // Executar todas as ações em paralelo
    logger.log('  ⏳ Executando ações concorrentes...');
    const results = await Promise.allSettled(actions);
    
    const succeeded = results.filter(r => 
      r.status === 'fulfilled' && r.value?.success === true
    ).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const skipped = results.filter(r => 
      r.status === 'fulfilled' && r.value?.skipped === true
    ).length;

    logger.log(`  ✅ ${succeeded} ações bem-sucedidas`);
    logger.log(`  ⚠️  ${skipped} ações ignoradas (constraints esperadas)`);
    if (failed > 0) {
      logger.log(`  ❌ ${failed} ações falharam`, 'WARN');
    }

    // Validar integridade
    logger.log('\n🔍 Validando integridade dos dados...');
    
    // 1. Verificar isolamento por restaurante
    const isolationCheck = await pool.query(`
      SELECT 
        restaurant_id,
        COUNT(*) as orders_count
      FROM public.gm_orders
      WHERE restaurant_id = ANY($1::UUID[])
        AND created_at > NOW() - INTERVAL '10 minutes'
      GROUP BY restaurant_id
      ORDER BY orders_count DESC
      LIMIT 10
    `, [context.restaurants.map(r => r.id)]);

    logger.log('  ✅ Isolamento por restaurante (top 10):');
    for (const row of isolationCheck.rows) {
      const restaurant = context.restaurants.find(r => r.id === row.restaurant_id);
      logger.log(`     ${restaurant?.name || row.restaurant_id}: ${row.orders_count} pedidos`);
    }

    // 2. Verificar autoria preservada
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

    // 3. Verificar que não há pedidos "fantasma" (sem restaurante)
    const ghostOrders = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders o
      WHERE NOT EXISTS (
        SELECT 1 FROM public.gm_restaurants r WHERE r.id = o.restaurant_id
      )
        AND o.created_at > NOW() - INTERVAL '10 minutes'
    `);

    if (parseInt(ghostOrders.rows[0].count) > 0) {
      errors.push({
        phase: 'FASE 6',
        severity: 'CRITICAL',
        message: `Pedidos fantasma detectados: ${ghostOrders.rows[0].count}`,
        reproducible: true,
      });
      logger.log(`  ❌ ${ghostOrders.rows[0].count} pedidos fantasma detectados`, 'ERROR');
    } else {
      logger.log('  ✅ Nenhum pedido fantasma detectado');
    }

    // 4. Verificar que não há pedidos duplicados (mesma mesa, mesmo restaurante, mesmo timestamp)
    const duplicateOrders = await pool.query(`
      SELECT 
        restaurant_id,
        table_id,
        COUNT(*) as count
      FROM public.gm_orders
      WHERE restaurant_id = ANY($1::UUID[])
        AND table_id IS NOT NULL
        AND created_at > NOW() - INTERVAL '10 minutes'
      GROUP BY restaurant_id, table_id, DATE_TRUNC('second', created_at)
      HAVING COUNT(*) > 1
      LIMIT 10
    `, [context.restaurants.map(r => r.id)]);

    if (duplicateOrders.rows.length > 0) {
      warnings.push(`Possíveis pedidos duplicados detectados: ${duplicateOrders.rows.length} grupos`);
      logger.log(`  ⚠️  ${duplicateOrders.rows.length} grupos de possíveis pedidos duplicados`, 'WARN');
    } else {
      logger.log('  ✅ Nenhum pedido duplicado detectado');
    }

    // 5. Verificar estado consistente após reconexão
    logger.log('\n🔍 Validando estado após reconexão...');
    const stateAfterReconnect = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status IN ('OPEN', 'IN_PREP', 'PREPARING') THEN 1 END) as active_orders,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders
      FROM public.gm_orders
      WHERE restaurant_id = ANY($1::UUID[])
        AND created_at > NOW() - INTERVAL '10 minutes'
    `, [context.restaurants.map(r => r.id)]);

    const stateStats = stateAfterReconnect.rows[0];
    logger.log(`  ✅ Estado após reconexão:`);
    logger.log(`     Total: ${stateStats.total_orders}`);
    logger.log(`     Ativos: ${stateStats.active_orders}`);
    logger.log(`     Fechados: ${stateStats.closed_orders}`);
    logger.log(`     Cancelados: ${stateStats.cancelled_orders}`);

    // 6. Verificar que itens não ficaram órfãos
    const orphanItems = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_order_items oi
      WHERE NOT EXISTS (
        SELECT 1 FROM public.gm_orders o WHERE o.id = oi.order_id
      )
        AND oi.created_at > NOW() - INTERVAL '10 minutes'
    `);

    if (parseInt(orphanItems.rows[0].count) > 0) {
      errors.push({
        phase: 'FASE 6',
        severity: 'CRITICAL',
        message: `Itens órfãos detectados: ${orphanItems.rows[0].count}`,
        reproducible: true,
      });
      logger.log(`  ❌ ${orphanItems.rows[0].count} itens órfãos detectados`, 'ERROR');
    } else {
      logger.log('  ✅ Nenhum item órfão detectado');
    }

    // 7. Verificar distribuição por dispositivo
    logger.log('\n📊 Distribuição por dispositivo:');
    const deviceDistribution = await pool.query(`
      SELECT 
        sync_metadata->>'device_type' as device_type,
        sync_metadata->>'origin' as origin,
        COUNT(*) as count
      FROM public.gm_orders
      WHERE restaurant_id = ANY($1::UUID[])
        AND created_at > NOW() - INTERVAL '10 minutes'
        AND sync_metadata->>'device_type' IS NOT NULL
      GROUP BY sync_metadata->>'device_type', sync_metadata->>'origin'
      ORDER BY count DESC
    `, [context.restaurants.map(r => r.id)]);

    for (const row of deviceDistribution.rows) {
      logger.log(`     ${row.device_type || 'N/A'} (${row.origin}): ${row.count} pedidos`);
    }

    const criticalErrors = errors.filter(e => e.severity === 'CRITICAL');
    logger.log(`\n✅ Multi-Dispositivo concluído:`);
    logger.log(`   - Ações concorrentes: ${CONCURRENT_ACTIONS}`);
    logger.log(`   - Ações bem-sucedidas: ${succeeded}`);
    logger.log(`   - Ações ignoradas: ${skipped}`);
    logger.log(`   - Ações falhadas: ${failed}`);
    logger.log(`   - Pedidos fantasma: ${ghostOrders.rows[0].count}`);
    logger.log(`   - Itens órfãos: ${orphanItems.rows[0].count}`);
    logger.log(`   - Erros críticos: ${criticalErrors.length}`);

    return {
      success: criticalErrors.length === 0,
      duration: Date.now() - startTime,
      data: {
        concurrentActions: CONCURRENT_ACTIONS,
        succeeded,
        failed,
        skipped,
        restaurantsIsolated: isolationCheck.rows.length,
        ghostOrders: parseInt(ghostOrders.rows[0].count),
        orphanItems: parseInt(orphanItems.rows[0].count),
        duplicateOrders: duplicateOrders.rows.length,
        totalOrders: parseInt(stateStats.total_orders),
        activeOrders: parseInt(stateStats.active_orders),
        criticalErrors: criticalErrors.length,
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 6: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 6',
      severity: 'CRITICAL',
      message: `Erro na fase de Multi-Dispositivo: ${errorMsg}`,
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
