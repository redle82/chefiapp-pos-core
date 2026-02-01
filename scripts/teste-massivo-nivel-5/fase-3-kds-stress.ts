/**
 * FASE 3 - KDS STRESS
 *
 * Simula produção realista com gargalos artificiais:
 * - Separação BAR / COZINHA
 * - Itens rápidos + longos no mesmo pedido
 * - Gargalos artificiais (bar atrasado, cozinha sobrecarregada)
 * - Herança de estado (pedido crítico por 1 item)
 * - Validação de timers e alertas
 *
 * NOTE: gm_order_items uses ready_at column (not status column)
 * - Item pending: ready_at IS NULL
 * - Item ready: ready_at IS NOT NULL
 */

import pg from "pg";
import { emitProgress } from "./progress";
import type {
  PhaseFunction,
  PhaseResult,
  TestContext,
  TestLogger,
} from "./types";

export const fase3KdsStress: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext,
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult["errors"] = [];
  const warnings: PhaseResult["warnings"] = [];

  logger.log("━━━━━━━━━━━━━━━━━━━━━━━");
  logger.log("FASE 3 — KDS STRESS");
  logger.log("━━━━━━━━━━━━━━━━━━━━━━━");
  logger.log(`📊 Restaurantes no contexto: ${context.restaurants.length}`);

  if (context.restaurants.length === 0) {
    errors.push({
      phase: "FASE 3",
      severity: "CRITICAL",
      message:
        "Nenhum restaurante no contexto. FASE 1 pode ter falhado ao popular context.restaurants.",
      reproducible: true,
    });
    logger.log("❌ Nenhum restaurante no contexto!", "ERROR");
    emitProgress(context, {
      phase: "FASE 3: KDS Stress",
      step: "failed",
      op: "ERROR",
      message: "Nenhum restaurante no contexto. FASE 1 pode ter falhado.",
      resource: "public.gm_orders",
    });
    return {
      success: false,
      duration: Date.now() - startTime,
      errors,
      warnings,
    };
  }

  try {
    // Sinalizar início da FASE 3 no Progress Bus
    emitProgress(context, {
      phase: "FASE 3: KDS Stress",
      step: "start",
      op: "EXEC",
      message: "Iniciando validações e gargalos de KDS",
      resource: "public.gm_orders",
    });

    const restaurantIds = context.restaurants.map((r) => r.id);

    // 1. Validar agrupamento por estação
    logger.log("🔍 Validando agrupamento por estação...");
    emitProgress(context, {
      phase: "FASE 3: KDS Stress",
      step: "Agrupamento por estação",
      op: "EXEC",
      message: "Calculando carga por estação (BAR / KITCHEN)",
      resource: "public.gm_order_items",
    });
    const stationGroups = await pool.query(
      `
      SELECT
        oi.station,
        COUNT(DISTINCT oi.id) as items_count,
        COUNT(DISTINCT o.id) as orders_count,
        AVG(oi.prep_time_seconds) as avg_prep_time,
        MIN(oi.prep_time_seconds) as min_prep_time,
        MAX(oi.prep_time_seconds) as max_prep_time
      FROM public.gm_order_items oi
      JOIN public.gm_orders o ON o.id = oi.order_id
      WHERE o.restaurant_id = ANY($1::UUID[])
        AND o.status IN ('OPEN', 'IN_PREP', 'PREPARING')
      GROUP BY oi.station
    `,
      [restaurantIds],
    );

    for (const row of stationGroups.rows) {
      logger.log(
        `  ✅ ${row.station || "N/A"}: ${row.items_count} itens em ${
          row.orders_count
        } pedidos`,
      );
      if (row.avg_prep_time) {
        logger.log(
          `     Tempo médio: ${Math.round(row.avg_prep_time)}s (min: ${
            row.min_prep_time
          }s, max: ${row.max_prep_time}s)`,
        );
      }
    }

    // 2. Simular produção realista (criar gargalos mudando created_at)
    logger.log("\n⏱️  Simulando gargalos de produção...");

    // 2.1. Simular itens atrasados no BAR (mudando created_at para 15min atrás)
    const barBottleneck = await pool.query(
      `
      UPDATE public.gm_order_items
      SET created_at = NOW() - INTERVAL '15 minutes'
      WHERE id IN (
        SELECT oi.id
        FROM public.gm_order_items oi
        JOIN public.gm_orders o ON o.id = oi.order_id
        WHERE o.restaurant_id = ANY($1::UUID[])
          AND oi.station = 'BAR'
          AND oi.ready_at IS NULL
        ORDER BY RANDOM()
        LIMIT 200
      )
      RETURNING id
    `,
      [restaurantIds],
    );

    logger.log(`  ✅ Bar atrasado: ${barBottleneck.rowCount} itens simulados`);

    // 2.2. Simular itens atrasados na KITCHEN (mudando created_at para 45min atrás)
    const kitchenBottleneck = await pool.query(
      `
      UPDATE public.gm_order_items
      SET created_at = NOW() - INTERVAL '45 minutes'
      WHERE id IN (
        SELECT oi.id
        FROM public.gm_order_items oi
        JOIN public.gm_orders o ON o.id = oi.order_id
        WHERE o.restaurant_id = ANY($1::UUID[])
          AND oi.station = 'KITCHEN'
          AND oi.ready_at IS NULL
        ORDER BY RANDOM()
        LIMIT 300
      )
      RETURNING id
    `,
      [restaurantIds],
    );

    logger.log(
      `  ✅ Cozinha sobrecarregada: ${kitchenBottleneck.rowCount} itens simulados`,
    );
    emitProgress(context, {
      phase: "FASE 3: KDS Stress",
      step: "Gargalos criados",
      op: "EXEC",
      message: `BAR: ${barBottleneck.rowCount} itens, KITCHEN: ${kitchenBottleneck.rowCount} itens`,
      resource: "public.gm_order_items",
    });

    // 3. Validar herança de estado (pedido crítico por 1 item atrasado)
    logger.log("\n🔍 Validando herança de estado...");
    const criticalOrders = await pool.query(
      `
      SELECT
        o.id,
        LEFT(o.id::text, 8) as short_id,
        o.restaurant_id,
        COUNT(oi.id) as total_items,
        COUNT(CASE WHEN oi.ready_at IS NULL AND
          (NOW() - oi.created_at) > (COALESCE(oi.prep_time_seconds, 300) * 1.2 * INTERVAL '1 second')
          THEN 1 END) as delayed_items,
        MAX(CASE WHEN oi.ready_at IS NULL AND
          (NOW() - oi.created_at) > (COALESCE(oi.prep_time_seconds, 300) * 1.2 * INTERVAL '1 second')
          THEN EXTRACT(EPOCH FROM (NOW() - oi.created_at - (COALESCE(oi.prep_time_seconds, 300) * INTERVAL '1 second')))::INTEGER
          ELSE 0 END) as max_delay_seconds
      FROM public.gm_orders o
      JOIN public.gm_order_items oi ON oi.order_id = o.id
      WHERE o.restaurant_id = ANY($1::UUID[])
        AND o.status IN ('OPEN', 'IN_PREP', 'PREPARING')
      GROUP BY o.id, o.restaurant_id
      HAVING COUNT(CASE WHEN oi.ready_at IS NULL AND
        (NOW() - oi.created_at) > (COALESCE(oi.prep_time_seconds, 300) * 1.2 * INTERVAL '1 second')
        THEN 1 END) > 0
      ORDER BY max_delay_seconds DESC
      LIMIT 10
    `,
      [restaurantIds],
    );

    logger.log(
      `  ✅ ${criticalOrders.rows.length} pedidos críticos detectados`,
    );
    for (const row of criticalOrders.rows.slice(0, 5)) {
      logger.log(
        `     Pedido ${row.short_id}: ${row.delayed_items}/${row.total_items} itens atrasados (max: ${row.max_delay_seconds}s)`,
      );
    }

    // 4. Validar timers por estação (itens ainda não prontos)
    logger.log("\n⏱️  Validando timers por estação...");
    const timerValidation = await pool.query(
      `
      SELECT
        oi.station,
        COUNT(*) as items_count,
        AVG(EXTRACT(EPOCH FROM (NOW() - oi.created_at))) as avg_elapsed_seconds,
        AVG(COALESCE(oi.prep_time_seconds, 300)) as avg_prep_time_seconds,
        COUNT(CASE WHEN
          (NOW() - oi.created_at) > (COALESCE(oi.prep_time_seconds, 300) * 1.2 * INTERVAL '1 second')
          THEN 1 END) as delayed_count,
        COUNT(CASE WHEN
          (NOW() - oi.created_at) > (COALESCE(oi.prep_time_seconds, 300) * 1.5 * INTERVAL '1 second')
          THEN 1 END) as critical_count
      FROM public.gm_order_items oi
      JOIN public.gm_orders o ON o.id = oi.order_id
      WHERE o.restaurant_id = ANY($1::UUID[])
        AND o.status IN ('OPEN', 'IN_PREP', 'PREPARING')
        AND oi.ready_at IS NULL
      GROUP BY oi.station
    `,
      [restaurantIds],
    );

    for (const row of timerValidation.rows) {
      const avgElapsed = Math.round(row.avg_elapsed_seconds);
      const avgPrep = Math.round(row.avg_prep_time_seconds);
      const delayPercent =
        row.items_count > 0
          ? Math.round((row.delayed_count / row.items_count) * 100)
          : 0;
      const criticalPercent =
        row.items_count > 0
          ? Math.round((row.critical_count / row.items_count) * 100)
          : 0;

      logger.log(`  ✅ ${row.station || "N/A"}:`);
      logger.log(
        `     Tempo decorrido médio: ${avgElapsed}s (estimado: ${avgPrep}s)`,
      );
      logger.log(
        `     Atrasados (>120%): ${row.delayed_count} (${delayPercent}%)`,
      );
      logger.log(
        `     Críticos (>150%): ${row.critical_count} (${criticalPercent}%)`,
      );
    }

    // 5. Validar alertas de atraso
    logger.log("\n🚨 Validando alertas de atraso...");
    const alertValidation = await pool.query(
      `
      SELECT
        oi.station,
        COUNT(*) as items_with_alerts,
        AVG(EXTRACT(EPOCH FROM (NOW() - oi.created_at - (COALESCE(oi.prep_time_seconds, 300) * INTERVAL '1 second')))) as avg_delay_seconds
      FROM public.gm_order_items oi
      JOIN public.gm_orders o ON o.id = oi.order_id
      WHERE o.restaurant_id = ANY($1::UUID[])
        AND o.status IN ('OPEN', 'IN_PREP', 'PREPARING')
        AND oi.ready_at IS NULL
        AND (NOW() - oi.created_at) > (COALESCE(oi.prep_time_seconds, 300) * 1.2 * INTERVAL '1 second')
      GROUP BY oi.station
    `,
      [restaurantIds],
    );

    for (const row of alertValidation.rows) {
      const avgDelay = Math.round(row.avg_delay_seconds);
      logger.log(
        `  ✅ ${row.station || "N/A"}: ${
          row.items_with_alerts
        } itens com alerta (atraso médio: ${avgDelay}s)`,
      );
    }

    // 6. Validar estado dos itens
    logger.log("\n🔍 Validando estado dos itens...");
    const stateValidation = await pool.query(
      `
      SELECT
        COUNT(*) as total_items,
        COUNT(CASE WHEN oi.ready_at IS NULL THEN 1 END) as pending_items,
        COUNT(CASE WHEN oi.ready_at IS NOT NULL THEN 1 END) as ready_items
      FROM public.gm_order_items oi
      JOIN public.gm_orders o ON o.id = oi.order_id
      WHERE o.restaurant_id = ANY($1::UUID[])
        AND o.status IN ('OPEN', 'IN_PREP', 'PREPARING')
    `,
      [restaurantIds],
    );

    const stats = stateValidation.rows[0];
    logger.log(`  ✅ Total de itens: ${stats.total_items}`);
    logger.log(`     Pendentes (ready_at IS NULL): ${stats.pending_items}`);
    logger.log(`     Prontos (ready_at IS NOT NULL): ${stats.ready_items}`);

    logger.log(`\n✅ KDS Stress concluído:`);
    logger.log(`   - Estações validadas: ${stationGroups.rows.length}`);
    logger.log(
      `   - Gargalos criados: ${barBottleneck.rowCount} (BAR) + ${kitchenBottleneck.rowCount} (KITCHEN)`,
    );
    logger.log(`   - Pedidos críticos: ${criticalOrders.rows.length}`);

    const duration = Date.now() - startTime;

    // Sinalizar conclusão da FASE 3 no Progress Bus
    emitProgress(context, {
      phase: "FASE 3: KDS Stress",
      step: "complete",
      op: "INFO",
      message: `COMPLETA (${duration}ms) - ${criticalOrders.rows.length} pedidos críticos, ${stats.total_items} itens`,
      resource: "public.gm_order_items",
    });

    return {
      success: true,
      duration,
      data: {
        stationsValidated: stationGroups.rows.length,
        barBottleneck: barBottleneck.rowCount,
        kitchenBottleneck: kitchenBottleneck.rowCount,
        criticalOrders: criticalOrders.rows.length,
        totalItems: parseInt(stats.total_items),
        pendingItems: parseInt(stats.pending_items),
        readyItems: parseInt(stats.ready_items),
      },
      errors,
      warnings,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 3: ${errorMsg}`, "ERROR");

    emitProgress(context, {
      phase: "FASE 3: KDS Stress",
      step: "failed",
      op: "ERROR",
      message: errorMsg,
      resource: "public.gm_order_items",
    });

    errors.push({
      phase: "FASE 3",
      severity: "HIGH",
      message: `Erro na fase de KDS stress: ${errorMsg}`,
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
