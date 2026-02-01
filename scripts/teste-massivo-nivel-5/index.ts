/**
 * ORQUESTRADOR PRINCIPAL - Teste Massivo Nível 5
 * 
 * Executa todas as fases sequencialmente.
 */

import { getDbPool } from "./db";
import { Logger } from "./logger";
import type { TestContext, PhaseResult, RestaurantData } from "./types";
import {
  fase0Preflight,
} from "./fase-0-preflight";
import { fase1SetupMassivo } from "./fase-1-setup-massivo";
import { fase2PedidosCaos } from "./fase-2-pedidos-caos";
import { fase3KdsStress } from "./fase-3-kds-stress";
import { fase4TaskExtreme } from "./fase-4-task-extreme";
import { fase5EstoqueCascata } from "./fase-5-estoque-cascata";
import { fase6MultiDispositivo } from "./fase-6-multi-dispositivo";
import { fase7TimeWarp } from "./fase-7-time-warp";
import { fase8RelatorioFinal } from "./fase-8-relatorio-final";
import { SCENARIO_EXTREME } from "./types";
import { emitProgress } from "./progress";

async function hydrateRestaurantsFromDb(
  context: TestContext,
  mainLogger: Logger,
) {
  // Quando começamos a partir da FASE 3 (ou posterior) sem passar pela FASE 1,
  // precisamos reconstruir um contexto mínimo de restaurantes a partir do banco.
  //
  // Para o KDS Stress, só precisamos dos IDs dos restaurantes; os demais campos
  // são usados apenas para logging/telemetria em fases futuras.
  const pool = getDbPool();
  try {
    mainLogger.log(
      "🔄 Hidratando restaurantes a partir do banco (contexto mínimo para FASE 3)...",
    );
    const result = await pool.query(
      `
      SELECT id, name, slug, tenant_id
      FROM public.gm_restaurants
      ORDER BY id
      LIMIT 5000
    `,
    );

    const restaurants: RestaurantData[] = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      tenant_id: row.tenant_id,
      profile: "PEQUENO",
      tables: [],
      locations: [],
      equipment: [],
      ingredients: [],
      products: [],
      stockLevels: [],
      people: [],
    }));

    context.restaurants = restaurants;
    mainLogger.log(
      `✅ Contexto hidratado: ${restaurants.length} restaurantes carregados do banco`,
    );
  } catch (err: any) {
    mainLogger.log(
      `❌ Falha ao hidratar restaurantes para FASE 3: ${
        err?.message || String(err)
      }`,
      "ERROR",
    );
    throw err;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log("🚀 TESTE MASSIVO NÍVEL 5 - STRESS DE REALIDADE EXTREMA");
  console.log("====================================================");
  console.log(`Cenário: ${SCENARIO_EXTREME.name}`);
  console.log(`Restaurantes: ${SCENARIO_EXTREME.totalRestaurants}`);
  console.log(`Mesas: ${SCENARIO_EXTREME.totalTables} (estimado)`);
  console.log(`Pessoas: ${SCENARIO_EXTREME.totalPeople} (estimado)`);
  console.log(`Pedidos: ${SCENARIO_EXTREME.totalOrders} (estimado em 7 dias)`);
  console.log("====================================================\n");

  const pool = getDbPool();
  const mainLogger = new Logger("main");
  const context: TestContext = {
    restaurants: [],
    orders: [],
    tasks: [],
    stockLevels: [],
    people: [],
    errors: [],
    warnings: [],
    startTime: new Date(),
    metadata: {},
  };

  const phases: { name: string; fn: any }[] = [
    { name: "FASE 0: Preflight", fn: fase0Preflight },
    { name: "FASE 1: Setup Massivo", fn: fase1SetupMassivo },
    { name: "FASE 2: Pedidos Caos", fn: fase2PedidosCaos },
    { name: "FASE 3: KDS Stress", fn: fase3KdsStress },
    { name: "FASE 4: Task Extreme", fn: fase4TaskExtreme },
    { name: "FASE 5: Estoque Cascata", fn: fase5EstoqueCascata },
    { name: "FASE 6: Multi-Dispositivo", fn: fase6MultiDispositivo },
    { name: "FASE 7: Time Warp", fn: fase7TimeWarp },
    { name: "FASE 8: Relatório Final", fn: fase8RelatorioFinal },
  ];

  try {
    // Permite começar a partir de uma fase específica sem reexecutar todas as anteriores.
    // Convenção:
    // - 0: FASE 0 (preflight)
    // - 1: FASE 1
    // - 2: FASE 2
    // - 3: FASE 3 (KDS Stress)
    // ...
    const startFromPhaseEnv = process.env.START_FROM_PHASE;
    const startFromPhase = startFromPhaseEnv
      ? Number.parseInt(startFromPhaseEnv, 10)
      : 0;

    for (let idx = 0; idx < phases.length; idx++) {
      const phase = phases[idx];

      // FASE 0 (preflight) sempre roda para garantir run_id, progress bus e diretórios.
      if (idx !== 0 && idx < startFromPhase) {
        mainLogger.log(
          `\n>>> Pulando ${phase.name} (START_FROM_PHASE=${startFromPhase})...`,
          "WARN",
        );
        continue;
      }

      // Se vamos começar direto na FASE 3 (ou posterior) e o contexto ainda está vazio,
      // hidratamos restaurantes a partir do banco para o KDS Stress ter o universo correto.
      if (
        phase.name.startsWith("FASE 3") &&
        startFromPhase >= 3 &&
        context.restaurants.length === 0
      ) {
        await hydrateRestaurantsFromDb(context, mainLogger);
      }

      mainLogger.log(`\n>>> Iniciando ${phase.name}...`);
      emitProgress(context, {
        phase: phase.name,
        step: "start",
        op: "EXEC",
        message: "Iniciando fase",
      });
      const phaseLogger = new Logger(
        phase.name.toLowerCase().replace(/\s+/g, "-"),
      );
      
      const result: PhaseResult = await phase.fn(pool, phaseLogger, context);
      
      phaseLogger.flush();
      
      if (!context.phaseResults) {
        context.phaseResults = [];
      }
      context.phaseResults.push({ phase: phase.name, result });

      if (!result.success) {
        mainLogger.log(`❌ ${phase.name} FALHOU`, "ERROR");
        emitProgress(context, {
          phase: phase.name,
          step: "failed",
          op: "ERROR",
          message: "FALHOU",
        });
        if (result.errors.some((e) => e.severity === "CRITICAL")) {
          mainLogger.log("❌ Erro crítico detectado. Abortando teste.", "ERROR");
          emitProgress(context, {
            phase: phase.name,
            step: "abort",
            op: "ERROR",
            message: "Erro crítico: abortando",
          });
          break;
        }
      } else {
        mainLogger.log(`✅ ${phase.name} COMPLETA (${result.duration}ms)`);
        emitProgress(context, {
          phase: phase.name,
          step: "complete",
          op: "INFO",
          message: `COMPLETA (${result.duration}ms)`,
        });
      }
    }

    context.endTime = new Date();
    context.totalDuration = context.endTime.getTime() - context.startTime.getTime();

    mainLogger.log("\n=== TESTE COMPLETO ===");
    mainLogger.log(`Duração total: ${context.totalDuration}ms`);
    mainLogger.log(`Restaurantes criados: ${context.restaurants.length}`);
    mainLogger.log(`Erros: ${context.errors.length}`);
    mainLogger.log(`Avisos: ${context.warnings.length}`);
    mainLogger.flush();
    emitProgress(context, {
      phase: "FINAL",
      step: "done",
      op: "INFO",
      message: `Duração total: ${context.totalDuration}ms`,
    });

  } catch (error: any) {
    mainLogger.log(`❌ ERRO FATAL: ${error.message}`, "ERROR");
    mainLogger.flush();
    emitProgress(context, {
      phase: "FATAL",
      step: "exception",
      op: "ERROR",
      message: error.message || "Erro fatal",
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
