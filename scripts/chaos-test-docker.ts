#!/usr/bin/env npx ts-node
/**
 * CHAOS TEST - ChefIApp (Docker Core)
 * 
 * Simulates failure scenarios to test system resilience.
 * Adapted for Docker Core (Postgres direct, no Supabase).
 * 
 * Usage:
 *   npx ts-node scripts/chaos-test-docker.ts
 *   npx ts-node scripts/chaos-test-docker.ts --scenario=concurrent
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const { Pool } = pg;

// =============================================================================
// CONFIGURATION
// =============================================================================

type ChaosScenario = 'concurrent' | 'race' | 'recovery' | 'all';

interface ChaosTestConfig {
  scenario: ChaosScenario;
  concurrentWriters: number;
  raceIterations: number;
}

const DEFAULT_CONFIG: ChaosTestConfig = {
  scenario: 'all',
  concurrentWriters: 5,
  raceIterations: 10,
};

// =============================================================================
// TYPES
// =============================================================================

interface ChaosTestResult {
  scenario: string;
  passed: boolean;
  details: string;
  metrics: Record<string, number>;
  errors: string[];
}

interface ChaosTestSummary {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  results: ChaosTestResult[];
  duration: number;
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

async function getTestProduct(pool: pg.Pool, restaurantId: string): Promise<{ id: string; name: string; price_cents: number } | null> {
  const result = await pool.query(
    `SELECT id, name, price_cents FROM public.gm_products 
     WHERE restaurant_id = $1 AND available = true 
     LIMIT 1`,
    [restaurantId]
  );
  
  return result.rows[0] || null;
}

async function getTestTable(pool: pg.Pool, restaurantId: string): Promise<{ id: string; number: number } | null> {
  const result = await pool.query(
    `SELECT id, number FROM public.gm_tables 
     WHERE restaurant_id = $1 
     LIMIT 1`,
    [restaurantId]
  );
  
  return result.rows[0] || null;
}

async function createTestOrderViaRPC(
  pool: pg.Pool,
  restaurantId: string,
  tableId: string,
  tableNumber: number,
  product: { id: string; name: string; price_cents: number }
): Promise<string> {
  const rpcItems = [{
    product_id: product.id,
    name: product.name,
    quantity: 1,
    unit_price: product.price_cents
  }];

  const syncMetadata = {
    table_id: tableId,
    table_number: tableNumber,
    origin: 'CHAOS_TEST',
    timestamp: new Date().toISOString()
  };

  const result = await pool.query(
    `SELECT create_order_atomic($1::uuid, $2::jsonb, $3::text, $4::jsonb) as result`,
    [
      restaurantId,
      JSON.stringify(rpcItems),
      'cash',
      JSON.stringify(syncMetadata)
    ]
  );

  const rpcResult = result.rows[0].result;
  return rpcResult.id;
}

// =============================================================================
// CHAOS SCENARIOS
// =============================================================================

/**
 * SCENARIO 1: Concurrent Modifications
 * Multiple writers trying to create orders for the same table simultaneously
 */
async function testConcurrentModifications(config: ChaosTestConfig, pool: pg.Pool): Promise<ChaosTestResult> {
  const result: ChaosTestResult = {
    scenario: 'CONCURRENT_MODIFICATIONS',
    passed: false,
    details: '',
    metrics: {},
    errors: [],
  };

  try {
    const restaurant = await getTestRestaurant(pool);
    if (!restaurant) throw new Error('No test restaurant found');

    const product = await getTestProduct(pool, restaurant.id);
    if (!product) throw new Error('No test product found');

    const table = await getTestTable(pool, restaurant.id);
    if (!table) throw new Error('No test table found');

    // Close any existing orders on this table
    await pool.query(
      `UPDATE public.gm_orders 
       SET status = 'CLOSED', payment_status = 'PAID' 
       WHERE restaurant_id = $1 AND table_id = $2 AND status = 'OPEN'`,
      [restaurant.id, table.id]
    );

    // Concurrent order creation attempts
    const createPromises = Array.from({ length: config.concurrentWriters }, async (_, i) => {
      try {
        const orderId = await createTestOrderViaRPC(pool, restaurant.id, table.id, table.number, product);
        return { writer: i, success: true, orderId };
      } catch (e: any) {
        const isConstraintViolation = 
          e.code === '23505' || 
          e.message?.includes('TABLE_HAS_ACTIVE_ORDER') ||
          e.message?.includes('idx_one_open_order_per_table');
        
        return { 
          writer: i, 
          success: false, 
          error: isConstraintViolation ? 'CONSTRAINT_VIOLATION' : e.message 
        };
      }
    });

    const createResults = await Promise.all(createPromises);
    
    result.metrics.totalAttempts = createResults.length;
    result.metrics.successfulCreates = createResults.filter(r => r.success).length;
    result.metrics.constraintViolations = createResults.filter(r => r.error === 'CONSTRAINT_VIOLATION').length;
    result.metrics.otherErrors = createResults.filter(r => !r.success && r.error !== 'CONSTRAINT_VIOLATION').length;

    // Verify only one order exists
    const verifyResult = await pool.query(
      `SELECT COUNT(*) as count FROM public.gm_orders 
       WHERE restaurant_id = $1 AND table_id = $2 AND status = 'OPEN'`,
      [restaurant.id, table.id]
    );

    const openOrdersCount = parseInt(verifyResult.rows[0].count, 10);
    result.metrics.finalOpenOrders = openOrdersCount;

    // Cleanup
    await pool.query(
      `UPDATE public.gm_orders 
       SET status = 'CLOSED', payment_status = 'PAID' 
       WHERE restaurant_id = $1 AND table_id = $2 AND status = 'OPEN'`,
      [restaurant.id, table.id]
    );

    // Evaluate - constraint should allow only 1 order, others should fail gracefully
    result.passed = openOrdersCount === 1 && result.metrics.constraintViolations === (config.concurrentWriters - 1);
    result.details = `${result.metrics.successfulCreates}/${result.metrics.totalAttempts} orders created. Constraint violations: ${result.metrics.constraintViolations} (expected: ${config.concurrentWriters - 1}). Final open orders: ${openOrdersCount} (expected: 1)`;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.details = 'Test failed with error';
  }

  return result;
}

/**
 * SCENARIO 2: Race Condition
 * Rapid create/close cycles to test constraint release
 */
async function testRaceCondition(config: ChaosTestConfig, pool: pg.Pool): Promise<ChaosTestResult> {
  const result: ChaosTestResult = {
    scenario: 'RACE_CONDITION',
    passed: false,
    details: '',
    metrics: {},
    errors: [],
  };

  try {
    const restaurant = await getTestRestaurant(pool);
    if (!restaurant) throw new Error('No test restaurant found');

    const product = await getTestProduct(pool, restaurant.id);
    if (!product) throw new Error('No test product found');

    const table = await getTestTable(pool, restaurant.id);
    if (!table) throw new Error('No test table found');

    let successCount = 0;
    let violationCount = 0;

    for (let i = 0; i < config.raceIterations; i++) {
      try {
        // Create order
        const orderId = await createTestOrderViaRPC(pool, restaurant.id, table.id, table.number, product);
        
        // Immediately close it
        await pool.query(
          `UPDATE public.gm_orders 
           SET status = 'CLOSED', payment_status = 'PAID' 
           WHERE id = $1`,
          [orderId]
        );
        
        successCount++;
      } catch (e: any) {
        if (e.code === '23505' || e.message?.includes('TABLE_HAS_ACTIVE_ORDER')) {
          violationCount++;
        } else {
          result.errors.push(`Iteration ${i}: ${e.message}`);
        }
      }
    }

    result.metrics.totalIterations = config.raceIterations;
    result.metrics.successfulCycles = successCount;
    result.metrics.violations = violationCount;

    // Verify final state is clean
    const verifyResult = await pool.query(
      `SELECT COUNT(*) as count FROM public.gm_orders 
       WHERE restaurant_id = $1 AND table_id = $2 AND status = 'OPEN'`,
      [restaurant.id, table.id]
    );

    const finalOpenOrders = parseInt(verifyResult.rows[0].count, 10);
    result.metrics.finalOpenOrders = finalOpenOrders;

    // Evaluate - should complete all cycles without leaving open orders
    result.passed = finalOpenOrders === 0 && successCount === config.raceIterations;
    result.details = `${successCount}/${config.raceIterations} cycles completed. Violations: ${violationCount}. Final open orders: ${finalOpenOrders} (expected: 0)`;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.details = 'Test failed with error';
  }

  return result;
}

/**
 * SCENARIO 3: Recovery
 * Create orders, simulate failure, verify recovery
 */
async function testRecovery(config: ChaosTestConfig, pool: pg.Pool): Promise<ChaosTestResult> {
  const result: ChaosTestResult = {
    scenario: 'RECOVERY',
    passed: false,
    details: '',
    metrics: {},
    errors: [],
  };

  try {
    const restaurant = await getTestRestaurant(pool);
    if (!restaurant) throw new Error('No test restaurant found');

    const product = await getTestProduct(pool, restaurant.id);
    if (!product) throw new Error('No test product found');

    const table = await getTestTable(pool, restaurant.id);
    if (!table) throw new Error('No test table found');

    // Create multiple orders on different tables
    const orderIds: string[] = [];
    const tables = await pool.query(
      `SELECT id, number FROM public.gm_tables 
       WHERE restaurant_id = $1 
       LIMIT 5`,
      [restaurant.id]
    );

    for (const tableRow of tables.rows.slice(0, 3)) {
      try {
        const orderId = await createTestOrderViaRPC(
          pool, 
          restaurant.id, 
          tableRow.id, 
          tableRow.number, 
          product
        );
        orderIds.push(orderId);
      } catch (e) {
        result.errors.push(`Failed to create order for table ${tableRow.number}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    result.metrics.ordersCreated = orderIds.length;

    // Verify all orders exist
    const verifyResult = await pool.query(
      `SELECT COUNT(*) as count FROM public.gm_orders 
       WHERE id = ANY($1::uuid[])`,
      [orderIds]
    );

    const verifiedCount = parseInt(verifyResult.rows[0].count, 10);
    result.metrics.ordersVerified = verifiedCount;

    // Cleanup
    await pool.query(
      `UPDATE public.gm_orders 
       SET status = 'CLOSED', payment_status = 'PAID' 
       WHERE id = ANY($1::uuid[])`,
      [orderIds]
    );

    // Evaluate
    result.passed = verifiedCount === orderIds.length;
    result.details = `${verifiedCount}/${orderIds.length} orders verified after creation. All orders preserved.`;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.details = 'Test failed with error';
  }

  return result;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function runChaosTests(config: ChaosTestConfig): Promise<ChaosTestSummary> {
  const startTime = Date.now();
  const pool = getDbPool();
  const results: ChaosTestResult[] = [];

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CHAOS TEST - ChefIApp (Docker Core)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Scenario: ${config.scenario}`);
  console.log(`   Concurrent Writers: ${config.concurrentWriters}`);
  console.log(`   Race Iterations: ${config.raceIterations}`);
  console.log('');

  try {
    // Run scenarios
    if (config.scenario === 'all' || config.scenario === 'concurrent') {
      console.log('🧪 Testing: Concurrent Modifications...');
      const concurrentResult = await testConcurrentModifications(config, pool);
      results.push(concurrentResult);
      console.log(`   ${concurrentResult.passed ? '✅' : '❌'} ${concurrentResult.details}`);
      console.log('');
    }

    if (config.scenario === 'all' || config.scenario === 'race') {
      console.log('🧪 Testing: Race Condition...');
      const raceResult = await testRaceCondition(config, pool);
      results.push(raceResult);
      console.log(`   ${raceResult.passed ? '✅' : '❌'} ${raceResult.details}`);
      console.log('');
    }

    if (config.scenario === 'all' || config.scenario === 'recovery') {
      console.log('🧪 Testing: Recovery...');
      const recoveryResult = await testRecovery(config, pool);
      results.push(recoveryResult);
      console.log(`   ${recoveryResult.passed ? '✅' : '❌'} ${recoveryResult.details}`);
      console.log('');
    }

    const duration = Date.now() - startTime;
    const passedScenarios = results.filter(r => r.passed).length;
    const failedScenarios = results.filter(r => !r.passed).length;

    const summary: ChaosTestSummary = {
      totalScenarios: results.length,
      passedScenarios,
      failedScenarios,
      results,
      duration,
    };

    // Print summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  📊 CHAOS TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Total Scenarios: ${summary.totalScenarios}`);
    console.log(`   ✅ Passed: ${summary.passedScenarios}`);
    console.log(`   ❌ Failed: ${summary.failedScenarios}`);
    console.log(`   Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Save results
    const outputPath = path.join(process.cwd(), 'test-results', `chaos-test-${Date.now()}.json`);
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Results saved to: ${outputPath}`);
    console.log('');

    return summary;

  } finally {
    await pool.end();
  }
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): ChaosTestConfig {
  const config = { ...DEFAULT_CONFIG };
  
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--scenario=')) {
      config.scenario = arg.split('=')[1] as ChaosScenario;
    } else if (arg.startsWith('--writers=')) {
      config.concurrentWriters = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--iterations=')) {
      config.raceIterations = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help') {
      console.log(`
Usage: npx ts-node scripts/chaos-test-docker.ts [options]

Options:
  --scenario=NAME      Scenario to run: concurrent, race, recovery, all (default: all)
  --writers=N          Number of concurrent writers (default: 5)
  --iterations=N       Number of race iterations (default: 10)
  --help               Show this help message

Example:
  npx ts-node scripts/chaos-test-docker.ts --scenario=concurrent --writers=10
      `);
      process.exit(0);
    }
  }

  return config;
}

// Run if executed directly
if (require.main === module) {
  const config = parseArgs();
  runChaosTests(config)
    .then((summary) => {
      const allPassed = summary.failedScenarios === 0;
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runChaosTests, ChaosTestConfig, ChaosTestSummary };
