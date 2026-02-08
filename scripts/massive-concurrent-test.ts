#!/usr/bin/env npx ts-node
/**
 * MASSIVE CONCURRENT TEST - ChefIApp Core
 * 
 * Testa concorrência real: múltiplos pedidos simultâneos via RPC create_order_atomic
 * 
 * Fases:
 *   A1 - Stress lógico (50-200 pedidos simultâneos)
 *   A2 - Stress de interfaces (TPV + Web + Mobile)
 *   A3 - Offline brutal (queda de rede + replay)
 * 
 * Usage:
 *   npx ts-node scripts/massive-concurrent-test.ts
 *   npx ts-node scripts/massive-concurrent-test.ts --orders=100 --concurrency=20
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const { Pool } = pg;

// =============================================================================
// CONFIGURATION
// =============================================================================

interface TestConfig {
  totalOrders: number;
  concurrency: number;
  itemsPerOrder: { min: number; max: number };
  restaurantId: string; // ID do restaurante piloto
}

const DEFAULT_CONFIG: TestConfig = {
  totalOrders: 50,
  concurrency: 10,
  itemsPerOrder: { min: 1, max: 5 },
  restaurantId: '00000000-0000-0000-0000-000000000100', // Restaurante Piloto
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

interface OrderResult {
  orderId?: string;
  tableId: string;
  tableNumber: number;
  itemCount: number;
  totalCents: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  errorCode?: string;
  constraint?: string;
}

interface TestResults {
  phase: string;
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  constraintViolations: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  maxLatencyMs: number;
  ordersPerSecond: number;
  duration: number;
  orderResults: OrderResult[];
  errors: string[];
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
// DATA FETCHERS
// =============================================================================

async function getProducts(pool: pg.Pool, restaurantId: string): Promise<Product[]> {
  const result = await pool.query(
    `SELECT id, name, price_cents 
     FROM gm_products 
     WHERE restaurant_id = $1 AND available = true 
     LIMIT 20`,
    [restaurantId]
  );

  if (result.rows.length === 0) throw new Error('No products found');
  
  return result.rows;
}

async function getTables(pool: pg.Pool, restaurantId: string): Promise<Table[]> {
  const result = await pool.query(
    `SELECT id, number 
     FROM gm_tables 
     WHERE restaurant_id = $1 
     LIMIT 20`,
    [restaurantId]
  );

  if (result.rows.length === 0) throw new Error('No tables found');
  
  return result.rows;
}

// =============================================================================
// ORDER CREATION (via RPC create_order_atomic)
// =============================================================================

async function createOrderViaRPC(
  pool: pg.Pool,
  restaurantId: string,
  tableId: string,
  tableNumber: number,
  products: Product[],
  itemCount: number
): Promise<OrderResult> {
  const startTime = Date.now();
  
  try {
    // Selecionar produtos aleatórios
    const selectedProducts: Product[] = [];
    for (let i = 0; i < itemCount; i++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      selectedProducts.push(randomProduct);
    }

    // Preparar items no formato do RPC (JSONB)
    const rpcItems = selectedProducts.map(product => ({
      product_id: product.id,
      name: product.name,
      quantity: 1,
      unit_price: product.price_cents
    }));

    // Preparar sync_metadata com table_id e table_number
    const syncMetadata = {
      table_id: tableId,
      table_number: tableNumber,
      origin: 'STRESS_TEST',
      timestamp: new Date().toISOString()
    };

    // Chamar RPC create_order_atomic via SQL (JSONB)
    const result = await pool.query(
      `SELECT * FROM create_order_atomic($1::uuid, $2::jsonb, $3::text, $4::jsonb)`,
      [
        restaurantId,
        JSON.stringify(rpcItems),
        'cash',
        JSON.stringify(syncMetadata)
      ]
    );

    const latencyMs = Date.now() - startTime;
    const totalCents = selectedProducts.reduce((sum, p) => sum + p.price_cents, 0);
    const data = result.rows[0];

    return {
      orderId: data?.id,
      tableId,
      tableNumber,
      itemCount: selectedProducts.length,
      totalCents,
      latencyMs,
      success: true
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code;
    const constraint = error?.constraint;
    
    // Detectar constraint violation
    const isConstraintViolation = 
      errorCode === '23505' || 
      errorMsg?.includes('idx_one_open_order_per_table') ||
      errorMsg?.includes('TABLE_HAS_ACTIVE_ORDER');

    return {
      tableId,
      tableNumber,
      itemCount: 0,
      totalCents: 0,
      latencyMs,
      success: false,
      error: errorMsg,
      errorCode,
      constraint: isConstraintViolation ? 'idx_one_open_order_per_table' : constraint
    };
  }
}

// =============================================================================
// PHASE A1: STRESS LÓGICO
// =============================================================================

async function runPhaseA1(config: TestConfig): Promise<TestResults> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FASE A1: STRESS LÓGICO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Total de pedidos: ${config.totalOrders}`);
  console.log(`   Concorrência: ${config.concurrency}`);
  console.log(`   Itens por pedido: ${config.itemsPerOrder.min}-${config.itemsPerOrder.max}`);
  console.log('');

  const pool = getDbPool();
  const startTime = Date.now();
  const orderResults: OrderResult[] = [];
  const errors: string[] = [];

  try {
    // Buscar dados
    console.log('📦 Carregando dados...');
    const products = await getProducts(pool, config.restaurantId);
    const tables = await getTables(pool, config.restaurantId);
  
  console.log(`   ✅ ${products.length} produtos encontrados`);
  console.log(`   ✅ ${tables.length} mesas encontradas`);
  console.log('');

    // Fechar pedidos abertos existentes (respeitar constraint)
    console.log('🔄 Fechando pedidos abertos existentes...');
    try {
      await pool.query(
        `UPDATE gm_orders 
         SET status = 'CLOSED', payment_status = 'PAID' 
         WHERE restaurant_id = $1 AND status = 'OPEN'`,
        [config.restaurantId]
      );
      console.log('   ✅ Pedidos abertos fechados');
    } catch (closeError: any) {
      console.warn(`   ⚠️  Aviso ao fechar pedidos: ${closeError.message}`);
    }
    console.log('');

    // Criar pedidos em lotes concorrentes
    console.log('🚀 Criando pedidos simultâneos...');
    const orderPromises: Promise<OrderResult>[] = [];
    
    for (let i = 0; i < config.totalOrders; i++) {
      // Distribuir entre mesas (evitar constraint quando possível)
      const table = tables[i % tables.length];
      const itemCount = Math.floor(
        Math.random() * (config.itemsPerOrder.max - config.itemsPerOrder.min + 1)
      ) + config.itemsPerOrder.min;

      orderPromises.push(
        createOrderViaRPC(pool, config.restaurantId, table.id, table.number, products, itemCount)
      );

    // Executar em lotes baseado em concurrency
    if (orderPromises.length >= config.concurrency) {
      const batchResults = await Promise.all(orderPromises.splice(0, config.concurrency));
      orderResults.push(...batchResults);
      
      const successCount = batchResults.filter(r => r.success).length;
      const failCount = batchResults.length - successCount;
      console.log(`   📊 Lote: ${successCount} sucesso, ${failCount} falhas`);
    }
  }

  // Processar pedidos restantes
  if (orderPromises.length > 0) {
    const batchResults = await Promise.all(orderPromises);
    orderResults.push(...batchResults);
    
    const successCount = batchResults.filter(r => r.success).length;
    const failCount = batchResults.length - successCount;
    console.log(`   📊 Lote final: ${successCount} sucesso, ${failCount} falhas`);
  }

  console.log('');

  // Calcular resultados
  const duration = Date.now() - startTime;
  const successfulOrders = orderResults.filter(r => r.success);
  const failedOrders = orderResults.filter(r => !r.success);
  const constraintViolations = orderResults.filter(r => 
    r.errorCode === '23505' || r.constraint === 'idx_one_open_order_per_table'
  ).length;

  const latencies = successfulOrders.map(r => r.latencyMs).sort((a, b) => a - b);

  const results: TestResults = {
    phase: 'A1 - Stress Lógico',
    totalOrders: orderResults.length,
    successfulOrders: successfulOrders.length,
    failedOrders: failedOrders.length,
    constraintViolations,
    avgLatencyMs: latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0,
    p95LatencyMs: latencies.length > 0 
      ? latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1]
      : 0,
    maxLatencyMs: latencies.length > 0 ? Math.max(...latencies) : 0,
    ordersPerSecond: duration > 0 ? (successfulOrders.length / duration) * 1000 : 0,
    duration,
    orderResults,
    errors
  };

    // Validar constraint
    console.log('🔍 Validando constraint "uma mesa = um pedido aberto"...');
    try {
      const validationResult = await pool.query(
        `SELECT table_id, id 
         FROM gm_orders 
         WHERE restaurant_id = $1 AND status = 'OPEN'`,
        [config.restaurantId]
      );
      
      const openOrders = validationResult.rows;
      const tableCounts = new Map<string, number>();
      openOrders.forEach((order: any) => {
        if (order.table_id) {
          const count = tableCounts.get(order.table_id) || 0;
          tableCounts.set(order.table_id, count + 1);
        }
      });
      
      let violations = 0;
      for (const [tableId, count] of tableCounts.entries()) {
        if (count > 1) {
          violations++;
          console.error(`   ❌ VIOLAÇÃO: Mesa ${tableId} tem ${count} pedidos abertos`);
        }
      }
      
      if (violations === 0) {
        console.log(`   ✅ Constraint respeitada: ${openOrders.length} pedidos abertos, nenhuma mesa com múltiplos pedidos`);
      } else {
        errors.push(`Constraint violada: ${violations} mesas com múltiplos pedidos abertos`);
      }
    } catch (validationError: any) {
      console.warn(`   ⚠️  Não foi possível validar: ${validationError.message}`);
    }
    console.log('');

    return results;
  } finally {
    await pool.end();
  }
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function printResults(results: TestResults) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📊 RESULTADOS - ${results.phase}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Total de Pedidos: ${results.totalOrders}`);
  console.log(`   ✅ Sucesso: ${results.successfulOrders} (${((results.successfulOrders / results.totalOrders) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Falhas: ${results.failedOrders}`);
  console.log(`   🔒 Violações de Constraint: ${results.constraintViolations}`);
  console.log('');
  console.log('   LATÊNCIA:');
  console.log(`   - Média: ${results.avgLatencyMs.toFixed(0)}ms`);
  console.log(`   - P95: ${results.p95LatencyMs.toFixed(0)}ms`);
  console.log(`   - Máxima: ${results.maxLatencyMs}ms`);
  console.log('');
  console.log(`   THROUGHPUT: ${results.ordersPerSecond.toFixed(2)} pedidos/segundo`);
  console.log(`   Duração: ${(results.duration / 1000).toFixed(2)}s`);
  console.log('═══════════════════════════════════════════════════════════');

  // Critérios de sucesso
  const criteria = {
    successRate: results.successfulOrders / results.totalOrders >= 0.95,
    constraintRespected: results.constraintViolations === 0,
    avgLatency: results.avgLatencyMs < 500,
    p95Latency: results.p95LatencyMs < 1000,
  };

  console.log('');
  console.log('✅ CRITÉRIOS DE SUCESSO:');
  console.log(`   Taxa de Sucesso >= 95%: ${criteria.successRate ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Constraint Respeitada: ${criteria.constraintRespected ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Latência Média < 500ms: ${criteria.avgLatency ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   P95 Latency < 1000ms: ${criteria.p95Latency ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  const allPassed = Object.values(criteria).every(c => c);
  console.log(`   ${allPassed ? '✅ TESTE PASSOU' : '❌ TESTE FALHOU'}`);
  console.log('');
}

function saveResults(results: TestResults) {
  const outputDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `massive-concurrent-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📄 Resultados salvos em: ${outputPath}`);
  console.log('');
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): TestConfig {
  const config = { ...DEFAULT_CONFIG };
  
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--orders=')) {
      config.totalOrders = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--concurrency=')) {
      config.concurrency = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--restaurant=')) {
      config.restaurantId = arg.split('=')[1];
    } else if (arg === '--help') {
      console.log(`
Usage: npx ts-node scripts/massive-concurrent-test.ts [options]

Options:
  --orders=N         Total de pedidos (default: 50)
  --concurrency=N    Concorrência (default: 10)
  --restaurant=UUID  ID do restaurante (default: restaurante piloto)
  --help             Mostrar ajuda

Example:
  npx ts-node scripts/massive-concurrent-test.ts --orders=100 --concurrency=20
      `);
      process.exit(0);
    }
  }

  return config;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const config = parseArgs();
  
  console.log('🔥 MASSIVE CONCURRENT TEST - ChefIApp Core');
  console.log('');

  try {
    // Fase A1: Stress Lógico
    const results = await runPhaseA1(config);
    
    printResults(results);
    saveResults(results);

    // Determinar exit code
    const allPassed = 
      results.successfulOrders / results.totalOrders >= 0.95 &&
      results.constraintViolations === 0 &&
      results.avgLatencyMs < 500;
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { runPhaseA1, TestConfig, TestResults };
