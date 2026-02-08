#!/usr/bin/env npx ts-node
/**
 * STRESS TEST ORDERS - ChefIApp
 * 
 * Creates concurrent orders across multiple restaurants to test system capacity.
 * 
 * Usage:
 *   npx ts-node scripts/stress-orders-massive.ts
 *   npx ts-node scripts/stress-orders-massive.ts --orders=100 --concurrency=10
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURATION
// =============================================================================

interface StressTestConfig {
  ordersPerRestaurant: number;
  concurrency: number;
  itemsPerOrder: { min: number; max: number };
  delayBetweenBatches: number; // ms
}

const DEFAULT_CONFIG: StressTestConfig = {
  ordersPerRestaurant: 10,
  concurrency: 5,
  itemsPerOrder: { min: 2, max: 5 },
  delayBetweenBatches: 100,
};

// =============================================================================
// TYPES
// =============================================================================

interface Restaurant {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price_cents: number;
}

interface Table {
  id: string;
  number: number;
}

interface OrderResult {
  orderId: string;
  restaurantId: string;
  tableId: string;
  itemCount: number;
  totalCents: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

interface StressTestResults {
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  totalItems: number;
  totalRevenueCents: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  p95LatencyMs: number;
  ordersPerSecond: number;
  duration: number;
  errors: string[];
  orderResults: OrderResult[];
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
// DATA FETCHERS
// =============================================================================

async function getTestRestaurants(supabase: SupabaseClient): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('gm_restaurants')
    .select('id, name')
    .like('name', 'Test Restaurant%')
    .limit(20);

  if (error) throw new Error(`Failed to fetch restaurants: ${error.message}`);
  return data || [];
}

async function getRestaurantProducts(supabase: SupabaseClient, restaurantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('gm_products')
    .select('id, name, price_cents')
    .eq('restaurant_id', restaurantId)
    .eq('available', true);

  if (error) throw new Error(`Failed to fetch products: ${error.message}`);
  return data || [];
}

async function getRestaurantTables(supabase: SupabaseClient, restaurantId: string): Promise<Table[]> {
  const { data, error } = await supabase
    .from('gm_tables')
    .select('id, number')
    .eq('restaurant_id', restaurantId);

  if (error) throw new Error(`Failed to fetch tables: ${error.message}`);
  return data || [];
}

// =============================================================================
// ORDER CREATION
// =============================================================================

async function createOrder(
  supabase: SupabaseClient,
  restaurantId: string,
  tableId: string,
  tableNumber: number,
  products: Product[],
  itemCount: number
): Promise<OrderResult> {
  const startTime = Date.now();
  
  try {
    // Select random products
    const selectedProducts: Product[] = [];
    for (let i = 0; i < itemCount; i++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      selectedProducts.push(randomProduct);
    }

    // Calculate total
    const totalCents = selectedProducts.reduce((sum, p) => sum + p.price_cents, 0);

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('gm_orders')
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        table_number: tableNumber,
        status: 'OPEN',
        payment_status: 'PENDING',
        total_cents: totalCents,
        subtotal_cents: totalCents,
        source: 'stress_test',
        metadata: { stress_test: true, timestamp: new Date().toISOString() },
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = selectedProducts.map(product => ({
      order_id: orderData.id,
      product_id: product.id,
      name_snapshot: product.name,
      price_snapshot: product.price_cents,
      quantity: 1,
      subtotal_cents: product.price_cents,
    }));

    const { error: itemsError } = await supabase
      .from('gm_order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    const latencyMs = Date.now() - startTime;

    return {
      orderId: orderData.id,
      restaurantId,
      tableId,
      itemCount: selectedProducts.length,
      totalCents,
      latencyMs,
      success: true,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    return {
      orderId: '',
      restaurantId,
      tableId,
      itemCount: 0,
      totalCents: 0,
      latencyMs,
      success: false,
      error: errorMsg,
    };
  }
}

// =============================================================================
// STRESS TEST EXECUTION
// =============================================================================

async function runStressTest(config: StressTestConfig): Promise<StressTestResults> {
  const supabase = getSupabaseClient();
  const startTime = Date.now();
  const orderResults: OrderResult[] = [];
  const errors: string[] = [];

  console.log('🔥 Starting Stress Test');
  console.log(`   Orders per restaurant: ${config.ordersPerRestaurant}`);
  console.log(`   Concurrency: ${config.concurrency}`);
  console.log(`   Items per order: ${config.itemsPerOrder.min}-${config.itemsPerOrder.max}`);
  console.log('');

  // Get test restaurants
  const restaurants = await getTestRestaurants(supabase);
  
  if (restaurants.length === 0) {
    throw new Error('No test restaurants found. Run seed-massive-test.ts first.');
  }

  console.log(`📍 Found ${restaurants.length} test restaurants`);
  console.log('');

  // Process each restaurant
  for (const restaurant of restaurants) {
    console.log(`🍽️  Testing ${restaurant.name}...`);

    try {
      const products = await getRestaurantProducts(supabase, restaurant.id);
      const tables = await getRestaurantTables(supabase, restaurant.id);

      if (products.length === 0) {
        console.log(`   ⚠️  No products found, skipping`);
        continue;
      }

      if (tables.length === 0) {
        console.log(`   ⚠️  No tables found, skipping`);
        continue;
      }

      // Close any existing OPEN orders on test tables first
      // This respects the constraint: one OPEN order per table
      console.log(`   🔄 Closing existing OPEN orders on test tables...`);
      for (const table of tables) {
        await supabase
          .from('gm_orders')
          .update({ status: 'CLOSED', payment_status: 'PAID' })
          .eq('restaurant_id', restaurant.id)
          .eq('table_id', table.id)
          .eq('status', 'OPEN');
      }

      // Create orders in batches
      const orderPromises: Promise<OrderResult>[] = [];
      
      for (let i = 0; i < config.ordersPerRestaurant; i++) {
        // Use different tables to avoid constraint violation
        // Or reuse tables but ensure previous orders are closed
        const table = tables[i % tables.length];
        const itemCount = Math.floor(
          Math.random() * (config.itemsPerOrder.max - config.itemsPerOrder.min + 1)
        ) + config.itemsPerOrder.min;

        orderPromises.push(
          createOrder(supabase, restaurant.id, table.id, table.number, products, itemCount)
        );

        // Execute in batches based on concurrency
        if (orderPromises.length >= config.concurrency) {
          const batchResults = await Promise.all(orderPromises.splice(0, config.concurrency));
          orderResults.push(...batchResults);
          
          if (config.delayBetweenBatches > 0) {
            await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
          }
        }
      }

      // Process remaining orders
      if (orderPromises.length > 0) {
        const batchResults = await Promise.all(orderPromises);
        orderResults.push(...batchResults);
      }

      const restaurantResults = orderResults.filter(r => r.restaurantId === restaurant.id);
      const successCount = restaurantResults.filter(r => r.success).length;
      console.log(`   ✅ ${successCount}/${config.ordersPerRestaurant} orders created`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`${restaurant.name}: ${errorMsg}`);
      console.log(`   ❌ Error: ${errorMsg}`);
    }
  }

  // =============================================================================
  // VALIDATION: Assert Constitutional Rules
  // =============================================================================
  
  console.log('');
  console.log('🔍 Validating Constitutional Rules...');
  
  // Assert: Uma mesa não pode ter dois pedidos abertos
  for (const restaurant of restaurants) {
    const { data: openOrders, error: ordersError } = await supabase
      .from('gm_orders')
      .select('table_id, id')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'OPEN');
    
    if (ordersError) {
      console.warn(`   ⚠️  Could not validate rules for ${restaurant.name}: ${ordersError.message}`);
      continue;
    }
    
    // Count orders per table
    const tableCounts = new Map<string, number>();
    openOrders?.forEach(order => {
      if (order.table_id) {
        const count = tableCounts.get(order.table_id) || 0;
        tableCounts.set(order.table_id, count + 1);
      }
    });
    
    // Verify no table has more than 1 open order
    let violations = 0;
    for (const [tableId, count] of tableCounts.entries()) {
      if (count > 1) {
        violations++;
        console.error(`   ❌ VIOLATION: Table ${tableId} has ${count} open orders (expected ≤1)`);
      }
    }
    
    if (violations === 0) {
      console.log(`   ✅ ${restaurant.name}: All tables respect 'one open order per table' rule`);
    } else {
      throw new Error(`Constitutional rule violated: ${violations} tables have multiple open orders`);
    }
  }
  
  console.log('   ✅ All constitutional rules validated');
  console.log('');

  // Calculate results
  const duration = Date.now() - startTime;
  const successfulOrders = orderResults.filter(r => r.success);
  const latencies = successfulOrders.map(r => r.latencyMs).sort((a, b) => a - b);

  const results: StressTestResults = {
    totalOrders: orderResults.length,
    successfulOrders: successfulOrders.length,
    failedOrders: orderResults.filter(r => !r.success).length,
    totalItems: successfulOrders.reduce((sum, r) => sum + r.itemCount, 0),
    totalRevenueCents: successfulOrders.reduce((sum, r) => sum + r.totalCents, 0),
    avgLatencyMs: latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0,
    maxLatencyMs: latencies.length > 0 ? Math.max(...latencies) : 0,
    minLatencyMs: latencies.length > 0 ? Math.min(...latencies) : 0,
    p95LatencyMs: latencies.length > 0 
      ? latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1]
      : 0,
    ordersPerSecond: duration > 0 ? (successfulOrders.length / duration) * 1000 : 0,
    duration,
    errors,
    orderResults,
  };

  // Print results
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 STRESS TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Total Orders: ${results.totalOrders}`);
  console.log(`   Successful: ${results.successfulOrders} (${((results.successfulOrders / results.totalOrders) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${results.failedOrders}`);
  console.log(`   Total Items: ${results.totalItems}`);
  console.log(`   Total Revenue: €${(results.totalRevenueCents / 100).toFixed(2)}`);
  console.log('');
  console.log('   LATENCY:');
  console.log(`   - Avg: ${results.avgLatencyMs.toFixed(0)}ms`);
  console.log(`   - Min: ${results.minLatencyMs}ms`);
  console.log(`   - Max: ${results.maxLatencyMs}ms`);
  console.log(`   - P95: ${results.p95LatencyMs}ms`);
  console.log('');
  console.log(`   THROUGHPUT: ${results.ordersPerSecond.toFixed(2)} orders/sec`);
  console.log(`   Duration: ${(results.duration / 1000).toFixed(2)}s`);
  console.log('═══════════════════════════════════════════════════════════');

  // Check success criteria
  const criteria = {
    successRate: results.successfulOrders / results.totalOrders >= 0.99,
    avgLatency: results.avgLatencyMs < 500,
    p95Latency: results.p95LatencyMs < 1000,
  };

  console.log('');
  console.log('✅ SUCCESS CRITERIA:');
  console.log(`   Success Rate >= 99%: ${criteria.successRate ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Avg Latency < 500ms: ${criteria.avgLatency ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   P95 Latency < 1000ms: ${criteria.p95Latency ? '✅ PASS' : '❌ FAIL'}`);

  // Save results
  const fs = await import('fs');
  const path = await import('path');
  const outputPath = `${process.cwd()}/test-results/stress-orders-${Date.now()}.json`;
  
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log('');
  console.log(`📄 Results saved to: ${outputPath}`);

  return results;
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): StressTestConfig {
  const config = { ...DEFAULT_CONFIG };
  
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--orders=')) {
      config.ordersPerRestaurant = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--concurrency=')) {
      config.concurrency = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help') {
      console.log(`
Usage: npx ts-node scripts/stress-orders-massive.ts [options]

Options:
  --orders=N        Orders per restaurant (default: 10)
  --concurrency=N   Concurrent requests (default: 5)
  --help            Show this help message

Example:
  npx ts-node scripts/stress-orders-massive.ts --orders=50 --concurrency=10
      `);
      process.exit(0);
    }
  }

  return config;
}

// Run if executed directly
if (require.main === module) {
  const config = parseArgs();
  runStressTest(config)
    .then((results) => {
      const allPassed = 
        results.successfulOrders / results.totalOrders >= 0.99 &&
        results.avgLatencyMs < 500;
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runStressTest, StressTestConfig, StressTestResults };
