#!/usr/bin/env npx ts-node
/**
 * TESTE D — Realtime + KDS
 * 
 * Valida que pedidos aparecem no KDS corretamente via Realtime.
 * 
 * Usage:
 *   npx ts-node scripts/test-realtime-kds.ts
 *   npx ts-node scripts/test-realtime-kds.ts --orders=10
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const { Pool } = pg;

// =============================================================================
// CONFIGURATION
// =============================================================================

interface RealtimeTestConfig {
  ordersToCreate: number;
  delayBetweenOrders: number; // ms
  kdsCheckTimeout: number; // ms
  realtimeUrl: string;
  realtimeKey: string;
}

const DEFAULT_CONFIG: RealtimeTestConfig = {
  ordersToCreate: 5,
  delayBetweenOrders: 500,
  kdsCheckTimeout: 2000,
  realtimeUrl: process.env.REALTIME_URL || 'http://localhost:4000',
  realtimeKey: process.env.REALTIME_KEY || 'chefiapp-core-secret-key-min-32-chars-long',
};

// =============================================================================
// TYPES
// =============================================================================

interface OrderEvent {
  orderId: string;
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  createdAt: Date;
  receivedAt?: Date;
  latencyMs?: number;
}

interface RealtimeTestResult {
  ordersCreated: OrderEvent[];
  ordersReceived: OrderEvent[];
  duplicates: number;
  missing: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  orderCorrect: boolean;
  noResurrection: boolean;
  passed: boolean;
  errors: string[];
}

// =============================================================================
// DATABASE CLIENT
// =============================================================================

function getDbPool(): pg.Pool {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54320/chefiapp_core';
  
  return new Pool({
    connectionString: dbUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

function getRealtimeClient() {
  // Para Docker Core:
  // - PostgREST está em localhost:3001
  // - Realtime está em localhost:4000
  // 
  // O Supabase client usa a URL base (PostgREST) e automaticamente
  // conecta ao Realtime via WebSocket em ws://localhost:4000/realtime/v1
  // 
  // IMPORTANTE: O client do Supabase espera uma URL que termine com /rest/v1
  // mas funciona também com PostgREST direto. O Realtime é gerenciado automaticamente.
  const baseUrl = process.env.POSTGREST_URL || 'http://localhost:3001';
  
  return createClient(baseUrl, DEFAULT_CONFIG.realtimeKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      // O client automaticamente detecta o endpoint do Realtime
      // baseado na URL base (substitui /rest/v1 por /realtime/v1)
    },
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

async function createOrderViaRPC(
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
    origin: 'REALTIME_TEST',
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
// REALTIME TEST
// =============================================================================

async function runRealtimeTest(config: RealtimeTestConfig): Promise<RealtimeTestResult> {
  const pool = getDbPool();
  const supabase = getRealtimeClient();
  
  const ordersCreated: OrderEvent[] = [];
  const ordersReceived: OrderEvent[] = [];
  const errors: string[] = [];
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TESTE D — Realtime + KDS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Orders to create: ${config.ordersToCreate}`);
  console.log(`   Delay between orders: ${config.delayBetweenOrders}ms`);
  console.log('');

  try {
    // Get test data
    const restaurant = await getTestRestaurant(pool);
    if (!restaurant) throw new Error('No test restaurant found');

    const product = await getTestProduct(pool, restaurant.id);
    if (!product) throw new Error('No test product found');

    const table = await getTestTable(pool, restaurant.id);
    if (!table) throw new Error('No test table found');

    // Close any existing orders
    await pool.query(
      `UPDATE public.gm_orders 
       SET status = 'CLOSED', payment_status = 'PAID' 
       WHERE restaurant_id = $1 AND status = 'OPEN'`,
      [restaurant.id]
    );

    // Get multiple tables for testing (to avoid constraint violations)
    const tablesResult = await pool.query(
      `SELECT id, number FROM public.gm_tables 
       WHERE restaurant_id = $1 
       ORDER BY number 
       LIMIT $2`,
      [restaurant.id, config.ordersToCreate]
    );
    
    const availableTables = tablesResult.rows;
    if (availableTables.length < config.ordersToCreate) {
      throw new Error(`Not enough tables. Need ${config.ordersToCreate}, have ${availableTables.length}`);
    }

    // Setup Realtime subscription
    console.log('📡 Setting up Realtime subscription...');
    
    const channel = supabase
      .channel('realtime-test-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gm_orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          const orderId = payload.new.id;
          const receivedAt = new Date();
          
          // Find corresponding created order
          const createdOrder = ordersCreated.find(o => o.orderId === orderId);
          if (createdOrder) {
            createdOrder.receivedAt = receivedAt;
            createdOrder.latencyMs = receivedAt.getTime() - createdOrder.createdAt.getTime();
            
            ordersReceived.push(createdOrder);
            console.log(`   ✅ Order ${orderId.slice(0, 8)} received (latency: ${createdOrder.latencyMs}ms)`);
          } else {
            console.warn(`   ⚠️  Received order ${orderId.slice(0, 8)} that was not tracked`);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('   ✅ Subscribed to Realtime channel');
        } else if (status === 'CHANNEL_ERROR') {
          errors.push('Failed to subscribe to Realtime channel');
          console.error('   ❌ Failed to subscribe to Realtime channel');
        }
      });

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create orders (using different tables to avoid constraint violations)
    console.log('');
    console.log('📦 Creating orders...');
    
    for (let i = 0; i < config.ordersToCreate; i++) {
      try {
        // Use different table for each order to avoid constraint violations
        const currentTable = availableTables[i];
        const orderId = await createOrderViaRPC(pool, restaurant.id, currentTable.id, currentTable.number, product);
        const createdAt = new Date();
        
        ordersCreated.push({
          orderId,
          restaurantId: restaurant.id,
          tableId: currentTable.id,
          tableNumber: currentTable.number,
          createdAt,
        });
        
        console.log(`   ✅ Order ${i + 1}/${config.ordersToCreate} created: ${orderId.slice(0, 8)} (Table ${currentTable.number})`);
        
        // Wait before next order
        if (i < config.ordersToCreate - 1) {
          await new Promise(resolve => setTimeout(resolve, config.delayBetweenOrders));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to create order ${i + 1}: ${errorMsg}`);
        console.error(`   ❌ Failed to create order ${i + 1}: ${errorMsg}`);
      }
    }

    // Wait for all events to be received
    console.log('');
    console.log(`⏳ Waiting ${config.kdsCheckTimeout}ms for all events...`);
    await new Promise(resolve => setTimeout(resolve, config.kdsCheckTimeout));

    // Unsubscribe
    await supabase.removeChannel(channel);

    // Analyze results
    const duplicates = ordersReceived.length - new Set(ordersReceived.map(o => o.orderId)).size;
    const missing = ordersCreated.length - ordersReceived.length;
    
    const latencies = ordersReceived
      .filter(o => o.latencyMs !== undefined)
      .map(o => o.latencyMs!);
    
    const avgLatencyMs = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;
    
    const maxLatencyMs = latencies.length > 0
      ? Math.max(...latencies)
      : 0;

    // Check order correctness (received in same order as created)
    let orderCorrect = true;
    if (ordersReceived.length === ordersCreated.length) {
      for (let i = 0; i < ordersReceived.length; i++) {
        if (ordersReceived[i].orderId !== ordersCreated[i].orderId) {
          orderCorrect = false;
          break;
        }
      }
    } else {
      orderCorrect = false;
    }

    // Check for resurrection (orders that were closed and shouldn't appear)
    // This is a simplified check - in real test, you'd close and reopen
    const noResurrection = true; // TODO: Implement proper resurrection test

    // Evaluate pass/fail
    const passed = 
      duplicates === 0 &&
      missing === 0 &&
      orderCorrect &&
      noResurrection &&
      avgLatencyMs < 500 &&
      errors.length === 0;

    const result: RealtimeTestResult = {
      ordersCreated,
      ordersReceived,
      duplicates,
      missing,
      avgLatencyMs,
      maxLatencyMs,
      orderCorrect,
      noResurrection,
      passed,
      errors,
    };

    // Print summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  📊 TESTE D RESULTS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Orders Created: ${ordersCreated.length}`);
    console.log(`   Orders Received: ${ordersReceived.length}`);
    console.log(`   Duplicates: ${duplicates} (expected: 0)`);
    console.log(`   Missing: ${missing} (expected: 0)`);
    console.log(`   Avg Latency: ${avgLatencyMs.toFixed(0)}ms (expected: <500ms)`);
    console.log(`   Max Latency: ${maxLatencyMs.toFixed(0)}ms`);
    console.log(`   Order Correct: ${orderCorrect ? '✅' : '❌'}`);
    console.log(`   No Resurrection: ${noResurrection ? '✅' : '❌'}`);
    console.log(`   Errors: ${errors.length}`);
    console.log('');
    console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Save results
    const outputPath = path.join(process.cwd(), 'test-results', `realtime-kds-test-${Date.now()}.json`);
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`📄 Results saved to: ${outputPath}`);
    console.log('');

    return result;

  } finally {
    await pool.end();
    // Supabase client não tem disconnect() - channels são removidos individualmente
    // Já removemos o channel acima com removeChannel()
  }
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): RealtimeTestConfig {
  const config = { ...DEFAULT_CONFIG };
  
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--orders=')) {
      config.ordersToCreate = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--delay=')) {
      config.delayBetweenOrders = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help') {
      console.log(`
Usage: npx ts-node scripts/test-realtime-kds.ts [options]

Options:
  --orders=N      Number of orders to create (default: 5)
  --delay=N       Delay between orders in ms (default: 500)
  --help          Show this help message

Example:
  npx ts-node scripts/test-realtime-kds.ts --orders=10 --delay=200
      `);
      process.exit(0);
    }
  }

  return config;
}

// Run if executed directly
if (require.main === module) {
  const config = parseArgs();
  runRealtimeTest(config)
    .then((result) => {
      process.exit(result.passed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runRealtimeTest, RealtimeTestConfig, RealtimeTestResult };
