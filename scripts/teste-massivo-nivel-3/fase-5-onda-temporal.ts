/**
 * FASE 5 - ONDA TEMPORAL
 * 
 * Simula mudanças ao longo do tempo:
 * - T+5 minutos: Adicionar itens aos pedidos existentes, criar novos pedidos
 * - T+15 minutos: Entregar parcialmente pedidos, marcar itens READY/DELIVERED
 * - T+30 minutos: Fechar pedidos, verificar tarefas remanescentes, verificar estoque final
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

export const fase5OndaTemporal: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 5 — ONDA TEMPORAL');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // T+5 minutos: Adicionar itens aos pedidos existentes
    logger.log('\n⏱️  T+5 minutos: Adicionando itens aos pedidos existentes...');
    
    const ordersToUpdate = context.orders.slice(0, 4); // Primeiros 4 pedidos
    let itemsAdded = 0;

    for (const order of ordersToUpdate) {
      const restaurant = context.restaurants.find(r => r.id === order.restaurant_id);
      if (!restaurant) continue;

      // Pegar um produto aleatório do restaurante
      const randomProduct = restaurant.products[Math.floor(Math.random() * restaurant.products.length)];
      
      // Adicionar item ao pedido via create_order_atomic não funciona para adicionar itens
      // Vamos inserir diretamente (simulando adição de item)
      const newItemId = uuidv4();
      await pool.query(`
        INSERT INTO public.gm_order_items (
          id, order_id, product_id, name_snapshot, price_snapshot,
          quantity, subtotal_cents, station, prep_time_seconds, prep_category,
          created_by_role, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '5 minutes')
      `, [
        newItemId,
        order.id,
        randomProduct.id,
        randomProduct.name,
        randomProduct.price_cents || 0,
        1,
        randomProduct.price_cents || 0,
        randomProduct.station,
        randomProduct.prep_time_seconds,
        randomProduct.station === 'BAR' ? 'drink' : 'main',
        'waiter',
      ]);

      // Atualizar total do pedido
      await pool.query(`
        UPDATE public.gm_orders
        SET total_cents = total_cents + $1,
            subtotal_cents = subtotal_cents + $1,
            updated_at = NOW()
        WHERE id = $2
      `, [randomProduct.price_cents || 0, order.id]);

      itemsAdded++;
    }
    logger.log(`  ✅ ${itemsAdded} itens adicionados aos pedidos existentes`);

    // Criar novos pedidos em mesas diferentes
    logger.log('Criando novos pedidos em mesas diferentes...');
    
    let newOrdersCreated = 0;
    for (const restaurant of context.restaurants) {
      // Usar mesa 4 (se existir) ou próxima disponível
      const availableTable = restaurant.tables.find(t => t.number === 4) || restaurant.tables[3];
      if (!availableTable) continue;

      // Verificar se já existe pedido aberto nesta mesa
      const existingOrder = await pool.query(`
        SELECT id FROM public.gm_orders
        WHERE restaurant_id = $1 AND table_id = $2 AND status = 'OPEN'
      `, [restaurant.id, availableTable.id]);

      if (existingOrder.rows.length > 0) {
        continue; // Mesa já tem pedido aberto
      }

      // Criar novo pedido
      const newProduct = restaurant.products[0];
      const newOrderId = uuidv4();
      const newItemId = uuidv4();

      await pool.query(`
        INSERT INTO public.gm_orders (
          id, restaurant_id, table_id, table_number, status, payment_status,
          total_cents, subtotal_cents, origin, created_at
        )
        VALUES ($1, $2, $3, $4, 'OPEN', 'PENDING', $5, $5, 'TPV', NOW() - INTERVAL '5 minutes')
      `, [
        newOrderId,
        restaurant.id,
        availableTable.id,
        availableTable.number,
        newProduct.price_cents || 0,
      ]);

      await pool.query(`
        INSERT INTO public.gm_order_items (
          id, order_id, product_id, name_snapshot, price_snapshot,
          quantity, subtotal_cents, station, prep_time_seconds, prep_category,
          created_by_role, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '5 minutes')
      `, [
        newItemId,
        newOrderId,
        newProduct.id,
        newProduct.name,
        newProduct.price_cents || 0,
        1,
        newProduct.price_cents || 0,
        newProduct.station,
        newProduct.prep_time_seconds,
        newProduct.station === 'BAR' ? 'drink' : 'main',
        'TPV',
      ]);

      context.orders.push({
        id: newOrderId,
        restaurant_id: restaurant.id,
        table_id: availableTable.id,
        table_number: availableTable.number,
        status: 'OPEN',
        items: [{
          id: newItemId,
          product_id: newProduct.id,
          quantity: 1,
          created_by_role: 'TPV',
        }],
        authors: ['TPV'],
        origin: 'TPV',
      });

      newOrdersCreated++;
    }
    logger.log(`  ✅ ${newOrdersCreated} novos pedidos criados`);

    // T+15 minutos: Entregar parcialmente pedidos
    logger.log('\n⏱️  T+15 minutos: Entregando parcialmente pedidos...');
    
    // Marcar alguns itens como prontos (simulando entrega parcial)
    const itemsToMarkReady = await pool.query(`
      SELECT oi.id, oi.order_id, o.restaurant_id
      FROM public.gm_order_items oi
      JOIN public.gm_orders o ON o.id = oi.order_id
      WHERE o.status = 'OPEN'
        AND oi.ready_at IS NULL
      LIMIT 8
    `);

    for (const item of itemsToMarkReady.rows) {
      await pool.query(`
        UPDATE public.gm_order_items
        SET ready_at = NOW() - INTERVAL '15 minutes'
        WHERE id = $1
      `, [item.id]);
    }
    logger.log(`  ✅ ${itemsToMarkReady.rows.length} itens marcados como prontos (simulando T+15)`);

    // Marcar alguns pedidos como READY (todos os itens prontos)
    const ordersToMarkReady = await pool.query(`
      SELECT o.id, o.restaurant_id
      FROM public.gm_orders o
      WHERE o.status = 'OPEN'
        AND NOT EXISTS (
          SELECT 1 FROM public.gm_order_items oi
          WHERE oi.order_id = o.id AND oi.ready_at IS NULL
        )
      LIMIT 2
    `);

    for (const order of ordersToMarkReady.rows) {
      await pool.query(`
        UPDATE public.gm_orders
        SET status = 'READY',
            ready_at = NOW() - INTERVAL '15 minutes',
            updated_at = NOW()
        WHERE id = $1
      `, [order.id]);
    }
    logger.log(`  ✅ ${ordersToMarkReady.rows.length} pedidos marcados como READY (simulando T+15)`);

    // T+30 minutos: Fechar pedidos
    logger.log('\n⏱️  T+30 minutos: Fechando pedidos...');
    
    const ordersToClose = await pool.query(`
      SELECT id, restaurant_id
      FROM public.gm_orders
      WHERE status = 'READY'
      LIMIT 3
    `);

    for (const order of ordersToClose.rows) {
      await pool.query(`
        UPDATE public.gm_orders
        SET status = 'CLOSED',
            payment_status = 'PAID',
            updated_at = NOW()
        WHERE id = $1
      `, [order.id]);
    }
    logger.log(`  ✅ ${ordersToClose.rows.length} pedidos fechados (simulando T+30)`);

    // Verificar tarefas remanescentes
    logger.log('Verificando tarefas remanescentes...');
    
    const remainingTasks = await pool.query(`
      SELECT COUNT(*) as count, task_type, priority
      FROM public.gm_tasks
      WHERE status = 'OPEN'
      GROUP BY task_type, priority
      ORDER BY priority DESC
    `);

    logger.log(`  📊 Tarefas abertas por tipo e prioridade:`);
    for (const task of remainingTasks.rows) {
      logger.log(`    ${task.task_type} (${task.priority}): ${task.count}`);
    }

    // Verificar estoque final
    logger.log('Verificando estoque final...');
    
    const finalStock = await pool.query(`
      SELECT 
        i.name,
        SUM(sl.qty) as total_qty,
        SUM(sl.min_qty) as total_min,
        COUNT(CASE WHEN sl.qty <= sl.min_qty THEN 1 END) as below_min_count
      FROM public.gm_stock_levels sl
      JOIN public.gm_ingredients i ON i.id = sl.ingredient_id
      WHERE sl.restaurant_id IN (SELECT id FROM public.gm_restaurants WHERE slug IN ('alpha', 'beta', 'gamma', 'delta'))
      GROUP BY i.name
      ORDER BY below_min_count DESC, total_qty ASC
    `);

    logger.log(`  📊 Estoque final (top 5):`);
    for (const stock of finalStock.rows.slice(0, 5)) {
      const isLow = parseInt(stock.below_min_count) > 0;
      logger.log(`    ${stock.name}: ${stock.total_qty} (mín: ${stock.total_min}) ${isLow ? '⚠️ BAIXO' : '✅'}`);
    }

    // Validar consistência temporal
    logger.log('Validando consistência temporal...');
    
    const temporalCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_orders,
        COUNT(CASE WHEN status = 'READY' THEN 1 END) as ready_orders,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_orders,
        COUNT(CASE WHEN created_at < NOW() - INTERVAL '30 minutes' AND status != 'CLOSED' THEN 1 END) as old_open_orders
      FROM public.gm_orders
      WHERE restaurant_id IN (SELECT id FROM public.gm_restaurants WHERE slug IN ('alpha', 'beta', 'gamma', 'delta'))
    `);

    const stats = temporalCheck.rows[0];
    logger.log(`  📊 Status final dos pedidos:`);
    logger.log(`    Total: ${stats.total_orders}`);
    logger.log(`    Abertos: ${stats.open_orders}`);
    logger.log(`    Prontos: ${stats.ready_orders}`);
    logger.log(`    Fechados: ${stats.closed_orders}`);

    if (parseInt(stats.old_open_orders) > 0) {
      warnings.push(`${stats.old_open_orders} pedidos abertos há mais de 30 minutos (pode indicar problema)`);
      logger.log(`  ⚠️  Aviso: ${stats.old_open_orders} pedidos abertos há mais de 30 minutos`, 'WARN');
    }

    logger.log(`\n✅ Onda temporal simulada com sucesso`);

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        itemsAdded,
        newOrdersCreated,
        itemsMarkedReady: itemsToMarkReady.rows.length,
        ordersMarkedReady: ordersToMarkReady.rows.length,
        ordersClosed: ordersToClose.rows.length,
        remainingTasks: remainingTasks.rows,
        finalStock: finalStock.rows.slice(0, 5),
        temporalStats: stats,
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na onda temporal: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 5',
      severity: 'CRITICAL',
      message: `Erro na onda temporal: ${errorMsg}`,
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
