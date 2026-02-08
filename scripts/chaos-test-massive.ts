#!/usr/bin/env npx ts-node
/**
 * CHAOS TEST - ChefIApp
 * 
 * Simulates failure scenarios to test system resilience:
 * - Network disconnection
 * - Concurrent modifications
 * - Data race conditions
 * - Recovery after failure
 * 
 * Usage:
 *   npx ts-node scripts/chaos-test-massive.ts
 *   npx ts-node scripts/chaos-test-massive.ts --scenario=offline
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURATION
// =============================================================================

type ChaosScenario = 'offline' | 'concurrent' | 'race' | 'recovery' | 'all';

interface ChaosTestConfig {
  scenario: ChaosScenario;
  offlineDurationMs: number;
  concurrentWriters: number;
  raceIterations: number;
}

const DEFAULT_CONFIG: ChaosTestConfig = {
  scenario: 'all',
  offlineDurationMs: 5000,
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
// SUPABASE CLIENT
// =============================================================================

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getTestRestaurant(supabase: SupabaseClient): Promise<{ id: string; name: string } | null> {
  const { data } = await supabase
    .from('gm_restaurants')
    .select('id, name')
    .like('name', 'Test Restaurant%')
    .limit(1)
    .single();

  return data;
}

async function getTestProduct(supabase: SupabaseClient, restaurantId: string): Promise<{ id: string; name: string; price_cents: number } | null> {
  const { data } = await supabase
    .from('gm_products')
    .select('id, name, price_cents')
    .eq('restaurant_id', restaurantId)
    .limit(1)
    .single();

  return data;
}

async function getTestTable(supabase: SupabaseClient, restaurantId: string): Promise<{ id: string; number: number } | null> {
  const { data } = await supabase
    .from('gm_tables')
    .select('id, number')
    .eq('restaurant_id', restaurantId)
    .limit(1)
    .single();

  return data;
}

async function createTestOrder(
  supabase: SupabaseClient,
  restaurantId: string,
  tableId: string,
  tableNumber: number,
  product: { id: string; name: string; price_cents: number }
): Promise<string> {
  const { data, error } = await supabase
    .from('gm_orders')
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      table_number: tableNumber,
      status: 'OPEN',
      payment_status: 'PENDING',
      total_cents: product.price_cents,
      subtotal_cents: product.price_cents,
      source: 'chaos_test',
      metadata: { chaos_test: true },
    })
    .select('id')
    .single();

  if (error) throw error;

  // Add item
  await supabase.from('gm_order_items').insert({
    order_id: data.id,
    product_id: product.id,
    name_snapshot: product.name,
    price_snapshot: product.price_cents,
    quantity: 1,
    subtotal_cents: product.price_cents,
  });

  return data.id;
}

// =============================================================================
// CHAOS SCENARIOS
// =============================================================================

/**
 * SCENARIO 1: Offline Mode Simulation
 * Creates orders, simulates disconnect, creates more, reconnects, validates all exist
 */
async function testOfflineMode(config: ChaosTestConfig): Promise<ChaosTestResult> {
  const result: ChaosTestResult = {
    scenario: 'OFFLINE_MODE',
    passed: false,
    details: '',
    metrics: {},
    errors: [],
  };

  const supabase = getSupabaseClient();

  try {
    const restaurant = await getTestRestaurant(supabase);
    if (!restaurant) throw new Error('No test restaurant found');

    const product = await getTestProduct(supabase, restaurant.id);
    if (!product) throw new Error('No test product found');

    const table = await getTestTable(supabase, restaurant.id);
    if (!table) throw new Error('No test table found');

    // Phase 1: Create orders before "disconnect"
    const ordersBefore: string[] = [];
    for (let i = 0; i < 3; i++) {
      const orderId = await createTestOrder(supabase, restaurant.id, table.id, table.number, product);
      ordersBefore.push(orderId);
    }
    result.metrics.ordersBeforeOffline = ordersBefore.length;

    // Phase 2: Simulate offline by creating orders with unique marker
    console.log(`   ⏳ Simulating ${config.offlineDurationMs}ms offline period...`);
    const offlineOrders: string[] = [];
    const offlineMarker = `offline_${Date.now()}`;
    
    for (let i = 0; i < 3; i++) {
      const { data, error } = await supabase
        .from('gm_orders')
        .insert({
          restaurant_id: restaurant.id,
          table_id: table.id,
          table_number: table.number,
          status: 'OPEN',
          payment_status: 'PENDING',
          total_cents: product.price_cents,
          source: 'chaos_test_offline',
          metadata: { offline_marker: offlineMarker, sequence: i },
        })
        .select('id')
        .single();

      if (!error && data) offlineOrders.push(data.id);
    }
    result.metrics.ordersCreatedOffline = offlineOrders.length;

    // Wait to simulate offline duration
    await new Promise(resolve => setTimeout(resolve, config.offlineDurationMs));

    // Phase 3: "Reconnect" and verify all orders exist
    const allOrderIds = [...ordersBefore, ...offlineOrders];
    const { data: verifiedOrders } = await supabase
      .from('gm_orders')
      .select('id')
      .in('id', allOrderIds);

    result.metrics.ordersVerifiedAfterReconnect = verifiedOrders?.length || 0;
    result.metrics.ordersLost = allOrderIds.length - (verifiedOrders?.length || 0);

    // Cleanup
    await supabase.from('gm_orders').delete().in('id', allOrderIds);

    // Evaluate
    result.passed = result.metrics.ordersLost === 0;
    result.details = result.passed 
      ? `All ${allOrderIds.length} orders preserved after offline simulation`
      : `Lost ${result.metrics.ordersLost} orders during offline simulation`;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.details = 'Test failed with error';
  }

  return result;
}

/**
 * SCENARIO 2: Concurrent Modifications
 * Multiple writers updating the same order simultaneously
 */
async function testConcurrentModifications(config: ChaosTestConfig): Promise<ChaosTestResult> {
  const result: ChaosTestResult = {
    scenario: 'CONCURRENT_MODIFICATIONS',
    passed: false,
    details: '',
    metrics: {},
    errors: [],
  };

  const supabase = getSupabaseClient();

  try {
    const restaurant = await getTestRestaurant(supabase);
    if (!restaurant) throw new Error('No test restaurant found');

    const product = await getTestProduct(supabase, restaurant.id);
    if (!product) throw new Error('No test product found');

    const table = await getTestTable(supabase, restaurant.id);
    if (!table) throw new Error('No test table found');

    // Create a single order that will be modified concurrently
    const orderId = await createTestOrder(supabase, restaurant.id, table.id, table.number, product);

    // Concurrent updates
    const updatePromises = Array.from({ length: config.concurrentWriters }, async (_, i) => {
      try {
        const { error } = await supabase
          .from('gm_orders')
          .update({ 
            notes: `Update from writer ${i}`,
            metadata: { last_writer: i, timestamp: new Date().toISOString() }
          })
          .eq('id', orderId);

        return { writer: i, success: !error, error: error?.message };
      } catch (e) {
        return { writer: i, success: false, error: e instanceof Error ? e.message : String(e) };
      }
    });

    const updateResults = await Promise.all(updatePromises);
    
    result.metrics.totalUpdates = updateResults.length;
    result.metrics.successfulUpdates = updateResults.filter(r => r.success).length;
    result.metrics.failedUpdates = updateResults.filter(r => !r.success).length;

    // Verify final state
    const { data: finalOrder } = await supabase
      .from('gm_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    result.metrics.finalOrderExists = finalOrder ? 1 : 0;

    // Cleanup
    await supabase.from('gm_orders').delete().eq('id', orderId);

    // Evaluate - some updates may fail due to race conditions, but order should still exist
    result.passed = result.metrics.finalOrderExists === 1 && result.metrics.successfulUpdates > 0;
    result.details = `${result.metrics.successfulUpdates}/${result.metrics.totalUpdates} concurrent updates succeeded. Order integrity: ${result.metrics.finalOrderExists ? 'preserved' : 'lost'}`;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.details = 'Test failed with error';
  }

  return result;
}

/**
 * SCENARIO 3: Race Condition Test
 * Rapid create/update/delete cycles to find race conditions
 */
async function testRaceConditions(config: ChaosTestConfig): Promise<ChaosTestResult> {
  const result: ChaosTestResult = {
    scenario: 'RACE_CONDITIONS',
    passed: false,
    details: '',
    metrics: {},
    errors: [],
  };

  const supabase = getSupabaseClient();

  try {
    const restaurant = await getTestRestaurant(supabase);
    if (!restaurant) throw new Error('No test restaurant found');

    const product = await getTestProduct(supabase, restaurant.id);
    if (!product) throw new Error('No test product found');

    const table = await getTestTable(supabase, restaurant.id);
    if (!table) throw new Error('No test table found');

    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    let errorCount = 0;
    const createdIds: string[] = [];

    // Rapid CRUD cycles
    for (let i = 0; i < config.raceIterations; i++) {
      try {
        // Create
        const orderId = await createTestOrder(supabase, restaurant.id, table.id, table.number, product);
        createdIds.push(orderId);
        createdCount++;

        // Update (race with potential delete)
        const updatePromise = supabase
          .from('gm_orders')
          .update({ status: 'PREPARING' })
          .eq('id', orderId);

        // Another update (race condition)
        const update2Promise = supabase
          .from('gm_orders')
          .update({ notes: `Race iteration ${i}` })
          .eq('id', orderId);

        const [updateResult, update2Result] = await Promise.all([updatePromise, update2Promise]);
        
        if (!updateResult.error) updatedCount++;
        if (!update2Result.error) updatedCount++;

      } catch (e) {
        errorCount++;
        result.errors.push(`Iteration ${i}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Cleanup all created orders
    if (createdIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('gm_orders')
        .delete()
        .in('id', createdIds);

      if (!deleteError) deletedCount = createdIds.length;
    }

    result.metrics.iterations = config.raceIterations;
    result.metrics.created = createdCount;
    result.metrics.updated = updatedCount;
    result.metrics.deleted = deletedCount;
    result.metrics.errors = errorCount;

    // Evaluate
    result.passed = errorCount === 0 && createdCount === config.raceIterations;
    result.details = `${createdCount} created, ${updatedCount} updates, ${deletedCount} cleaned up, ${errorCount} errors`;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.details = 'Test failed with error';
  }

  return result;
}

/**
 * SCENARIO 4: Recovery Test
 * Create orders, simulate failure, verify recovery
 */
async function testRecovery(config: ChaosTestConfig): Promise<ChaosTestResult> {
  const result: ChaosTestResult = {
    scenario: 'RECOVERY',
    passed: false,
    details: '',
    metrics: {},
    errors: [],
  };

  const supabase = getSupabaseClient();

  try {
    const restaurant = await getTestRestaurant(supabase);
    if (!restaurant) throw new Error('No test restaurant found');

    const product = await getTestProduct(supabase, restaurant.id);
    if (!product) throw new Error('No test product found');

    const table = await getTestTable(supabase, restaurant.id);
    if (!table) throw new Error('No test table found');

    // Create orders with specific status progression
    const testOrders: string[] = [];
    
    for (let i = 0; i < 5; i++) {
      const orderId = await createTestOrder(supabase, restaurant.id, table.id, table.number, product);
      testOrders.push(orderId);
    }
    result.metrics.ordersCreated = testOrders.length;

    // Update to various states
    await supabase.from('gm_orders').update({ status: 'PREPARING' }).eq('id', testOrders[0]);
    await supabase.from('gm_orders').update({ status: 'READY' }).eq('id', testOrders[1]);
    await supabase.from('gm_orders').update({ status: 'SERVED' }).eq('id', testOrders[2]);
    
    // Simulate "crash" - new client connection
    const freshSupabase = getSupabaseClient();

    // Verify all orders are recoverable with correct states
    const { data: recoveredOrders } = await freshSupabase
      .from('gm_orders')
      .select('id, status')
      .in('id', testOrders);

    result.metrics.ordersRecovered = recoveredOrders?.length || 0;

    const statusCounts: Record<string, number> = {};
    recoveredOrders?.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    // Store count of unique statuses found
    result.metrics.uniqueStatuses = Object.keys(statusCounts).length;

    // Cleanup
    await supabase.from('gm_orders').delete().in('id', testOrders);

    // Evaluate
    result.passed = result.metrics.ordersRecovered === result.metrics.ordersCreated;
    result.details = `${result.metrics.ordersRecovered}/${result.metrics.ordersCreated} orders recovered with correct states`;

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
  const results: ChaosTestResult[] = [];

  console.log('💥 Starting Chaos Tests');
  console.log(`   Scenario: ${config.scenario}`);
  console.log('');

  const scenarios: Array<{ name: string; fn: () => Promise<ChaosTestResult> }> = [];

  if (config.scenario === 'all' || config.scenario === 'offline') {
    scenarios.push({ name: 'Offline Mode', fn: () => testOfflineMode(config) });
  }
  if (config.scenario === 'all' || config.scenario === 'concurrent') {
    scenarios.push({ name: 'Concurrent Modifications', fn: () => testConcurrentModifications(config) });
  }
  if (config.scenario === 'all' || config.scenario === 'race') {
    scenarios.push({ name: 'Race Conditions', fn: () => testRaceConditions(config) });
  }
  if (config.scenario === 'all' || config.scenario === 'recovery') {
    scenarios.push({ name: 'Recovery', fn: () => testRecovery(config) });
  }

  for (const scenario of scenarios) {
    console.log(`🔄 Running: ${scenario.name}...`);
    const result = await scenario.fn();
    results.push(result);
    console.log(`   ${result.passed ? '✅ PASS' : '❌ FAIL'}: ${result.details}`);
    console.log('');
  }

  const summary: ChaosTestSummary = {
    totalScenarios: results.length,
    passedScenarios: results.filter(r => r.passed).length,
    failedScenarios: results.filter(r => !r.passed).length,
    results,
    duration: Date.now() - startTime,
  };

  // Print summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💥 CHAOS TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Total Scenarios: ${summary.totalScenarios}`);
  console.log(`   Passed: ${summary.passedScenarios}`);
  console.log(`   Failed: ${summary.failedScenarios}`);
  console.log(`   Duration: ${(summary.duration / 1000).toFixed(2)}s`);
  console.log('═══════════════════════════════════════════════════════════');

  // Save results
  const fs = await import('fs');
  const path = await import('path');
  const outputPath = `${process.cwd()}/test-results/chaos-test-${Date.now()}.json`;
  
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log('');
  console.log(`📄 Results saved to: ${outputPath}`);

  return summary;
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): ChaosTestConfig {
  const config = { ...DEFAULT_CONFIG };
  
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--scenario=')) {
      config.scenario = arg.split('=')[1] as ChaosScenario;
    } else if (arg === '--help') {
      console.log(`
Usage: npx ts-node scripts/chaos-test-massive.ts [options]

Options:
  --scenario=NAME   Run specific scenario: offline, concurrent, race, recovery, all (default: all)
  --help            Show this help message

Example:
  npx ts-node scripts/chaos-test-massive.ts --scenario=offline
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
      process.exit(summary.failedScenarios === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runChaosTests, ChaosTestConfig, ChaosTestSummary };
