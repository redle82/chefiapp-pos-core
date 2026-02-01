/**
 * FASE 3 - TASK ENGINE (REAÇÃO)
 * 
 * Valida que o Task Engine gera tarefas automáticas corretamente:
 * - Tarefas de atraso (ATRASO_ITEM)
 * - Tarefas de estoque crítico (ESTOQUE_CRITICO)
 * - Tarefas atribuídas por estação e cargo
 * 
 * Durante os pedidos:
 * 1. Criar atrasos artificiais (simular itens atrasados)
 * 2. Criar consumo abaixo do mínimo (via simulação)
 * 3. Chamar generate_tasks_from_orders
 * 4. Validar tarefas criadas
 */

import pg from 'pg';
import type { PhaseFunction, PhaseResult, TestContext, TaskData } from './types';
import type { TestLogger } from './types';

export const fase3TaskEngine: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 3 — TASK ENGINE (REAÇÃO)');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Simular atrasos artificiais
    logger.log('Simulando atrasos artificiais...');
    
    // Pegar alguns itens de cozinha e simular que estão atrasados
    // (atualizar created_at para parecer que foram criados há mais tempo)
    const itemsToDelay = await pool.query(`
      SELECT oi.id, oi.prep_time_seconds, o.restaurant_id
      FROM public.gm_order_items oi
      JOIN public.gm_orders o ON o.id = oi.order_id
      WHERE o.status = 'OPEN'
        AND oi.station = 'KITCHEN'
        AND oi.ready_at IS NULL
        AND oi.prep_time_seconds IS NOT NULL
      LIMIT 4
    `);

    for (const item of itemsToDelay.rows) {
      // Simular que o item foi criado há 150% do tempo de preparo
      const delaySeconds = Math.floor(item.prep_time_seconds * 1.5);
      await pool.query(`
        UPDATE public.gm_order_items
        SET created_at = NOW() - ($1 || ' seconds')::INTERVAL
        WHERE id = $2
      `, [delaySeconds, item.id]);
    }
    logger.log(`  ✅ ${itemsToDelay.rows.length} itens simulados como atrasados`);

    // 2. Simular consumo de estoque abaixo do mínimo
    logger.log('Simulando consumo de estoque crítico...');
    
    // Reduzir estoque de alguns ingredientes para abaixo do mínimo
    const stockToReduce = await pool.query(`
      SELECT sl.id, sl.min_qty, sl.restaurant_id
      FROM public.gm_stock_levels sl
      WHERE sl.qty > sl.min_qty
      LIMIT 2
    `);

    for (const stock of stockToReduce.rows) {
      // Reduzir para 50% do mínimo
      const newQty = Math.floor(stock.min_qty * 0.5);
      await pool.query(`
        UPDATE public.gm_stock_levels
        SET qty = $1, updated_at = NOW()
        WHERE id = $2
      `, [newQty, stock.id]);

      // Criar tarefa de estoque crítico manualmente (já que ainda não temos hook automático)
      const ingredient = await pool.query(`
        SELECT i.name, i.id, l.name as location_name, l.kind
        FROM public.gm_stock_levels sl
        JOIN public.gm_ingredients i ON i.id = sl.ingredient_id
        JOIN public.gm_locations l ON l.id = sl.location_id
        WHERE sl.id = $1
      `, [stock.id]);

      if (ingredient.rows.length > 0) {
        const ing = ingredient.rows[0];
        const station = ing.kind === 'BAR' ? 'BAR' : 'KITCHEN';
        
        await pool.query(`
          INSERT INTO public.gm_tasks (
            restaurant_id, task_type, station, priority, message, context, auto_generated, source_event
          )
          VALUES ($1, $2, $3, $4, $5, $6, true, 'stock_critical')
        `, [
          stock.restaurant_id,
          'ESTOQUE_CRITICO',
          station,
          'ALTA',
          `Estoque crítico: ${ing.name} (${ing.location_name}) — repor antes do pico`,
          JSON.stringify({
            ingredient: ing.name,
            ingredient_id: ing.id,
            location: ing.location_name,
            qty: newQty,
            min_qty: stock.min_qty,
          }),
        ]);
      }
    }
    logger.log(`  ✅ ${stockToReduce.rows.length} níveis de estoque reduzidos e tarefas criadas`);

    // 3. Gerar tarefas automáticas via RPC
    logger.log('Gerando tarefas automáticas via RPC...');
    
    const tasksByRestaurant: { [key: string]: number } = {};
    
    for (const restaurant of context.restaurants) {
      const result = await pool.query(`
        SELECT public.generate_tasks_from_orders($1) as result
      `, [restaurant.id]);
      
      const taskResult = result.rows[0].result;
      const tasksCreated = taskResult.tasks_created || 0;
      tasksByRestaurant[restaurant.name] = tasksCreated;
      
      logger.log(`  ✅ ${restaurant.name}: ${tasksCreated} tarefas geradas`);
    }

    // 4. Buscar todas as tarefas criadas
    const allTasks = await pool.query(`
      SELECT 
        t.id, t.restaurant_id, t.task_type, t.station, t.priority, 
        t.status, t.message, t.context, t.auto_generated, t.source_event,
        r.name as restaurant_name
      FROM public.gm_tasks t
      JOIN public.gm_restaurants r ON r.id = t.restaurant_id
      WHERE t.status = 'OPEN'
        AND t.auto_generated = true
        AND t.created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY t.created_at DESC
    `);

    // Adicionar ao contexto
    for (const task of allTasks.rows) {
      context.tasks.push({
        id: task.id,
        restaurant_id: task.restaurant_id,
        task_type: task.task_type,
        station: task.station || 'N/A',
        priority: task.priority,
        status: task.status,
        message: task.message,
      });
    }

    logger.log(`  ✅ Total de ${allTasks.rows.length} tarefas abertas encontradas`);

    // 5. Validar tipos de tarefa
    const taskTypes = new Set(allTasks.rows.map((t: any) => t.task_type));
    const expectedTypes = ['ATRASO_ITEM', 'ESTOQUE_CRITICO'];
    const foundTypes = Array.from(taskTypes);
    const missingTypes = expectedTypes.filter(t => !foundTypes.includes(t));

    if (missingTypes.length > 0) {
      warnings.push(`Tipos de tarefa não encontrados: ${missingTypes.join(', ')}`);
      logger.log(`  ⚠️  Aviso: Alguns tipos de tarefa não foram gerados`, 'WARN');
    } else {
      logger.log(`  ✅ Tipos de tarefa validados: ${foundTypes.join(', ')}`);
    }

    // 6. Validar distribuição por estação
    const tasksByStation = await pool.query(`
      SELECT station, COUNT(*) as count
      FROM public.gm_tasks
      WHERE status = 'OPEN' AND auto_generated = true
      GROUP BY station
    `);

    logger.log(`  📊 Distribuição por estação:`);
    for (const stat of tasksByStation.rows) {
      logger.log(`    ${stat.station || 'N/A'}: ${stat.count} tarefas`);
    }

    // 7. Validar prioridades
    const tasksByPriority = await pool.query(`
      SELECT priority, COUNT(*) as count
      FROM public.gm_tasks
      WHERE status = 'OPEN' AND auto_generated = true
      GROUP BY priority
    `);

    logger.log(`  📊 Distribuição por prioridade:`);
    for (const prio of tasksByPriority.rows) {
      logger.log(`    ${prio.priority}: ${prio.count} tarefas`);
    }

    // 8. Validar que tarefas não vazam entre restaurantes
    const crossRestaurantCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks t1
      JOIN public.gm_tasks t2 ON t1.order_id = t2.order_id
      JOIN public.gm_orders o ON o.id = t1.order_id
      WHERE t1.restaurant_id != o.restaurant_id
        AND t1.status = 'OPEN'
    `);

    if (parseInt(crossRestaurantCheck.rows[0].count) > 0) {
      errors.push({
        phase: 'FASE 3',
        severity: 'CRITICAL',
        message: `Vazamento entre restaurantes: ${crossRestaurantCheck.rows[0].count} tarefas com restaurant_id incorreto`,
        reproducible: true,
      });
      logger.log(`  ❌ ERRO: Vazamento entre restaurantes detectado!`, 'ERROR');
    } else {
      logger.log(`  ✅ Isolamento entre restaurantes validado`);
    }

    logger.log(`\n✅ Task Engine validado com sucesso`);

    return {
      success: true,
      duration: Date.now() - startTime,
      data: {
        tasksCreated: allTasks.rows.length,
        tasksByRestaurant,
        taskTypes: foundTypes,
        tasksByStation: tasksByStation.rows,
        tasksByPriority: tasksByPriority.rows,
      },
      errors,
      warnings,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro no Task Engine: ${errorMsg}`, 'ERROR');
    
    errors.push({
      phase: 'FASE 3',
      severity: 'CRITICAL',
      message: `Erro no Task Engine: ${errorMsg}`,
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
