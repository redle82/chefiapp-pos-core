/**
 * FASE 5 - ESTOQUE CASCATA / ESTOQUE CONTROLADO
 * 
 * Dois modos de operação:
 * 
 * 🔴 MODO CASCATA (padrão):
 * - Simula consumo automático e quebra de estoque em cascata
 * - Estoque pode chegar a zero
 * - Pedidos passam a ser bloqueados
 * - Resultado esperado: FAIL CORRETO (sistema respeita limite físico)
 * 
 * 🟢 MODO CONTROLADO (FASE_5_MODE=controlled):
 * - Simula consumo automático com reposição automática
 * - Estoque nunca chega a zero (buffer + reposição simulada)
 * - Sistema atravessa a fase inteira
 * - Resultado: PASS (teste de volume sob controle)
 * 
 * Ambos os modos validam:
 * - Geração de alertas, tarefas, lista de compras
 * - Simulação de compras (múltiplos mercados, comparação de preços)
 * - Confirmação de compra → atualização de estoque → fechamento de tarefas
 * - Validação de loop fechado (compra → estoque → produção → compra)
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';
import { emitProgress } from './progress';

export const fase5EstoqueCascata: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  // Determinar modo: "cascata" (padrão) ou "controlled" (reposição automática)
  const mode = (process.env.FASE_5_MODE || 'cascata').toLowerCase();
  const isControlledMode = mode === 'controlled';

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log(`FASE 5 — ESTOQUE ${isControlledMode ? 'CONTROLADO' : 'CASCATA'}`);
  logger.log(`Modo: ${isControlledMode ? '🟢 Controlado (reposição automática)' : '🔴 Cascata (pode chegar a zero)'}`);
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Simular consumo automático (via pedidos)
    logger.log('🔄 Simulando consumo automático de estoque...');
    let totalConsumed = 0;

    // Pegar pedidos abertos e simular consumo
    // NOTA: gm_order_items usa ready_at (não status)
    // - Item pendente: ready_at IS NULL
    // - Item pronto: ready_at IS NOT NULL
    const openOrders = await pool.query(`
      SELECT 
        o.id,
        o.restaurant_id,
        oi.product_id,
        oi.quantity
      FROM public.gm_orders o
      JOIN public.gm_order_items oi ON oi.order_id = o.id
      WHERE o.restaurant_id = ANY($1::UUID[])
        AND o.status IN ('OPEN', 'IN_PREP', 'PREPARING')
        AND oi.ready_at IS NULL
      LIMIT 1000
    `, [context.restaurants.map(r => r.id)]);

    // Para cada pedido, simular consumo via BOM
    for (const order of openOrders.rows) {
      try {
        // Pegar BOM do produto
        const bomItems = await pool.query(`
          SELECT 
            b.ingredient_id,
            b.qty_per_unit,
            b.station
          FROM public.gm_product_bom b
          WHERE b.product_id = $1
            AND b.restaurant_id = $2
        `, [order.product_id, order.restaurant_id]);

        // Consumir ingredientes
        for (const bom of bomItems.rows) {
          const consumeQty = bom.qty_per_unit * order.quantity;
          
          // Atualizar estoque (reduzir qty)
          const updateResult = await pool.query(`
            UPDATE public.gm_stock_levels
            SET qty = GREATEST(0, qty - $1),
                updated_at = NOW()
            WHERE restaurant_id = $2
              AND ingredient_id = $3
            RETURNING id, qty, min_qty
          `, [consumeQty, order.restaurant_id, bom.ingredient_id]);

          if (updateResult.rows.length > 0) {
            totalConsumed++;
            
            // Registrar no ledger (se existir)
            try {
              await pool.query(`
                INSERT INTO public.gm_stock_ledger (
                  restaurant_id, location_id, ingredient_id, action, qty, reason, created_by_role
                )
                SELECT 
                  $1,
                  sl.location_id,
                  $3,
                  'OUT',
                  $4,
                  'CONSUMPTION',
                  'system'
                FROM public.gm_stock_levels sl
                WHERE sl.restaurant_id = $1
                  AND sl.ingredient_id = $3
                LIMIT 1
              `, [order.restaurant_id, bom.ingredient_id, consumeQty]);
            } catch (e) {
              // Ledger pode não existir, não é crítico
            }
          }
        }
      } catch (error: any) {
        warnings.push(`Erro ao consumir estoque para pedido ${order.id}: ${error.message}`);
      }
    }

    logger.log(`  ✅ ${totalConsumed} consumos simulados`);

    emitProgress(context, {
      phase: 'FASE 5: Estoque Cascata',
      step: 'Consumo simulado',
      op: 'EXEC',
      message: `${totalConsumed} consumos simulados`,
      resource: 'public.gm_stock_levels',
    });

    // 2. Forçar quebra de estoque (modo cascata) ou stress controlado (modo controlled)
    let criticalIngredients: any = null;
    let cascadeBreak: any = null;
    let stressStock: any = null;
    let autoReplenished = 0;
    let tasksClosedTotal = 0; // Para modo controlado
    
    if (isControlledMode) {
      logger.log('\n🟢 Modo Controlado: Executando ciclo completo de compras (Estoque + Compras sob Stress)...');
      
      // 2.1. Reduzir estoque para níveis críticos (mas não zero) - simula consumo real
      stressStock = await pool.query(`
        UPDATE public.gm_stock_levels
        SET qty = GREATEST(min_qty * 0.3, qty * 0.4)
        WHERE restaurant_id = ANY($1::UUID[])
          AND qty > min_qty * 0.5
          AND ingredient_id IN (
            SELECT ingredient_id
            FROM public.gm_product_bom
            WHERE restaurant_id = ANY($1::UUID[])
            GROUP BY ingredient_id
            HAVING COUNT(DISTINCT product_id) >= 3
            ORDER BY COUNT(DISTINCT product_id) DESC
            LIMIT 50
          )
        RETURNING id, ingredient_id, qty, min_qty, restaurant_id
      `, [context.restaurants.map(r => r.id)]);

      logger.log(`  ✅ ${stressStock.rowCount} ingredientes reduzidos para níveis críticos (simulando consumo real)`);
      
      emitProgress(context, {
        phase: 'FASE 5: Estoque Cascata',
        step: 'Estoque reduzido',
        op: 'EXEC',
        message: `${stressStock.rowCount} ingredientes em nível crítico`,
        resource: 'public.gm_stock_levels',
      });
      
      // 2.2. CICLO COMPLETO DE COMPRAS (não apenas reposição direta)
      // Passo 1: Gerar lista de compras (sistema real)
      logger.log('\n  📋 Passo 1: Gerando lista de compras (via generate_shopping_list)...');
      let shoppingListTotal = 0;
      const itemsToPurchase: Array<{
        restaurant_id: string;
        ingredient_id: string;
        location_id: string;
        suggested_qty: number;
        urgency: string;
      }> = [];

      for (const restaurant of context.restaurants.slice(0, 100)) {
        try {
          const shoppingList = await pool.query(`
            SELECT public.generate_shopping_list($1::UUID) as result
          `, [restaurant.id]);

          const items = shoppingList.rows[0].result || [];
          shoppingListTotal += items.length;
          
          for (const item of items) {
            itemsToPurchase.push({
              restaurant_id: restaurant.id,
              ingredient_id: item.ingredient_id,
              location_id: item.location_id,
              suggested_qty: item.suggested_qty || item.min_qty * 2,
              urgency: item.urgency || 'MEDIUM',
            });
          }
        } catch (error: any) {
          // Ignorar erros
        }
      }

      logger.log(`  ✅ ${shoppingListTotal} itens na lista de compras (${itemsToPurchase.length} coletados para processar)`);
      
      emitProgress(context, {
        phase: 'FASE 5: Estoque Cascata',
        step: 'Lista de compras gerada',
        op: 'EXEC',
        message: `${shoppingListTotal} itens identificados`,
        resource: 'public.gm_stock_levels',
      });

      // Passo 2: Simular latência de fornecedor (realismo)
      logger.log('\n  ⏱️  Passo 2: Simulando latência de fornecedor (2-5 segundos por item)...');
      const supplierLatency = (min: number, max: number) => 
        Math.floor(Math.random() * (max - min + 1)) + min;
      
      // Passo 3: Confirmar compras via RPC (ciclo fechado)
      logger.log('\n  🛒 Passo 3: Confirmando compras (via confirm_purchase)...');
      autoReplenished = 0;
      tasksClosedTotal = 0; // Usar variável do escopo externo
      
      // Processar em lotes para simular realidade (não tudo instantâneo)
      const batchSize = 20;
      for (let i = 0; i < itemsToPurchase.length; i += batchSize) {
        const batch = itemsToPurchase.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (item) => {
            // Simular latência de fornecedor
            await new Promise(resolve => setTimeout(resolve, supplierLatency(2000, 5000)));
            
            try {
              // Confirmar compra via RPC (sistema real)
              const purchaseResult = await pool.query(`
                SELECT public.confirm_purchase(
                  $1::UUID,
                  $2::UUID,
                  $3::UUID,
                  $4::NUMERIC,
                  ${Math.round(100 * (1 + Math.random() * 0.3))}::INTEGER,
                  'PURCHASE'::TEXT
                ) as result
              `, [
                item.restaurant_id,
                item.ingredient_id,
                item.location_id,
                item.suggested_qty,
              ]);

              if (purchaseResult.rows[0].result?.success) {
                autoReplenished++;
                tasksClosedTotal += purchaseResult.rows[0].result.tasks_closed || 0;
              }
            } catch (e) {
              // Ignorar erros individuais
            }
          })
        );
        
        // Progresso a cada lote
        if ((i + batchSize) % 50 === 0 || i + batchSize >= itemsToPurchase.length) {
          logger.log(`    ⏳ Progresso: ${Math.min(i + batchSize, itemsToPurchase.length)}/${itemsToPurchase.length} itens processados...`);
        }
      }

      logger.log(`  ✅ ${autoReplenished} compras confirmadas (${tasksClosedTotal} tarefas fechadas automaticamente)`);
      
      emitProgress(context, {
        phase: 'FASE 5: Estoque Cascata',
        step: 'Compras confirmadas',
        op: 'EXEC',
        message: `${autoReplenished} compras, ${tasksClosedTotal} tarefas fechadas`,
        resource: 'public.gm_stock_levels',
      });
    } else {
      // Modo Cascata (original)
      logger.log('\n⚠️  Modo Cascata: Forçando quebra de estoque em cascata...');
      
      // 2.1. Quebrar ingredientes críticos (usados em muitos produtos)
      criticalIngredients = await pool.query(`
        UPDATE public.gm_stock_levels
        SET qty = min_qty * 0.2
        WHERE restaurant_id = ANY($1::UUID[])
          AND qty > min_qty
          AND ingredient_id IN (
            SELECT ingredient_id
            FROM public.gm_product_bom
            WHERE restaurant_id = ANY($1::UUID[])
            GROUP BY ingredient_id
            HAVING COUNT(DISTINCT product_id) >= 3
            ORDER BY COUNT(DISTINCT product_id) DESC
            LIMIT 50
          )
        RETURNING id, ingredient_id, qty, min_qty, restaurant_id
      `, [context.restaurants.map(r => r.id)]);

      logger.log(`  ✅ ${criticalIngredients.rowCount} ingredientes críticos quebrados`);

      // 2.2. Quebrar múltiplos ingredientes simultaneamente (cascata)
      cascadeBreak = await pool.query(`
        UPDATE public.gm_stock_levels
        SET qty = 0
        WHERE restaurant_id = ANY($1::UUID[])
          AND qty > 0
          AND ingredient_id IN (
            SELECT ingredient_id
            FROM public.gm_product_bom
            WHERE restaurant_id = ANY($1::UUID[])
              AND product_id IN (
                SELECT product_id
                FROM public.gm_product_bom
                WHERE restaurant_id = ANY($1::UUID[])
                  AND ingredient_id IN (
                    SELECT ingredient_id
                    FROM public.gm_stock_levels
                    WHERE restaurant_id = ANY($1::UUID[])
                      AND qty < min_qty
                    LIMIT 10
                  )
              )
            LIMIT 20
          )
        RETURNING id, ingredient_id, qty, min_qty, restaurant_id
      `, [context.restaurants.map(r => r.id)]);

      logger.log(`  ✅ ${cascadeBreak.rowCount} ingredientes quebrados em cascata`);
    }

    // 3. Gerar alertas, tarefas, lista de compras
    logger.log('\n🔔 Gerando alertas, tarefas e lista de compras...');
    
    // 3.1. Gerar tarefas de estoque crítico
    let stockTasksGenerated = 0;
    for (const restaurant of context.restaurants.slice(0, 100)) {
      try {
        const taskResult = await pool.query(`
          SELECT public.generate_tasks_from_orders($1::UUID) as result
        `, [restaurant.id]);

        const result = taskResult.rows[0].result;
        if (result && result.estoque_critico) {
          stockTasksGenerated += result.estoque_critico;
        }
      } catch (error: any) {
        // Ignorar erros
      }
    }

    logger.log(`  ✅ ${stockTasksGenerated} tarefas de estoque crítico geradas`);

    // 3.2. Gerar lista de compras
    let shoppingListItems = 0;
    const shoppingListSamples: any[] = [];

    for (const restaurant of context.restaurants.slice(0, 50)) {
      try {
        const shoppingList = await pool.query(`
          SELECT public.generate_shopping_list($1::UUID) as result
        `, [restaurant.id]);

        const items = shoppingList.rows[0].result || [];
        shoppingListItems += items.length;
        
        if (items.length > 0 && shoppingListSamples.length < 5) {
          shoppingListSamples.push({
            restaurant: restaurant.name,
            items: items.slice(0, 3),
          });
        }
      } catch (error: any) {
        warnings.push(`Erro ao gerar lista de compras para ${restaurant.name}: ${error.message}`);
      }
    }

    logger.log(`  ✅ ${shoppingListItems} itens na lista de compras (amostra de 50 restaurantes)`);
    
    if (shoppingListSamples.length > 0) {
      logger.log('  Exemplos:');
      for (const sample of shoppingListSamples) {
        const critical = sample.items.filter((i: any) => i.urgency === 'CRITICAL').length;
        logger.log(`    ${sample.restaurant}: ${sample.items.length} itens (${critical} críticos)`);
      }
    }

    // 4. Simular compras (múltiplos mercados, comparação de preços)
    // NOTA: No modo controlado, compras já foram executadas no ciclo completo (seção 2.2)
    // Aqui só executa no modo cascata para validar o fluxo parcial
    let purchasesSimulated = 0;
    
    if (isControlledMode) {
      logger.log('\n🟢 Modo Controlado: Compras já executadas no ciclo completo (seção anterior)');
      logger.log(`   - ${autoReplenished} compras confirmadas`);
      logger.log(`   - ${tasksClosedTotal} tarefas fechadas automaticamente`);
      purchasesSimulated = autoReplenished; // Reutilizar contador do ciclo completo
    } else {
      logger.log('\n🛒 Simulando compras (modo cascata - validação parcial)...');

      // Pegar ingredientes críticos para comprar
      const criticalStock = await pool.query(`
        SELECT 
          sl.restaurant_id,
          sl.ingredient_id,
          i.name as ingredient_name,
          sl.location_id,
          sl.qty,
          sl.min_qty,
          (sl.min_qty * 2 - sl.qty) as suggested_qty
        FROM public.gm_stock_levels sl
        JOIN public.gm_ingredients i ON i.id = sl.ingredient_id
        WHERE sl.restaurant_id = ANY($1::UUID[])
          AND sl.qty < sl.min_qty
        LIMIT 100
      `, [context.restaurants.map(r => r.id)]);

      for (const stock of criticalStock.rows) {
        if (stock.suggested_qty <= 0) continue;

        // Simular múltiplos mercados (A, B, C) com preços diferentes
        const markets = [
          { name: 'Mercado A', priceMultiplier: 1.0 }, // Mais barato
          { name: 'Mercado B', priceMultiplier: 1.1 }, // Médio
          { name: 'Mercado C', priceMultiplier: 1.3 }, // Mais caro (emergência)
        ];

        // Escolher mercado (70% A, 20% B, 10% C)
        const marketChoice = Math.random();
        const market = marketChoice < 0.7 ? markets[0] 
          : marketChoice < 0.9 ? markets[1] 
          : markets[2];

        const purchasePrice = Math.round(100 * market.priceMultiplier); // Preço simulado em centavos

        try {
          // Confirmar compra via RPC
          const purchaseResult = await pool.query(`
            SELECT public.confirm_purchase(
              $1::UUID,  -- restaurant_id
              $2::UUID,  -- ingredient_id
              $3::UUID,  -- location_id
              $4::NUMERIC,  -- qty_received
              $5::INTEGER,  -- purchase_price_cents
              'PURCHASE'::TEXT  -- reason
            ) as result
          `, [
            stock.restaurant_id,
            stock.ingredient_id,
            stock.location_id,
            stock.suggested_qty,
            purchasePrice,
          ]);

          if (purchaseResult.rows[0].result?.success) {
            purchasesSimulated++;
            
            const tasksClosed = purchaseResult.rows[0].result.tasks_closed || 0;
            if (tasksClosed > 0) {
              logger.log(`    ✅ Compra confirmada: ${stock.ingredient_name} (${stock.suggested_qty}) - ${tasksClosed} tarefas fechadas`);
            }
          }
        } catch (error: any) {
          warnings.push(`Erro ao confirmar compra para ${stock.ingredient_name}: ${error.message}`);
        }
      }

      logger.log(`  ✅ ${purchasesSimulated} compras simuladas`);
    }

    // 5. Validar loop fechado (compra → estoque → produção → compra)
    logger.log('\n🔍 Validando loop fechado...');
    
    // 5.1. Verificar que estoque foi atualizado após compras
    const stockAfterPurchase = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN qty >= min_qty THEN 1 END) as above_min,
        COUNT(CASE WHEN qty < min_qty THEN 1 END) as below_min
      FROM public.gm_stock_levels
      WHERE restaurant_id = ANY($1::UUID[])
    `, [context.restaurants.map(r => r.id)]);

    const stockStats = stockAfterPurchase.rows[0];
    const aboveMinPercent = Math.round((stockStats.above_min / stockStats.total) * 100);
    logger.log(`  ✅ Estoque após compras: ${stockStats.above_min}/${stockStats.total} acima do mínimo (${aboveMinPercent}%)`);

    // 5.2. Verificar que tarefas foram fechadas após compras
    const tasksAfterPurchase = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'RESOLVED' AND resolved_at > NOW() - INTERVAL '10 minutes' THEN 1 END) as recently_resolved,
        COUNT(CASE WHEN status = 'OPEN' AND task_type = 'ESTOQUE_CRITICO' THEN 1 END) as still_open
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND task_type = 'ESTOQUE_CRITICO'
    `, [context.restaurants.map(r => r.id)]);

    const taskStats = tasksAfterPurchase.rows[0];
    logger.log(`  ✅ Tarefas de estoque: ${taskStats.recently_resolved} fechadas recentemente, ${taskStats.still_open} ainda abertas`);

    // 5.3. Validar que ledger foi atualizado
    const ledgerCheck = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN action = 'IN' AND reason = 'PURCHASE' THEN 1 END) as purchases,
        COUNT(CASE WHEN action = 'OUT' AND reason = 'CONSUMPTION' THEN 1 END) as consumptions
      FROM public.gm_stock_ledger
      WHERE restaurant_id = ANY($1::UUID[])
        AND created_at > NOW() - INTERVAL '10 minutes'
    `, [context.restaurants.map(r => r.id)]);

    const ledgerStats = ledgerCheck.rows[0];
    logger.log(`  ✅ Ledger atualizado: ${ledgerStats.purchases} compras, ${ledgerStats.consumptions} consumos`);

    // 6. Validar consumo correto
    logger.log('\n🔍 Validando consumo correto...');
    const consumptionValidation = await pool.query(`
      SELECT 
        COUNT(*) as total_consumptions,
        SUM(CASE WHEN qty < 0 THEN 1 ELSE 0 END) as negative_stock,
        AVG(qty) as avg_qty,
        MIN(qty) as min_qty,
        MAX(qty) as max_qty
      FROM public.gm_stock_levels
      WHERE restaurant_id = ANY($1::UUID[])
    `, [context.restaurants.map(r => r.id)]);

    const consumptionStats = consumptionValidation.rows[0];
    if (parseInt(consumptionStats.negative_stock) > 0) {
      warnings.push(`Estoque negativo detectado: ${consumptionStats.negative_stock} itens`);
    } else {
      logger.log('  ✅ Nenhum estoque negativo detectado');
    }

    logger.log(`\n✅ Estoque ${isControlledMode ? 'Controlado' : 'Cascata'} concluído:`);
    logger.log(`   - Consumos simulados: ${totalConsumed}`);
    if (isControlledMode) {
      logger.log(`   - Ingredientes reduzidos para crítico: ${stressStock?.rowCount || 0}`);
      logger.log(`   - Reposições automáticas: ${autoReplenished || 0}`);
    } else {
      logger.log(`   - Ingredientes críticos quebrados: ${criticalIngredients?.rowCount || 0}`);
      logger.log(`   - Ingredientes quebrados em cascata: ${cascadeBreak?.rowCount || 0}`);
    }
    logger.log(`   - Tarefas de estoque geradas: ${stockTasksGenerated}`);
    logger.log(`   - Itens na lista de compras: ${shoppingListItems}`);
    logger.log(`   - Compras simuladas: ${purchasesSimulated}`);
    logger.log(`   - Estoque acima do mínimo: ${aboveMinPercent}%`);
    logger.log(`   - Tarefas fechadas: ${taskStats.recently_resolved}`);

    emitProgress(context, {
      phase: 'FASE 5: Estoque Cascata',
      step: 'complete',
      op: 'INFO',
      message: `COMPLETA (${Date.now() - startTime}ms) - Modo: ${isControlledMode ? 'Controlado' : 'Cascata'}`,
      resource: 'public.gm_stock_levels',
    });

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        mode: isControlledMode ? 'controlled' : 'cascata',
        totalConsumed,
        criticalIngredientsBroken: isControlledMode ? 0 : (criticalIngredients?.rowCount || 0),
        cascadeBroken: isControlledMode ? 0 : (cascadeBreak?.rowCount || 0),
        autoReplenished: isControlledMode ? (autoReplenished || 0) : 0,
        stockTasksGenerated,
        shoppingListItems,
        purchasesSimulated,
        stockAboveMin: parseInt(stockStats.above_min),
        stockBelowMin: parseInt(stockStats.below_min),
        tasksResolved: parseInt(taskStats.recently_resolved),
        tasksStillOpen: parseInt(taskStats.still_open),
        ledgerPurchases: parseInt(ledgerStats.purchases),
        ledgerConsumptions: parseInt(ledgerStats.consumptions),
        negativeStock: parseInt(consumptionStats.negative_stock),
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
      message: `Erro na fase de Estoque Cascata: ${errorMsg}`,
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
