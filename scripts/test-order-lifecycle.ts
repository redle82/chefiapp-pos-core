#!/usr/bin/env npx ts-node
/**
 * TESTE B - CICLO COMPLETO DE VIDA DO PEDIDO
 * 
 * Valida: abertura → fechamento → nova abertura, sem vazamento de estado
 * 
 * Objetivo:
 *   - Constraint libera corretamente após fechamento
 *   - Nenhum pedido zumbi
 *   - Nenhuma mesa travada
 *   - Latência se mantém estável
 * 
 * Usage:
 *   npx ts-node scripts/test-order-lifecycle.ts
 *   npx ts-node scripts/test-order-lifecycle.ts --cycles=100 --tables=10
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const { Pool } = pg;

// =============================================================================
// CONFIGURATION
// =============================================================================

interface TestConfig {
  cycles: number;           // Quantos ciclos completos (abrir → fechar → abrir)
  tables: number;           // Quantas mesas usar (distribuir ciclos)
  restaurantId: string;
  itemsPerOrder: { min: number; max: number };
}

const DEFAULT_CONFIG: TestConfig = {
  cycles: 100,
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
  openLatencyMs: number;
  closeLatencyMs: number;
  reopenLatencyMs: number;
  success: boolean;
  error?: string;
  zombieOrder?: boolean;  // Pedido que ficou aberto indevidamente
  stuckTable?: boolean;  // Mesa que não liberou constraint
}

interface TestResults {
  totalCycles: number;
  successfulCycles: number;
  failedCycles: number;
  zombieOrders: number;
  stuckTables: number;
  avgOpenLatencyMs: number;
  avgCloseLatencyMs: number;
  avgReopenLatencyMs: number;
  maxLatencyMs: number;
  duration: number;
  cycleResults: CycleResult[];
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

async function getTables(pool: pg.Pool, restaurantId: string, limit: number): Promise<Table[]> {
  const result = await pool.query(
    `SELECT id, number 
     FROM gm_tables 
     WHERE restaurant_id = $1 
     LIMIT $2`,
    [restaurantId, limit]
  );

  if (result.rows.length === 0) throw new Error('No tables found');
  
  return result.rows;
}

// =============================================================================
// ORDER OPERATIONS
// =============================================================================

async function createOrder(
  pool: pg.Pool,
  restaurantId: string,
  tableId: string,
  tableNumber: number,
  products: Product[],
  itemCount: number
): Promise<{ orderId: string; latencyMs: number }> {
  const startTime = Date.now();
  
  // Selecionar produtos aleatórios
  const selectedProducts: Product[] = [];
  for (let i = 0; i < itemCount; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    selectedProducts.push(randomProduct);
  }

  // Preparar items no formato do RPC
  const rpcItems = selectedProducts.map(product => ({
    product_id: product.id,
    name: product.name,
    quantity: 1,
    unit_price: product.price_cents
  }));

  // Preparar sync_metadata
  const syncMetadata = {
    table_id: tableId,
    table_number: tableNumber,
    origin: 'LIFECYCLE_TEST',
    timestamp: new Date().toISOString()
  };

  // Chamar RPC
  const result = await pool.query(
    `SELECT create_order_atomic($1::uuid, $2::jsonb, $3::text, $4::jsonb) as result`,
    [
      restaurantId,
      JSON.stringify(rpcItems),
      'cash',
      JSON.stringify(syncMetadata)
    ]
  );

  const latencyMs = Date.now() - startTime;
  const data = result.rows[0];
  
  // RPC retorna JSONB com {id, total_cents, status}
  const rpcResult = data?.result;
  const orderId = rpcResult?.id;

  if (!orderId) {
    throw new Error(`RPC returned invalid data: ${JSON.stringify(data)}`);
  }

  return {
    orderId,
    latencyMs
  };
}

async function closeOrder(
  pool: pg.Pool,
  orderId: string
): Promise<number> {
  const startTime = Date.now();
  
  await pool.query(
    `UPDATE gm_orders 
     SET status = 'CLOSED', payment_status = 'PAID', updated_at = NOW()
     WHERE id = $1`,
    [orderId]
  );

  return Date.now() - startTime;
}

async function checkZombieOrders(
  pool: pg.Pool,
  restaurantId: string,
  tableId: string
): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count 
     FROM gm_orders 
     WHERE restaurant_id = $1 
       AND table_id = $2 
       AND status = 'OPEN'`,
    [restaurantId, tableId]
  );

  return parseInt(result.rows[0].count, 10);
}

// =============================================================================
// CYCLE EXECUTION
// =============================================================================

async function executeCycle(
  pool: pg.Pool,
  config: TestConfig,
  cycle: number,
  table: Table,
  products: Product[]
): Promise<CycleResult> {
  const result: CycleResult = {
    cycle,
    tableId: table.id,
    tableNumber: table.number,
    openLatencyMs: 0,
    closeLatencyMs: 0,
    reopenLatencyMs: 0,
    success: false,
  };

  try {
    // 1. Criar pedido (abertura inicial)
    const itemCount = Math.floor(
      Math.random() * (config.itemsPerOrder.max - config.itemsPerOrder.min + 1)
    ) + config.itemsPerOrder.min;

    const { orderId, latencyMs: openLatency } = await createOrder(
      pool,
      config.restaurantId,
      table.id,
      table.number,
      products,
      itemCount
    );

    result.openLatencyMs = openLatency;

    if (!orderId) {
      result.error = 'Failed to create order';
      return result;
    }

    // 2. Verificar se não há pedidos zumbis (deve ter exatamente 1)
    const zombieCount = await checkZombieOrders(pool, config.restaurantId, table.id);
    if (zombieCount !== 1) {
      result.zombieOrder = true;
      result.error = `Expected 1 open order, found ${zombieCount}`;
      return result;
    }

    // 3. Fechar pedido
    const closeLatency = await closeOrder(pool, orderId);
    result.closeLatencyMs = closeLatency;

    // 4. Verificar que mesa foi liberada (deve ter 0 pedidos abertos)
    const openAfterClose = await checkZombieOrders(pool, config.restaurantId, table.id);
    if (openAfterClose !== 0) {
      result.stuckTable = true;
      result.error = `Table should have 0 open orders after close, found ${openAfterClose}`;
      return result;
    }

    // 5. Criar novo pedido na mesma mesa (reabertura)
    const { orderId: newOrderId, latencyMs: reopenLatency } = await createOrder(
      pool,
      config.restaurantId,
      table.id,
      table.number,
      products,
      itemCount
    );

    result.reopenLatencyMs = reopenLatency;

    if (!newOrderId) {
      result.error = 'Failed to reopen order (constraint may be stuck)';
      result.stuckTable = true;
      return result;
    }

    // 6. Verificar que novo pedido foi criado corretamente
    const finalZombieCount = await checkZombieOrders(pool, config.restaurantId, table.id);
    if (finalZombieCount !== 1) {
      result.zombieOrder = true;
      result.error = `After reopen, expected 1 open order, found ${finalZombieCount}`;
      return result;
    }

    // 7. Limpar para próximo ciclo (fechar o pedido reaberto)
    await closeOrder(pool, newOrderId);

    result.success = true;
    return result;

  } catch (error: any) {
    result.error = error?.message || String(error);
    return result;
  }
}

// =============================================================================
// TEST EXECUTION
// =============================================================================

async function runLifecycleTest(config: TestConfig): Promise<TestResults> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TESTE B: CICLO COMPLETO DE VIDA DO PEDIDO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Ciclos: ${config.cycles}`);
  console.log(`   Mesas: ${config.tables}`);
  console.log(`   Itens por pedido: ${config.itemsPerOrder.min}-${config.itemsPerOrder.max}`);
  console.log('');

  const pool = getDbPool();
  const startTime = Date.now();
  const cycleResults: CycleResult[] = [];
  const errors: string[] = [];

  try {
    // Buscar dados
    console.log('📦 Carregando dados...');
    const products = await getProducts(pool, config.restaurantId);
    const tables = await getTables(pool, config.restaurantId, config.tables);
    
    console.log(`   ✅ ${products.length} produtos encontrados`);
    console.log(`   ✅ ${tables.length} mesas encontradas`);
    console.log('');

    // Limpar estado inicial
    console.log('🔄 Limpando estado inicial...');
    await pool.query(
      `UPDATE gm_orders 
       SET status = 'CLOSED', payment_status = 'PAID' 
       WHERE restaurant_id = $1 AND status = 'OPEN'`,
      [config.restaurantId]
    );
    console.log('   ✅ Estado limpo');
    console.log('');

    // Executar ciclos
    console.log('🚀 Executando ciclos de vida...');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < config.cycles; i++) {
      const table = tables[i % tables.length];
      const result = await executeCycle(pool, config, i + 1, table, products);
      cycleResults.push(result);

      if (result.success) {
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`   ✅ Ciclo ${i + 1}/${config.cycles} - ${successCount} sucessos, ${failCount} falhas`);
        }
      } else {
        failCount++;
        if (result.error) {
          errors.push(`Ciclo ${i + 1}: ${result.error}`);
        }
      }
    }

    console.log('');

    // Calcular resultados
    const duration = Date.now() - startTime;
    const successfulCycles = cycleResults.filter(r => r.success);
    const zombieOrders = cycleResults.filter(r => r.zombieOrder).length;
    const stuckTables = cycleResults.filter(r => r.stuckTable).length;

    const openLatencies = successfulCycles.map(r => r.openLatencyMs);
    const closeLatencies = successfulCycles.map(r => r.closeLatencyMs);
    const reopenLatencies = successfulCycles.map(r => r.reopenLatencyMs);
    const allLatencies = [...openLatencies, ...closeLatencies, ...reopenLatencies];

    const results: TestResults = {
      totalCycles: cycleResults.length,
      successfulCycles: successfulCycles.length,
      failedCycles: cycleResults.filter(r => !r.success).length,
      zombieOrders,
      stuckTables,
      avgOpenLatencyMs: openLatencies.length > 0 
        ? openLatencies.reduce((a, b) => a + b, 0) / openLatencies.length 
        : 0,
      avgCloseLatencyMs: closeLatencies.length > 0
        ? closeLatencies.reduce((a, b) => a + b, 0) / closeLatencies.length
        : 0,
      avgReopenLatencyMs: reopenLatencies.length > 0
        ? reopenLatencies.reduce((a, b) => a + b, 0) / reopenLatencies.length
        : 0,
      maxLatencyMs: allLatencies.length > 0 ? Math.max(...allLatencies) : 0,
      duration,
      cycleResults,
      errors
    };

    // Validar estado final
    console.log('🔍 Validando estado final...');
    const finalOpenOrders = await pool.query(
      `SELECT COUNT(*) as count 
       FROM gm_orders 
       WHERE restaurant_id = $1 AND status = 'OPEN'`,
      [config.restaurantId]
    );
    const finalOpenCount = parseInt(finalOpenOrders.rows[0].count, 10);

    if (finalOpenCount === 0) {
      console.log(`   ✅ Nenhum pedido zumbi: ${finalOpenCount} pedidos abertos`);
    } else {
      console.warn(`   ⚠️  Pedidos abertos restantes: ${finalOpenCount}`);
      errors.push(`Estado final: ${finalOpenCount} pedidos abertos (esperado 0)`);
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
  console.log('  📊 RESULTADOS - TESTE B: CICLO DE VIDA');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Total de Ciclos: ${results.totalCycles}`);
  console.log(`   ✅ Sucesso: ${results.successfulCycles} (${((results.successfulCycles / results.totalCycles) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Falhas: ${results.failedCycles}`);
  console.log(`   🧟 Pedidos Zumbis: ${results.zombieOrders}`);
  console.log(`   🔒 Mesas Travadas: ${results.stuckTables}`);
  console.log('');
  console.log('   LATÊNCIA:');
  console.log(`   - Abertura: ${results.avgOpenLatencyMs.toFixed(0)}ms (média)`);
  console.log(`   - Fechamento: ${results.avgCloseLatencyMs.toFixed(0)}ms (média)`);
  console.log(`   - Reabertura: ${results.avgReopenLatencyMs.toFixed(0)}ms (média)`);
  console.log(`   - Máxima: ${results.maxLatencyMs}ms`);
  console.log('');
  console.log(`   Duração Total: ${(results.duration / 1000).toFixed(2)}s`);
  console.log(`   Ciclos/segundo: ${((results.successfulCycles / results.duration) * 1000).toFixed(2)}`);
  console.log('═══════════════════════════════════════════════════════════');

  // Critérios de sucesso
  const criteria = {
    successRate: results.successfulCycles / results.totalCycles >= 0.99,
    noZombies: results.zombieOrders === 0,
    noStuckTables: results.stuckTables === 0,
    stableLatency: results.maxLatencyMs < 1000,
  };

  console.log('');
  console.log('✅ CRITÉRIOS DE SUCESSO:');
  console.log(`   Taxa de Sucesso >= 99%: ${criteria.successRate ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Zero Pedidos Zumbis: ${criteria.noZombies ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Zero Mesas Travadas: ${criteria.noStuckTables ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Latência Estável (< 1000ms): ${criteria.stableLatency ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  const allPassed = Object.values(criteria).every(c => c);
  console.log(`   ${allPassed ? '✅ TESTE PASSOU' : '❌ TESTE FALHOU'}`);
  console.log('');

  if (results.errors.length > 0 && results.errors.length <= 10) {
    console.log('⚠️  Erros encontrados:');
    results.errors.slice(0, 10).forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
    if (results.errors.length > 10) {
      console.log(`   ... e mais ${results.errors.length - 10} erros`);
    }
    console.log('');
  }
}

function saveResults(results: TestResults) {
  const outputDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `order-lifecycle-${Date.now()}.json`);
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
    if (arg.startsWith('--cycles=')) {
      config.cycles = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--tables=')) {
      config.tables = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--restaurant=')) {
      config.restaurantId = arg.split('=')[1];
    } else if (arg === '--help') {
      console.log(`
Usage: npx ts-node scripts/test-order-lifecycle.ts [options]

Options:
  --cycles=N         Número de ciclos completos (default: 100)
  --tables=N         Número de mesas a usar (default: 10)
  --restaurant=UUID  ID do restaurante (default: restaurante piloto)
  --help             Mostrar ajuda

Example:
  npx ts-node scripts/test-order-lifecycle.ts --cycles=200 --tables=20
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
  
  console.log('🔥 TESTE B - CICLO COMPLETO DE VIDA DO PEDIDO');
  console.log('');

  try {
    const results = await runLifecycleTest(config);
    
    printResults(results);
    saveResults(results);

    // Determinar exit code
    const allPassed = 
      results.successfulCycles / results.totalCycles >= 0.99 &&
      results.zombieOrders === 0 &&
      results.stuckTables === 0 &&
      results.maxLatencyMs < 1000;
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { runLifecycleTest, TestConfig, TestResults };
