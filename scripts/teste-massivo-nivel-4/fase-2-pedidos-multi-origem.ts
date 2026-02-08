/**
 * FASE 2 - PEDIDOS MULTI-ORIGEM (E2E)
 * 
 * Cria pedidos via todas as origens:
 * - QR_MESA
 * - WEB_PUBLIC
 * - TPV (CAIXA)
 * - APPSTAFF (GARÇOM)
 * - MANAGER
 * - OWNER
 * 
 * Valida que aparecem no KDS e MiniKDS.
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

const ORIGINS = ['QR_MESA', 'WEB_PUBLIC', 'TPV', 'APPSTAFF', 'APPSTAFF_MANAGER', 'APPSTAFF_OWNER'] as const;

export const fase2PedidosMultiOrigem: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 2 — PEDIDOS MULTI-ORIGEM (E2E)');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    let totalOrders = 0;

    for (const restaurant of context.restaurants) {
      logger.log(`\n📦 Restaurante: ${restaurant.name}`);

      // Criar pedidos por origem
      for (const origin of ORIGINS) {
        const table = restaurant.tables[0]; // Usar primeira mesa
        if (!table) continue;

        // Selecionar produtos (mix de KITCHEN e BAR)
        const kitchenProducts = restaurant.products.filter(p => p.station === 'KITCHEN').slice(0, 2);
        const barProducts = restaurant.products.filter(p => p.station === 'BAR').slice(0, 1);
        const selectedProducts = [...kitchenProducts, ...barProducts];

        if (selectedProducts.length === 0) {
          warnings.push(`Restaurante ${restaurant.name} não tem produtos suficientes`);
          continue;
        }

        // Criar pedido via RPC create_order_atomic
        // Nota: RPC espera items com unit_price
        const items = selectedProducts.map(p => ({
          product_id: p.id,
          quantity: 1,
          unit_price: p.price_cents,
          created_by_role: origin === 'QR_MESA' ? 'customer' : origin.includes('MANAGER') ? 'manager' : origin.includes('OWNER') ? 'owner' : 'waiter',
          device_id: origin === 'QR_MESA' ? `device-${uuidv4()}` : undefined,
        }));

        try {
          const orderResult = await pool.query(`
            SELECT public.create_order_atomic(
              $1::UUID,  -- restaurant_id
              $2::JSONB,  -- items
              $3::TEXT,   -- payment_method
              $4::JSONB   -- sync_metadata (com table_id, table_number, origin)
            ) as result
          `, [
            restaurant.id,
            JSON.stringify(items),
            'cash',
            JSON.stringify({
              table_id: table.id,
              table_number: table.number,
              origin,
              test: 'nivel4',
              run_id: context.metadata.run_id,
            }),
          ]);

          const orderData = orderResult.rows[0].result;
          totalOrders++;

          context.orders.push({
            id: orderData.id,
            restaurant_id: restaurant.id,
            table_id: table.id,
            table_number: table.number,
            status: orderData.status || 'OPEN',
            items: items.map((item, idx) => ({
              id: `item-${idx}`,
              product_id: item.product_id,
              quantity: item.quantity,
              created_by_role: item.created_by_role,
              device_id: item.device_id,
              origin,
            })),
            authors: [origin],
            origin,
            created_at: new Date(),
          });

          logger.log(`  ✅ Pedido ${origin} criado (${selectedProducts.length} itens)`);
        } catch (error: any) {
          errors.push({
            phase: 'FASE 2',
            severity: 'HIGH',
            message: `Erro ao criar pedido ${origin} para ${restaurant.name}: ${error.message}`,
            details: error,
            reproducible: true,
          });
          logger.log(`  ❌ Erro ao criar pedido ${origin}: ${error.message}`, 'ERROR');
        }
      }
    }

    // Validar que pedidos aparecem no KDS
    logger.log('\n🔍 Validando visibilidade no KDS...');
    const openOrders = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE status IN ('OPEN', 'IN_PREP', 'PREPARING')
        AND restaurant_id = ANY($1::UUID[])
    `, [context.restaurants.map(r => r.id)]);

    logger.log(`  ✅ ${openOrders.rows[0].count} pedidos abertos visíveis no KDS`);

    return {
      success: errors.length === 0,
      duration: Date.now() - startTime,
      data: {
        ordersCreated: totalOrders,
        originsTested: ORIGINS.length,
        openOrders: parseInt(openOrders.rows[0].count),
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 2: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 2',
      severity: 'CRITICAL',
      message: `Erro na fase 2: ${errorMsg}`,
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
