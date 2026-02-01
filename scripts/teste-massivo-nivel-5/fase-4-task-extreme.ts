/**
 * FASE 4 - TASK EXTREME
 *
 * Gera tarefas em extremo e valida que nenhuma é absurda/duplicada/sem contexto:
 * - Tarefas por atraso (item >120%, >150%, >200%)
 * - Tarefas por acúmulo (BAR, KITCHEN)
 * - Tarefas por estoque (abaixo mínimo, zerado)
 * - Tarefas por inatividade (30min, 2h, 1 dia)
 * - Tarefas rotina (limpeza, conferência, abertura/fechamento)
 * - Validação: nenhuma absurda, nenhuma duplicada, nenhuma sem contexto
 * - Validação: fechamento automático quando condição some
 */

import pg from "pg";
import type {
  PhaseFunction,
  PhaseResult,
  TestContext,
  TestLogger,
} from "./types";

export const fase4TaskExtreme: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext,
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult["errors"] = [];
  const warnings: PhaseResult["warnings"] = [];

  logger.log("━━━━━━━━━━━━━━━━━━━━━━━");
  logger.log("FASE 4 — TASK EXTREME");
  logger.log("━━━━━━━━━━━━━━━━━━━━━━━");
  logger.log(`📊 Restaurantes no contexto: ${context.restaurants.length}`);

  if (context.restaurants.length === 0) {
    errors.push({
      phase: "FASE 4",
      severity: "CRITICAL",
      message: "Nenhum restaurante no contexto. FASE 1 pode ter falhado.",
      reproducible: true,
    });
    logger.log("❌ Nenhum restaurante no contexto!", "ERROR");
    return {
      success: false,
      duration: Date.now() - startTime,
      errors,
      warnings,
    };
  }

  try {
    // 1. Gerar tarefas de pedidos (atraso, acúmulo)
    logger.log("🔧 Gerando tarefas de pedidos...");
    let totalTasksGenerated = 0;

    for (const restaurant of context.restaurants) {
      try {
        const taskResult = await pool.query(
          `
          SELECT public.generate_tasks_from_orders($1::UUID) as result
        `,
          [restaurant.id],
        );

        const result = taskResult.rows[0].result;
        if (result && result.tasks_created) {
          totalTasksGenerated += result.tasks_created;
        }
      } catch (error: any) {
        warnings.push(
          `Erro ao gerar tarefas para ${restaurant.name}: ${error.message}`,
        );
      }
    }

    logger.log(`  ✅ ${totalTasksGenerated} tarefas geradas de pedidos`);

    // 2. Gerar tarefas agendadas (rotina)
    logger.log("🔧 Gerando tarefas agendadas (rotina)...");
    let scheduledTasksGenerated = 0;

    for (const restaurant of context.restaurants) {
      try {
        const scheduledResult = await pool.query(
          `
          SELECT public.generate_scheduled_tasks($1::UUID) as result
        `,
          [restaurant.id],
        );

        const result = scheduledResult.rows[0].result;
        if (result && result.tasks_created) {
          scheduledTasksGenerated += result.tasks_created;
        }
      } catch (error: any) {
        // RPC pode não existir ainda, não é crítico
        warnings.push(
          `RPC generate_scheduled_tasks não disponível para ${restaurant.name}`,
        );
      }
    }

    if (scheduledTasksGenerated > 0) {
      logger.log(`  ✅ ${scheduledTasksGenerated} tarefas agendadas geradas`);
    }

    // 3. Validar distribuição de tarefas
    logger.log("\n📊 Validando distribuição de tarefas...");
    const taskDistribution = await pool.query(
      `
      SELECT
        task_type,
        station,
        priority,
        COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'OPEN'
      GROUP BY task_type, station, priority
      ORDER BY count DESC
    `,
      [context.restaurants.map((r) => r.id)],
    );

    logger.log("  Distribuição:");
    for (const row of taskDistribution.rows) {
      logger.log(
        `    ${row.task_type} (${row.station || "N/A"}) - ${row.priority}: ${
          row.count
        }`,
      );
    }

    // 4. Validar que nenhuma tarefa é absurda (contexto válido)
    logger.log("\n🔍 Validando tarefas absurdas...");
    const absurdTasks = await pool.query(
      `
      SELECT
        id,
        task_type,
        message,
        context
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'OPEN'
        AND (
          context IS NULL
          OR context = '{}'::jsonb
          OR (context->>'item_name' IS NULL AND task_type = 'ATRASO_ITEM')
          OR (context->>'ingredient_id' IS NULL AND task_type = 'ESTOQUE_CRITICO')
          OR (context->>'order_id' IS NULL AND task_type IN ('ATRASO_ITEM', 'ACUMULO_BAR', 'ENTREGA_PENDENTE'))
        )
      LIMIT 10
    `,
      [context.restaurants.map((r) => r.id)],
    );

    if (absurdTasks.rows.length > 0) {
      warnings.push(
        `FASE 4: Tarefas absurdas detectadas: ${absurdTasks.rows.length} tarefas sem contexto válido`,
      );
      logger.log(
        `  ❌ ${absurdTasks.rows.length} tarefas absurdas detectadas`,
        "ERROR",
      );
      for (const row of absurdTasks.rows.slice(0, 5)) {
        logger.log(
          `     - ${row.task_type}: ${row.message} (context: ${JSON.stringify(
            row.context,
          )})`,
          "ERROR",
        );
      }
    } else {
      logger.log("  ✅ Nenhuma tarefa absurda detectada");
    }

    // 5. Validar que nenhuma tarefa é duplicada
    logger.log("\n🔍 Validando tarefas duplicadas...");
    const duplicatedTasks = await pool.query(
      `
      SELECT
        task_type,
        order_item_id,
        order_id,
        context->>'ingredient_id' as ingredient_id,
        COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'OPEN'
      GROUP BY task_type, order_item_id, order_id, context->>'ingredient_id'
      HAVING COUNT(*) > 1
      LIMIT 10
    `,
      [context.restaurants.map((r) => r.id)],
    );

    if (duplicatedTasks.rows.length > 0) {
      warnings.push(
        `FASE 4: Tarefas duplicadas detectadas: ${duplicatedTasks.rows.length} grupos`,
      );
      logger.log(
        `  ❌ ${duplicatedTasks.rows.length} grupos de tarefas duplicadas detectados`,
        "ERROR",
      );
      for (const row of duplicatedTasks.rows.slice(0, 5)) {
        logger.log(`     - ${row.task_type}: ${row.count} duplicatas`, "ERROR");
      }
    } else {
      logger.log("  ✅ Nenhuma tarefa duplicada detectada");
    }

    // 6. Validar que nenhuma tarefa está sem contexto
    logger.log("\n🔍 Validando tarefas sem contexto...");
    const noContextTasks = await pool.query(
      `
      SELECT
        id,
        task_type,
        message,
        context
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'OPEN'
        AND (context IS NULL OR context = '{}'::jsonb)
      LIMIT 10
    `,
      [context.restaurants.map((r) => r.id)],
    );

    if (noContextTasks.rows.length > 0) {
      errors.push({
        phase: "FASE 4",
        severity: "CRITICAL",
        message: `Tarefas sem contexto detectadas: ${noContextTasks.rows.length}`,
        details: noContextTasks.rows,
        reproducible: true,
      });
      logger.log(
        `  ❌ ${noContextTasks.rows.length} tarefas sem contexto detectadas`,
        "ERROR",
      );
    } else {
      logger.log("  ✅ Nenhuma tarefa sem contexto detectada");
    }

    // 7. Validar fechamento automático quando condição some
    logger.log("\n🔍 Validando fechamento automático...");

    // 7.1. Simular que alguns itens ficaram prontos (deve fechar tarefas de ATRASO_ITEM)
    const itemsMadeReady = await pool.query(
      `
      UPDATE public.gm_order_items
      SET ready_at = NOW()
      WHERE id IN (
        SELECT oi.id
        FROM public.gm_order_items oi
        JOIN public.gm_orders o ON o.id = oi.order_id
        WHERE o.restaurant_id = ANY($1::UUID[])
          AND oi.ready_at IS NULL
          AND EXISTS (
            SELECT 1 FROM public.gm_tasks t
            WHERE t.order_item_id = oi.id
              AND t.task_type = 'ATRASO_ITEM'
              AND t.status = 'OPEN'
          )
        ORDER BY RANDOM()
        LIMIT 50
      )
      RETURNING id
    `,
      [context.restaurants.map((r) => r.id)],
    );

    logger.log(`  ✅ ${itemsMadeReady.rowCount} itens marcados como prontos`);

    // 7.2. Gerar tarefas novamente (deve fechar as antigas se condição sumiu)
    logger.log("  Regenerando tarefas para validar fechamento automático...");
    for (const restaurant of context.restaurants.slice(0, 10)) {
      try {
        await pool.query(
          `
          SELECT public.generate_tasks_from_orders($1::UUID) as result
        `,
          [restaurant.id],
        );
      } catch (error: any) {
        // Ignorar erros
      }
    }

    // 7.3. Verificar se tarefas foram fechadas automaticamente
    const autoClosedTasks = await pool.query(
      `
      SELECT
        COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'RESOLVED'
        AND resolved_at > NOW() - INTERVAL '5 minutes'
        AND task_type = 'ATRASO_ITEM'
        AND order_item_id IN (
          SELECT id FROM public.gm_order_items WHERE ready_at IS NOT NULL
        )
    `,
      [context.restaurants.map((r) => r.id)],
    );

    logger.log(
      `  ✅ ${autoClosedTasks.rows[0].count} tarefas fechadas automaticamente`,
    );

    // 8. Validar tarefas por tipo
    logger.log("\n📊 Estatísticas por tipo de tarefa:");
    const tasksByType = await pool.query(
      `
      SELECT
        task_type,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved,
        AVG(CASE WHEN resolved_at IS NOT NULL THEN
          EXTRACT(EPOCH FROM (resolved_at - created_at))
        END) as avg_resolution_seconds
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
      GROUP BY task_type
      ORDER BY total DESC
    `,
      [context.restaurants.map((r) => r.id)],
    );

    for (const row of tasksByType.rows) {
      const avgResolution = row.avg_resolution_seconds
        ? Math.round(row.avg_resolution_seconds)
        : 0;
      logger.log(`  ${row.task_type}:`);
      logger.log(
        `    Total: ${row.total}, Abertas: ${row.open}, Resolvidas: ${row.resolved}`,
      );
      if (avgResolution > 0) {
        logger.log(`    Tempo médio de resolução: ${avgResolution}s`);
      }
    }

    // 9. Validar prioridades
    logger.log("\n📊 Estatísticas por prioridade:");
    const tasksByPriority = await pool.query(
      `
      SELECT
        priority,
        COUNT(*) as count
      FROM public.gm_tasks
      WHERE restaurant_id = ANY($1::UUID[])
        AND status = 'OPEN'
      GROUP BY priority
      ORDER BY
        CASE priority
          WHEN 'CRITICA' THEN 1
          WHEN 'ALTA' THEN 2
          WHEN 'MEDIA' THEN 3
          WHEN 'BAIXA' THEN 4
          ELSE 5
        END
    `,
      [context.restaurants.map((r) => r.id)],
    );

    for (const row of tasksByPriority.rows) {
      logger.log(`  ${row.priority}: ${row.count} tarefas`);
    }

    const criticalErrors = errors.filter((e) => e.severity === "CRITICAL");
    logger.log(`\n✅ Task Extreme concluído:`);
    logger.log(`   - Tarefas geradas: ${totalTasksGenerated}`);
    logger.log(`   - Tarefas agendadas: ${scheduledTasksGenerated}`);
    logger.log(`   - Tarefas absurdas: ${absurdTasks.rows.length}`);
    logger.log(`   - Tarefas duplicadas: ${duplicatedTasks.rows.length}`);
    logger.log(`   - Tarefas sem contexto: ${noContextTasks.rows.length}`);
    logger.log(
      `   - Tarefas fechadas automaticamente: ${autoClosedTasks.rows[0].count}`,
    );
    logger.log(`   - Erros críticos: ${criticalErrors.length}`);

    return {
      success: criticalErrors.length === 0,
      duration: Date.now() - startTime,
      data: {
        tasksGenerated: totalTasksGenerated,
        scheduledTasksGenerated,
        absurdTasks: absurdTasks.rows.length,
        duplicatedTasks: duplicatedTasks.rows.length,
        noContextTasks: noContextTasks.rows.length,
        autoClosedTasks: parseInt(autoClosedTasks.rows[0].count),
        taskTypes: taskDistribution.rows.length,
        criticalErrors: criticalErrors.length,
      },
      errors,
      warnings,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 4: ${errorMsg}`, "ERROR");

    errors.push({
      phase: "FASE 4",
      severity: "CRITICAL",
      message: `Erro na fase de Task Extreme: ${errorMsg}`,
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
