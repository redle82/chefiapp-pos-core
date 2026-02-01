#!/usr/bin/env npx ts-node
/**
 * TESTE C — CONCORRÊNCIA + TEMPO
 * 
 * Valida que o Core mantém consistência e performance ao longo do tempo.
 * 
 * Objetivo:
 *   - Pedidos abertos por períodos longos não degradam performance
 *   - Reabertura de mesas após espera funciona corretamente
 *   - Múltiplos ciclos sem degradação de memória/locks
 *   - Estado permanece consistente mesmo com esperas longas
 * 
 * Usage:
 *   npx ts-node scripts/test-concurrency-time.ts
 *   npx ts-node scripts/test-concurrency-time.ts --cycles=50 --wait-times=30,120,600
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const { Pool } = pg;

// =============================================================================
// CONFIGURATION
// =============================================================================

interface TestConfig {
  cycles: number;              // Quantos ciclos completos
  waitTimes: number[];         // Tempos de espera em segundos (ex: [30, 120, 600])
  tables: number;              // Quantas mesas usar
  restaurantId: string;
  itemsPerOrder: { min: number; max: number };
}

const DEFAULT_CONFIG: TestConfig = {
  cycles: 50,
  waitTimes: [30, 120, 600],  // 30s, 2min, 10min
  tables: 10,
  restaurantId: '00000000-0000-0000-0000-000000000100',
  itemsPerOrder: { min: 1, max: 3 },
};

// =============================================================================
// TYPES
// =============================================================================

interface Product {
  id: string;
  name: string;
  price_cents: number;
}

interface Table {
  id: string;
  number: number;
}

interface CycleResult {
  cycle: number;
  tableId: string;
  tableNumber: number;
  waitTimeSeconds: number;
  openLatencyMs: number;
  closeLatencyMs: number;
  reopenLatencyMs: number;
  success: boolean;
  error?: string;
  performanceDegraded?: boolean;  // Latência aumentou muito após espera
  stateInconsistent?: boolean;   // Estado inconsistente após espera
}

interface TestResults {
  totalCycles: number;
  successfulCycles: number;
  failedCycles: number;
  performanceDegradations: number;
  stateInconsistencies: number;
  avgOpenLatencyMs: number;
  avgCloseLatencyMs: number;
  avgReopenLatencyMs: number;
  maxLatencyMs: number;
  latencyByWaitTime: Record<number, { avg: number; max: number; count: number }>;
  duration: number;
  cycleResults: CycleResult[];
  errors: string[];
  passed: boolean;
}

// =============================================================================
// DATABASE CLIENT
// =============================================================================

function getDbPool(): pg.Pool {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54320/chefiapp_core';
  
  return new Pool({
    connectionString: dbUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getTestRestaurant(pool: pg.Pool): Promise<{ id: string; name: string } | null> {
  const result = await pool.query(
    `SELECT id, name FROM public.gm_restaurants 
     WHERE name LIKE 'Test Restaurant%' OR name LIKE 'Restaurante Piloto%'
     LIMIT 1`
  );
  
  return result.rows[0] || null;
}

async function getTestProduct(pool: pg.Pool, restaurantId: string): Promise<Product | null> {
  const result = await pool.query(
    `SELECT id, name, price_cents FROM public.gm_products 
     WHERE restaurant_id = $1 AND available = true 
     LIMIT 1`,
    [restaurantId]
  );
  
  return result.rows[0] || null;
}

async function getTestTables(pool: pg.Pool, restaurantId: string, count: number): Promise<Table[]> {
  const result = await pool.query(
    `SELECT id, number FROM public.gm_tables 
     WHERE restaurant_id = $1 
     ORDER BY number 
     LIMIT $2`,
    [restaurantId, count]
  );
  
  return result.rows;
}

async function createOrderViaRPC(
  pool: pg.Pool,
  restaurantId: string,
  tableId: string,
  tableNumber: number,
  product: Product
): Promise<string> {
  const rpcItems = [{
    product_id: product.id,
    name: product.name,
    quantity: 1,
    unit_price: product.price_cents,
  }];

  const result = await pool.query(
    `SELECT * FROM public.create_order_atomic($1, $2, $3, $4)`,
    [
      restaurantId,
      JSON.stringify(rpcItems),
      'cash',
      JSON.stringify({ table_id: tableId, table_number: tableNumber }),
    ]
  );

  const orderData = result.rows[0]?.create_order_atomic;
  if (!orderData || !orderData.id) {
    throw new Error('Failed to create order: RPC returned no order ID');
  }

  return orderData.id;
}

async function closeOrder(pool: pg.Pool, orderId: string): Promise<void> {
  await pool.query(
    `UPDATE public.gm_orders 
     SET status = 'CLOSED', payment_status = 'PAID' 
     WHERE id = $1`,
    [orderId]
  );
}

async function checkOrderState(pool: pg.Pool, orderId: string, expectedStatus: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT status FROM public.gm_orders WHERE id = $1`,
    [orderId]
  );
  
  return result.rows[0]?.status === expectedStatus;
}

// =============================================================================
// TEST EXECUTION
// =============================================================================

async function runConcurrencyTimeTest(config: TestConfig): Promise<TestResults> {
  const pool = getDbPool();
  const startTime = Date.now();
  
  const results: TestResults = {
    totalCycles: 0,
    successfulCycles: 0,
    failedCycles: 0,
    performanceDegradations: 0,
    stateInconsistencies: 0,
    avgOpenLatencyMs: 0,
    avgCloseLatencyMs: 0,
    avgReopenLatencyMs: 0,
    maxLatencyMs: 0,
    latencyByWaitTime: {},
    duration: 0,
    cycleResults: [],
    errors: [],
    passed: false,
  };

  const latencies = {
    open: [] as number[],
    close: [] as number[],
    reopen: [] as number[],
  };

  try {
    // Get test data
    const restaurant = await getTestRestaurant(pool);
    if (!restaurant) throw new Error('No test restaurant found');

    const product = await getTestProduct(pool, restaurant.id);
    if (!product) throw new Error('No test product found');

    const tables = await getTestTables(pool, restaurant.id, config.tables);
    if (tables.length < config.tables) {
      throw new Error(`Not enough tables. Need ${config.tables}, have ${tables.length}`);
    }

    // Close any existing orders
    await pool.query(
      `UPDATE public.gm_orders 
       SET status = 'CLOSED', payment_status = 'PAID' 
       WHERE restaurant_id = $1 AND status = 'OPEN'`,
      [restaurant.id]
    );

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TESTE C — Concorrência + Tempo');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Cycles: ${config.cycles}`);
    console.log(`   Wait times: ${config.waitTimes.join(', ')}s`);
    console.log(`   Tables: ${config.tables}`);
    console.log('');

    // Baseline: measure initial latency
    console.log('📊 Measuring baseline latency...');
    const baselineStart = Date.now();
    const baselineOrderId = await createOrderViaRPC(
      pool,
      restaurant.id,
      tables[0].id,
      tables[0].number,
      product
    );
    const baselineLatency = Date.now() - baselineStart;
    await closeOrder(pool, baselineOrderId);
    console.log(`   Baseline latency: ${baselineLatency}ms`);
    console.log('');

    // Run cycles
    let cycleIndex = 0;
    for (let i = 0; i < config.cycles; i++) {
      const table = tables[i % tables.length];
      const waitTime = config.waitTimes[i % config.waitTimes.length];
      
      cycleIndex++;
      const cycleResult: CycleResult = {
        cycle: cycleIndex,
        tableId: table.id,
        tableNumber: table.number,
        waitTimeSeconds: waitTime,
        openLatencyMs: 0,
        closeLatencyMs: 0,
        reopenLatencyMs: 0,
        success: false,
      };

      try {
        // 1. Open order
        const openStart = Date.now();
        const orderId = await createOrderViaRPC(
          pool,
          restaurant.id,
          table.id,
          table.number,
          product
        );
        cycleResult.openLatencyMs = Date.now() - openStart;
        latencies.open.push(cycleResult.openLatencyMs);

        // 2. Wait (simulating long-lived order)
        console.log(`   Cycle ${cycleIndex}/${config.cycles}: Table ${table.number}, waiting ${waitTime}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));

        // 3. Verify order state is still consistent
        const stateConsistent = await checkOrderState(pool, orderId, 'OPEN');
        if (!stateConsistent) {
          cycleResult.stateInconsistent = true;
          results.stateInconsistencies++;
          results.errors.push(`Cycle ${cycleIndex}: Order state inconsistent after wait`);
        }

        // 4. Close order
        const closeStart = Date.now();
        await closeOrder(pool, orderId);
        cycleResult.closeLatencyMs = Date.now() - closeStart;
        latencies.close.push(cycleResult.closeLatencyMs);

        // 5. Wait a bit before reopening
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 6. Reopen order on same table
        const reopenStart = Date.now();
        const newOrderId = await createOrderViaRPC(
          pool,
          restaurant.id,
          table.id,
          table.number,
          product
        );
        cycleResult.reopenLatencyMs = Date.now() - reopenStart;
        latencies.reopen.push(cycleResult.reopenLatencyMs);

        // 7. Check for performance degradation
        // If latency is > 3x baseline, consider it degraded
        if (cycleResult.reopenLatencyMs > baselineLatency * 3) {
          cycleResult.performanceDegraded = true;
          results.performanceDegradations++;
        }

        // 8. Close the reopened order
        await closeOrder(pool, newOrderId);

        cycleResult.success = true;
        results.successfulCycles++;

        // Track latency by wait time
        if (!results.latencyByWaitTime[waitTime]) {
          results.latencyByWaitTime[waitTime] = { avg: 0, max: 0, count: 0 };
        }
        const waitTimeStats = results.latencyByWaitTime[waitTime];
        waitTimeStats.count++;
        waitTimeStats.max = Math.max(waitTimeStats.max, cycleResult.reopenLatencyMs);
        waitTimeStats.avg = (waitTimeStats.avg * (waitTimeStats.count - 1) + cycleResult.reopenLatencyMs) / waitTimeStats.count;

        console.log(`   ✅ Cycle ${cycleIndex} completed (open: ${cycleResult.openLatencyMs}ms, close: ${cycleResult.closeLatencyMs}ms, reopen: ${cycleResult.reopenLatencyMs}ms)`);

      } catch (error) {
        cycleResult.success = false;
        cycleResult.error = error instanceof Error ? error.message : String(error);
        results.failedCycles++;
        results.errors.push(`Cycle ${cycleIndex}: ${cycleResult.error}`);
        console.error(`   ❌ Cycle ${cycleIndex} failed: ${cycleResult.error}`);
      }

      results.cycleResults.push(cycleResult);
      results.totalCycles++;
    }

    // Calculate averages
    if (latencies.open.length > 0) {
      results.avgOpenLatencyMs = latencies.open.reduce((a, b) => a + b, 0) / latencies.open.length;
    }
    if (latencies.close.length > 0) {
      results.avgCloseLatencyMs = latencies.close.reduce((a, b) => a + b, 0) / latencies.close.length;
    }
    if (latencies.reopen.length > 0) {
      results.avgReopenLatencyMs = latencies.reopen.reduce((a, b) => a + b, 0) / latencies.reopen.length;
    }

    results.maxLatencyMs = Math.max(
      ...latencies.open,
      ...latencies.close,
      ...latencies.reopen
    );

    results.duration = Date.now() - startTime;

    // Determine pass/fail
    results.passed = 
      results.successfulCycles === results.totalCycles &&
      results.performanceDegradations === 0 &&
      results.stateInconsistencies === 0;

    // Print summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  📊 TESTE C RESULTS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Total Cycles: ${results.totalCycles}`);
    console.log(`   Successful: ${results.successfulCycles}`);
    console.log(`   Failed: ${results.failedCycles}`);
    console.log(`   Performance Degradations: ${results.performanceDegradations}`);
    console.log(`   State Inconsistencies: ${results.stateInconsistencies}`);
    console.log('');
    console.log(`   Avg Open Latency: ${results.avgOpenLatencyMs.toFixed(2)}ms`);
    console.log(`   Avg Close Latency: ${results.avgCloseLatencyMs.toFixed(2)}ms`);
    console.log(`   Avg Reopen Latency: ${results.avgReopenLatencyMs.toFixed(2)}ms`);
    console.log(`   Max Latency: ${results.maxLatencyMs}ms`);
    console.log('');
    console.log('   Latency by Wait Time:');
    Object.entries(results.latencyByWaitTime).forEach(([waitTime, stats]) => {
      console.log(`     ${waitTime}s: avg ${stats.avg.toFixed(2)}ms, max ${stats.max}ms (${stats.count} cycles)`);
    });
    console.log('');
    console.log(`   Duration: ${(results.duration / 1000).toFixed(2)}s`);
    console.log(`   Status: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Save results
    const outputDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const outputPath = path.join(outputDir, `concurrency-time-test-${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${outputPath}`);
    console.log('');

    return results;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.errors.push(`Fatal error: ${errorMsg}`);
    console.error(`❌ Fatal error: ${errorMsg}`);
    throw error;
  } finally {
    await pool.end();
  }
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): Partial<TestConfig> {
  const args = process.argv.slice(2);
  const config: Partial<TestConfig> = {};

  for (const arg of args) {
    if (arg.startsWith('--cycles=')) {
      config.cycles = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--wait-times=')) {
      config.waitTimes = arg.split('=')[1].split(',').map(s => parseInt(s.trim(), 10));
    } else if (arg.startsWith('--tables=')) {
      config.tables = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--restaurant-id=')) {
      config.restaurantId = arg.split('=')[1];
    }
  }

  return config;
}

// =============================================================================
// MAIN
// =============================================================================

if (require.main === module) {
  const config: TestConfig = {
    ...DEFAULT_CONFIG,
    ...parseArgs(),
  };

  runConcurrencyTimeTest(config)
    .then((results) => {
      process.exit(results.passed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { runConcurrencyTimeTest, TestConfig, TestResults };
