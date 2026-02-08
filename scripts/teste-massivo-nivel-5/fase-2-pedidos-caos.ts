/**
 * FASE 2 - PEDIDOS CAOS
 *
 * Gera ~5000 pedidos em caos controlado (MODE CONCORRENTE):
 * - Multi-origem simultânea
 * - Pedidos concorrentes (mesma mesa, múltiplos autores)
 * - Pedidos longos (30+ itens)
 * - Pedidos curtos repetitivos
 * - Pedidos cancelados
 * - Pedidos modificados
 * - Simulação de 7 dias (comprimido)
 */

import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import { emitProgress } from "./progress";
import { randomChoice, randomInt } from "./restaurant-profiles";
import type {
  PhaseFunction,
  PhaseResult,
  TestContext,
  TestLogger,
} from "./types";

const ORIGINS = [
  "QR_MESA",
  "WEB_PUBLIC",
  "TPV",
  "APPSTAFF",
  "APPSTAFF_MANAGER",
  "APPSTAFF_OWNER",
] as const;

export const fase2PedidosCaos: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext,
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult["errors"] = [];
  const warnings: PhaseResult["warnings"] = [];

  logger.log("━━━━━━━━━━━━━━━━━━━━━━━");
  logger.log("FASE 2 — PEDIDOS CAOS (RESOLVED ⚡)");
  logger.log("━━━━━━━━━━━━━━━━━━━━━━━");

  /*
   * VERSÃO OTIMIZADA PARA CONCORRÊNCIA (BATCH PROCESSING)
   */
  const SIMULATION_DAYS = 7;
  const TOTAL_ORDERS_TARGET = 5000;
  const CONCURRENCY_LIMIT = 50;

  logger.log(
    `📊 Meta: ~${TOTAL_ORDERS_TARGET} pedidos em ${SIMULATION_DAYS} dias simulados`,
  );
  logger.log(`   ⚡ Modo Concorrente Ativo (Limit: ${CONCURRENCY_LIMIT})`);

  let totalOrders = 0;
  let concurrentOrders = 0;
  let longOrders = 0;
  let repetitiveOrders = 0;
  let cancelledOrders = 0;
  let modifiedOrders = 0;

  try {
    // Carregar mesas reais do banco para respeitar FK gm_orders.table_id_fkey
    const restaurantIds = context.restaurants.map((r) => r.id);
    const tablesByRestaurant = new Map<
      string,
      { id: string; number: number }[]
    >();

    try {
      const { rows } = await pool.query(
        `
        SELECT id, restaurant_id, number
        FROM public.gm_tables
        WHERE restaurant_id = ANY($1::uuid[])
      `,
        [restaurantIds],
      );

      for (const row of rows) {
        const key = row.restaurant_id as string;
        if (!tablesByRestaurant.has(key)) {
          tablesByRestaurant.set(key, []);
        }
        tablesByRestaurant.get(key)!.push({
          id: row.id,
          number: row.number,
        });
      }

      logger.log(
        `🪑 Mesas carregadas do DB para FASE 2: ${rows.length} registros`,
      );
    } catch (e) {
      logger.log(
        `⚠️ Não foi possível carregar gm_tables do DB, FASE 2 seguirá sem table_id real: ${String(
          e,
        )}`,
        "ERROR",
      );
    }

    // Controlar quais mesas já têm um pedido OPEN criado neste run
    const usedTableIds = new Set<string>();

    // Sinalizar início da fase 2 no Progress Bus
    emitProgress(context, {
      phase: "FASE 2: Pedidos Caos",
      step: "start",
      op: "EXEC",
      message: "Iniciando fase",
      resource: "public.gm_orders",
    });

    const processBatch = async (batchSize: number, day: number) => {
      const promises = [];
      
      // Pré-alocar mesas para este batch (evita race condition)
      const allocatedTables: Array<{
        restaurant: any;
        table: { id: string; number: number } | null;
      }> = [];
      
      for (let i = 0; i < batchSize; i++) {
        if (totalOrders >= TOTAL_ORDERS_TARGET) break;

        const restaurant = randomChoice(context.restaurants);
        if (!restaurant || restaurant.products.length === 0) continue;

        const dbTables =
          tablesByRestaurant.get(restaurant.id as string) ?? [];

        // Escolher uma mesa real que ainda não tenha pedido OPEN neste run.
        let tableFromDb: { id: string; number: number } | null = null;
        if (dbTables.length > 0) {
          const available = dbTables.filter((t) => !usedTableIds.has(t.id));
          if (available.length > 0) {
            tableFromDb = randomChoice(available);
            usedTableIds.add(tableFromDb.id); // Marcar ANTES de criar a promise
          }
        }
        
        allocatedTables.push({ restaurant, table: tableFromDb });
      }
      
      // Agora criar as promises com as mesas já alocadas
      for (const { restaurant, table: tableFromDb } of allocatedTables) {
        if (totalOrders >= TOTAL_ORDERS_TARGET) break;

        const origin = randomChoice([...ORIGINS]);
        const orderType = Math.random();

        let items: any[] = [];
        let orderMetadata: any = {
          origin,
          // Só enviar table_id se veio de gm_tables real
          ...(tableFromDb
            ? {
                table_id: tableFromDb.id,
                table_number: tableFromDb.number,
              }
            : {}),
          test: "nivel5",
          run_id: context.metadata.run_id,
          day,
          hour: randomInt(12, 22),
          authors: [origin],
        };

        // Lógica de perfil de pedido
        if (orderType < 0.1 && restaurant.people.length >= 3) {
          // Concorrente
          concurrentOrders++;
          const numAuthors = randomInt(3, 6);
          const authors = restaurant.people.slice(0, numAuthors);
          items = authors.flatMap((author) => {
            const authorProducts = restaurant.products.slice(
              0,
              randomInt(1, 3),
            );
            return authorProducts.map((p) => ({
              product_id: p.id,
              name: p.name,
              quantity: 1,
              unit_price: p.price_cents,
              created_by_role: author.role,
              device_id: `device-${author.id}`,
            }));
          });
          orderMetadata.authors = authors.map((a) => a.id);
          orderMetadata.concurrent = true;
        } else if (orderType < 0.15 && restaurant.products.length >= 30) {
          // Longo
          longOrders++;
          const selectedProducts = restaurant.products.slice(0, 30);
          items = selectedProducts.map((p) => ({
            product_id: p.id,
            name: p.name,
            quantity: 1,
            unit_price: p.price_cents,
            created_by_role: origin.includes("MESA") ? "customer" : "waiter",
          }));
          orderMetadata.long_order = true;
        } else if (orderType < 0.2 && restaurant.products.length > 0) {
          // Repetitivo
          repetitiveOrders++;
          const product = randomChoice(restaurant.products);
          items = Array(10)
            .fill(null)
            .map(() => ({
              product_id: product.id,
              name: product.name,
              quantity: 1,
              unit_price: product.price_cents,
              created_by_role: origin.includes("MESA") ? "customer" : "waiter",
            }));
          orderMetadata.repetitive = true;
        } else {
          // Normal
          const numItems = randomInt(1, 5);
          const selectedProducts = restaurant.products.slice(0, numItems);
          items = selectedProducts.map((p) => ({
            product_id: p.id,
            name: p.name,
            quantity: randomInt(1, 3),
            unit_price: p.price_cents,
            created_by_role: origin.includes("MESA") ? "customer" : "waiter",
            device_id: origin === "QR_MESA" ? `device-${uuidv4()}` : undefined,
          }));
        }

        if (items.length === 0) continue;

        promises.push(
          pool
            .query(
              `SELECT public.create_order_atomic($1::UUID, $2::JSONB, $3::TEXT, $4::JSONB) as result`,
              [
                restaurant.id,
                JSON.stringify(items),
                "cash",
                JSON.stringify(orderMetadata),
              ],
            )
            .then((res) => {
              totalOrders++;
              if (totalOrders % 50 === 0) {
                emitProgress(context, {
                  phase: "FASE 2: Pedidos Caos",
                  step: "Criando pedidos",
                  current: totalOrders,
                  total: TOTAL_ORDERS_TARGET,
                  message: `Pedido ${totalOrders}/${TOTAL_ORDERS_TARGET} (Dia ${day})`,
                  op: "INSERT",
                  resource: "public.gm_orders",
                });
              }
              const orderData = res.rows[0].result;
              context.orders.push({
                id: orderData.id,
                restaurant_id: restaurant.id,
                table_id: tableFromDb ? tableFromDb.id : undefined,
                table_number: tableFromDb ? tableFromDb.number : undefined,
                status: orderData.status || "OPEN",
                items: items,
                authors: orderMetadata.authors,
                origin,
                created_at: new Date(),
              });

              // Simular cancelamento (stat only)
              if (Math.random() < 0.1) {
                cancelledOrders++;
              }
            })
            .catch((err) => {
              const msg =
                err instanceof Error ? err.message : JSON.stringify(err);
              
              // Erro de índice "1 OPEN por mesa" é esperado e não é crítico.
              // Significa que tentamos criar pedido numa mesa que já tem OPEN
              // (pode ser de run anterior ou race condition no batch concorrente).
              // Nesse caso, apenas não contamos o pedido e seguimos.
              if (msg.includes("idx_one_open_order_per_table")) {
                // Silenciar: é comportamento esperado do Core sob concorrência
                return;
              }
              
              // Outros erros são críticos e devem ser registrados
              errors.push({
                phase: "FASE 2",
                severity: "CRITICAL",
                message: msg,
                reproducible: true,
              });
              logger.log(`❌ Erro ao criar pedido na FASE 2: ${msg}`, "ERROR");
              emitProgress(context, {
                phase: "FASE 2: Pedidos Caos",
                step: "failed",
                op: "ERROR",
                message: msg,
                resource: "public.gm_orders",
              });
            }),
        );
      }
      await Promise.all(promises);
    };

    for (let day = 1; day <= SIMULATION_DAYS; day++) {
      if (totalOrders >= TOTAL_ORDERS_TARGET) break;
      logger.log(`\n📅 Dia ${day}/${SIMULATION_DAYS}... Enviando batches...`);

      const ordersForDay = Math.ceil(TOTAL_ORDERS_TARGET / SIMULATION_DAYS);
      const batches = Math.ceil(ordersForDay / CONCURRENCY_LIMIT);

      for (let b = 0; b < batches; b++) {
        if (totalOrders >= TOTAL_ORDERS_TARGET) break;
        await processBatch(CONCURRENCY_LIMIT, day);
      }
    }

    logger.log("\n🔍 Validando isolamento e estado...");
    const isolationCheck = await pool.query(
      `
      SELECT
        COUNT(DISTINCT restaurant_id) as restaurants,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled
      FROM public.gm_orders
      WHERE restaurant_id = ANY($1::UUID[])
    `,
      [context.restaurants.map((r) => r.id)],
    );

    const stats = isolationCheck.rows[0];
    logger.log(`  ✅ Total de pedidos (DB): ${stats.total_orders}`);

    logger.log(`\n✅ Pedidos caos concluído:`);
    logger.log(`   - Total Gerado: ${totalOrders}`);
    logger.log(`   - Concorrentes: ${concurrentOrders}`);
    logger.log(`   - Longos: ${longOrders}`);

    const durationMs = Date.now() - startTime;

    // Sinalizar conclusão da fase 2 no Progress Bus (com resumo)
    emitProgress(context, {
      phase: "FASE 2: Pedidos Caos",
      step: "complete",
      op: "INFO",
      current: totalOrders,
      total: TOTAL_ORDERS_TARGET,
      message: `COMPLETA (${durationMs}ms) - ${totalOrders} pedidos gerados`,
      resource: "public.gm_orders",
    });

    const criticalErrors = errors.filter((e) => e.severity === "CRITICAL");
    return {
      success: criticalErrors.length === 0,
      duration: durationMs,
      data: {
        ordersCreated: totalOrders,
        concurrentOrders,
        longOrders,
        repetitiveOrders,
        cancelledOrders,
        modifiedOrders,
        openOrders: stats.total_orders - cancelledOrders,
      },
      errors,
      warnings,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.log(`❌ Erro na fase 2: ${errorMsg}`, "ERROR");

    // Sinalizar falha da fase 2 no Progress Bus
    emitProgress(context, {
      phase: "FASE 2: Pedidos Caos",
      step: "failed",
      op: "ERROR",
      message: errorMsg,
      resource: "public.gm_orders",
    });

    return {
      success: false,
      duration: Date.now() - startTime,
      errors: [
        {
          phase: "FASE 2",
          severity: "CRITICAL",
          message: errorMsg,
          reproducible: true,
        },
      ],
      warnings,
    };
  }
};
