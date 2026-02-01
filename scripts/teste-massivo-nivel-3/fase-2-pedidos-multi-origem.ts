/**
 * FASE 2 - PEDIDOS MULTI-ORIGEM
 * 
 * Cria pedidos com múltiplos autores para validar:
 * - Constraint 1 pedido por mesa
 * - Divisão de conta (autoria preservada)
 * - Múltiplas origens (QR_MESA, WEB, APPSTAFF, MANAGER, TPV)
 * 
 * Para CADA restaurante:
 * - Mesa 1: Cliente A (QR) + Cliente B (QR) + Garçom + Gerente
 * - Mesa 2: Cliente Web + Garçom
 * - Mesa 3: TPV direto
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { PhaseFunction, PhaseResult, TestContext, OrderData, OrderItemData } from './types';
import type { TestLogger } from './types';

export const fase2PedidosMultiOrigem: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 2 — PEDIDOS MULTI-ORIGEM (T0)');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    for (const restaurant of context.restaurants) {
      logger.log(`\n📦 Criando pedidos para ${restaurant.name}...`);

      // Mesa 1: Cliente A (QR) + Cliente B (QR) + Garçom + Gerente
      const table1 = restaurant.tables[0];
      const order1 = await criarPedidoMultiAutor(
        pool,
        restaurant.id,
        table1.id,
        table1.number,
        [
          {
            role: 'QR_MESA',
            deviceId: `device-qr-a-${restaurant.slug}`,
            products: [restaurant.products[0], restaurant.products[4]], // Hambúrguer + Mojito
          },
          {
            role: 'QR_MESA',
            deviceId: `device-qr-b-${restaurant.slug}`,
            products: [restaurant.products[1], restaurant.products[5]], // Pizza + Caipirinha
          },
          {
            role: 'waiter',
            userId: uuidv4(),
            products: [restaurant.products[2]], // Salada
          },
          {
            role: 'manager',
            userId: uuidv4(),
            products: [restaurant.products[3]], // Nachos
          },
        ],
        'QR_MESA',
        logger
      );
      context.orders.push(order1);
      logger.log(`  ✅ Mesa ${table1.number}: Pedido com 4 autores criado (${order1.items.length} itens)`);

      // Mesa 2: Cliente Web + Garçom
      const table2 = restaurant.tables[1];
      const order2 = await criarPedidoMultiAutor(
        pool,
        restaurant.id,
        table2.id,
        table2.number,
        [
          {
            role: 'WEB',
            deviceId: `device-web-${restaurant.slug}`,
            products: [restaurant.products[0], restaurant.products[6]], // Hambúrguer + Cerveja
          },
          {
            role: 'waiter',
            userId: uuidv4(),
            products: [restaurant.products[7]], // Água
          },
        ],
        'WEB',
        logger
      );
      context.orders.push(order2);
      logger.log(`  ✅ Mesa ${table2.number}: Pedido Web + Garçom criado (${order2.items.length} itens)`);

      // Mesa 3: TPV direto
      const table3 = restaurant.tables[2];
      const order3 = await criarPedidoMultiAutor(
        pool,
        restaurant.id,
        table3.id,
        table3.number,
        [
          {
            role: 'TPV',
            userId: uuidv4(),
            products: [restaurant.products[0], restaurant.products[1], restaurant.products[8]], // Hambúrguer + Pizza + Refrigerante
          },
        ],
        'TPV',
        logger
      );
      context.orders.push(order3);
      logger.log(`  ✅ Mesa ${table3.number}: Pedido TPV criado (${order3.items.length} itens)`);

      // Validar constraint 1 pedido por mesa
      const openOrders = await pool.query(`
        SELECT COUNT(*) as count FROM public.gm_orders
        WHERE restaurant_id = $1 AND table_id = $2 AND status = 'OPEN'
      `, [restaurant.id, table1.id]);
      
      if (parseInt(openOrders.rows[0].count) !== 1) {
        errors.push({
          phase: 'FASE 2',
          severity: 'CRITICAL',
          message: `Violação de constraint: Mesa ${table1.number} (${restaurant.name}) tem ${openOrders.rows[0].count} pedidos abertos`,
          reproducible: true,
        });
        logger.log(`  ❌ ERRO: Mesa ${table1.number} tem múltiplos pedidos abertos!`, 'ERROR');
      } else {
        logger.log(`  ✅ Constraint validada: 1 pedido por mesa`);
      }

      // Validar autoria preservada
      const authorshipCheck = await pool.query(`
        SELECT 
          created_by_role,
          COUNT(*) as count,
          COUNT(DISTINCT device_id) as devices,
          COUNT(DISTINCT created_by_user_id) as users
        FROM public.gm_order_items
        WHERE order_id = $1
        GROUP BY created_by_role
      `, [order1.id]);

      const expectedRoles = ['QR_MESA', 'waiter', 'manager'];
      const foundRoles = authorshipCheck.rows.map((r: any) => r.created_by_role);
      const missingRoles = expectedRoles.filter(r => !foundRoles.includes(r));

      if (missingRoles.length > 0) {
        warnings.push(`Mesa ${table1.number}: Roles faltando: ${missingRoles.join(', ')}`);
        logger.log(`  ⚠️  Aviso: Alguns roles não encontrados`, 'WARN');
      } else {
        logger.log(`  ✅ Autoria preservada: ${authorshipCheck.rows.length} roles distintos`);
      }
    }

    logger.log(`\n✅ ${context.orders.length} pedidos criados com sucesso`);

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        ordersCreated: context.orders.length,
        totalItems: context.orders.reduce((sum, o) => sum + o.items.length, 0),
        uniqueAuthors: new Set(context.orders.flatMap(o => o.authors)).size,
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na criação de pedidos: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 2',
      severity: 'CRITICAL',
      message: `Erro na criação de pedidos: ${errorMsg}`,
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

async function criarPedidoMultiAutor(
  pool: pg.Pool,
  restaurantId: string,
  tableId: string,
  tableNumber: number,
  authors: Array<{
    role: string;
    deviceId?: string;
    userId?: string;
    products: any[];
  }>,
  origin: string,
  logger: TestLogger
): Promise<OrderData> {
  // Preparar items para create_order_atomic
  const items: any[] = [];
  const allItemData: OrderItemData[] = [];

  for (const author of authors) {
    for (const product of author.products) {
      const item = {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit_price: product.price_cents || 0,
        created_by_role: author.role,
        created_by_user_id: author.userId || null,
        device_id: author.deviceId || null,
      };
      items.push(item);

      allItemData.push({
        id: uuidv4(), // Será substituído pelo ID real após inserção
        product_id: product.id,
        quantity: 1,
        created_by_role: author.role,
        created_by_user_id: author.userId,
        device_id: author.deviceId,
      });
    }
  }

  // Criar pedido via RPC create_order_atomic
  const syncMetadata = {
    table_id: tableId,
    table_number: tableNumber,
    origin: origin,
  };

  const result = await pool.query(`
    SELECT public.create_order_atomic($1, $2::jsonb, 'cash', $3::jsonb) as order_data
  `, [restaurantId, JSON.stringify(items), JSON.stringify(syncMetadata)]);

  const orderData = result.rows[0].order_data;
  const orderId = orderData.id;

  // Buscar itens criados para validar
  const itemsResult = await pool.query(`
    SELECT id, product_id, created_by_role, created_by_user_id, device_id
    FROM public.gm_order_items
    WHERE order_id = $1
    ORDER BY created_at
  `, [orderId]);

  // Atualizar IDs reais nos items
  itemsResult.rows.forEach((row: any, index: number) => {
    if (allItemData[index]) {
      allItemData[index].id = row.id;
    }
  });

  return {
    id: orderId,
    restaurant_id: restaurantId,
    table_id: tableId,
    table_number: tableNumber,
    status: 'OPEN',
    items: allItemData,
    authors: authors.map(a => a.role),
    origin,
  };
}
