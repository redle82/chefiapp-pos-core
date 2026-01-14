/**
 * FISCAL RETRY AUTOMATIC TEST
 * 
 * TASK-2.2.3: Teste de Retry Automático
 * 
 * Testa que o sistema de retry automático funciona corretamente:
 * - API falha, item é marcado como RETRYING
 * - Após backoff, item é retentado
 * - Após sucesso, item é marcado como COMPLETED
 * 
 * Roadmap: SPRINT 0 - Hardening Backend
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

// Skip tests if DATABASE_URL is not available
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, max: 10 }) : null;

// Helper para criar item de teste na fila
async function createTestQueueItem(params: {
  restaurantId: string;
  orderId: string;
  orderData: any;
  paymentData: any;
  retryCount?: number;
  maxRetries?: number;
}): Promise<string> {
  if (!pool) throw new Error('Pool not initialized');
  const { rows } = await pool.query(
    `INSERT INTO gm_fiscal_queue (
      restaurant_id,
      order_id,
      order_data,
      payment_data,
      status,
      retry_count,
      max_retries
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [
      params.restaurantId,
      params.orderId,
      JSON.stringify(params.orderData),
      JSON.stringify(params.paymentData),
      'pending',
      params.retryCount || 0,
      params.maxRetries || 10,
    ]
  );
  return rows[0].id;
}

// Helper para buscar item da fila
async function getQueueItem(queueId: string): Promise<any> {
  if (!pool) throw new Error('Pool not initialized');
  const { rows } = await pool.query(
    `SELECT * FROM gm_fiscal_queue WHERE id = $1`,
    [queueId]
  );
  return rows[0] || null;
}

describe('TASK-2.2.3: Fiscal Retry Automatic', () => {
  const TEST_RESTAURANT_ID = 'test-restaurant-retry';
  const TEST_ORDER_ID = 'test-order-retry';

  beforeAll(() => {
    if (!pool) {
      console.warn('⚠️  DATABASE_URL not set. Skipping fiscal-retry integration tests.');
    }
  });

  beforeEach(async () => {
    if (!pool) return;
    // Limpar itens de teste anteriores
    await pool.query(
      `DELETE FROM gm_fiscal_queue 
       WHERE restaurant_id = $1 OR order_id = $2`,
      [TEST_RESTAURANT_ID, TEST_ORDER_ID]
    );
  });

  afterEach(async () => {
    if (!pool) return;
    // Limpar itens de teste
    await pool.query(
      `DELETE FROM gm_fiscal_queue 
       WHERE restaurant_id = $1 OR order_id = $2`,
      [TEST_RESTAURANT_ID, TEST_ORDER_ID]
    );
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it('should mark item as RETRYING when mark_fiscal_queue_failed is called', async () => {
    if (!pool) {
      console.log('⏭️  Skipping test - DATABASE_URL not set');
      return;
    }
    
    // 1. Criar item na fila com dados que vão causar erro (restaurante não existe)
    const orderData = {
      id: TEST_ORDER_ID,
      total_cents: 1000,
      items: [{ id: 'item-1', name: 'Test', quantity: 1, price_snapshot: 1000 }],
    };
    const paymentData = {
      method: 'cash',
      amountCents: 1000,
    };

    const queueId = await createTestQueueItem({
      restaurantId: TEST_RESTAURANT_ID,
      orderId: TEST_ORDER_ID,
      orderData,
      paymentData,
      retryCount: 0,
      maxRetries: 10,
    });

    // 2. Simular falha chamando mark_fiscal_queue_failed diretamente
    await pool.query(
      `SELECT public.mark_fiscal_queue_failed(
        $1::uuid,
        $2::text,
        $3::integer
      )`,
      [queueId, 'Test error: Restaurant not found', 60]
    );

    // 3. Verificar que item foi marcado como RETRYING
    const item = await getQueueItem(queueId);
    expect(item).toBeDefined();
    expect(item.status).toBe('retrying');
    expect(item.retry_count).toBe(1); // Incrementado
    expect(item.last_error).toBeDefined();
    expect(item.next_retry_at).toBeDefined();
    expect(item.error_history).toBeDefined();
    
    // Verificar que error_history contém o erro
    const errorHistory = item.error_history;
    expect(Array.isArray(errorHistory)).toBe(true);
    expect(errorHistory.length).toBeGreaterThan(0);
    expect(errorHistory[0]).toHaveProperty('timestamp');
    expect(errorHistory[0]).toHaveProperty('error');
    expect(errorHistory[0]).toHaveProperty('attempt');
    expect(errorHistory[0].attempt).toBe(1);
  }, 30000);

  it('should increment retry_count when mark_fiscal_queue_failed is called again', async () => {
    if (!pool) {
      console.log('⏭️  Skipping test - DATABASE_URL not set');
      return;
    }
    
    // 1. Criar item na fila já com retry_count = 1 (simulando primeira falha)
    const orderData = {
      id: TEST_ORDER_ID,
      total_cents: 1000,
      items: [{ id: 'item-1', name: 'Test', quantity: 1, price_snapshot: 1000 }],
    };
    const paymentData = {
      method: 'cash',
      amountCents: 1000,
    };

    const queueId = await createTestQueueItem({
      restaurantId: TEST_RESTAURANT_ID,
      orderId: TEST_ORDER_ID,
      orderData,
      paymentData,
      retryCount: 1,
      maxRetries: 10,
    });

    // 2. Marcar como retrying com next_retry_at no passado (para permitir retry imediato)
    await pool.query(
      `UPDATE gm_fiscal_queue 
       SET status = 'retrying',
           next_retry_at = NOW() - INTERVAL '1 minute'
       WHERE id = $1`,
      [queueId]
    );

    // 3. Simular segunda falha
    await pool.query(
      `SELECT public.mark_fiscal_queue_failed(
        $1::uuid,
        $2::text,
        $3::integer
      )`,
      [queueId, 'Test error: API timeout', 60]
    );

    // 4. Verificar que retry_count foi incrementado
    const item = await getQueueItem(queueId);
    expect(item).toBeDefined();
    expect(item.status).toBe('retrying');
    expect(item.retry_count).toBe(2); // Incrementado de 1 para 2
    
    // Verificar que error_history contém 2 erros
    const errorHistory = item.error_history;
    expect(Array.isArray(errorHistory)).toBe(true);
    expect(errorHistory.length).toBe(2);
    expect(errorHistory[1].attempt).toBe(2);
  }, 30000);

  it('should mark item as FAILED after max retries', async () => {
    if (!pool) {
      console.log('⏭️  Skipping test - DATABASE_URL not set');
      return;
    }
    
    // 1. Criar item na fila com retry_count = 9 (última tentativa)
    const orderData = {
      id: TEST_ORDER_ID,
      total_cents: 1000,
      items: [{ id: 'item-1', name: 'Test', quantity: 1, price_snapshot: 1000 }],
    };
    const paymentData = {
      method: 'cash',
      amountCents: 1000,
    };

    const queueId = await createTestQueueItem({
      restaurantId: TEST_RESTAURANT_ID,
      orderId: TEST_ORDER_ID,
      orderData,
      paymentData,
      retryCount: 9,
      maxRetries: 10,
    });

    // 2. Marcar como retrying com next_retry_at no passado
    await pool.query(
      `UPDATE gm_fiscal_queue 
       SET status = 'retrying',
           next_retry_at = NOW() - INTERVAL '1 minute'
       WHERE id = $1`,
      [queueId]
    );

    // 3. Simular última tentativa (vai exceder max_retries)
    await pool.query(
      `SELECT public.mark_fiscal_queue_failed(
        $1::uuid,
        $2::text,
        $3::integer
      )`,
      [queueId, 'Test error: Final failure', 60]
    );

    // 4. Verificar que item foi marcado como FAILED
    const item = await getQueueItem(queueId);
    expect(item).toBeDefined();
    expect(item.status).toBe('failed');
    expect(item.retry_count).toBe(10); // Última tentativa
    expect(item.last_error).toBeDefined();
    expect(item.next_retry_at).toBeNull(); // Não há mais retries
    
    // Verificar que error_history contém 10 erros
    const errorHistory = item.error_history;
    expect(Array.isArray(errorHistory)).toBe(true);
    expect(errorHistory.length).toBe(10);
    expect(errorHistory[9].attempt).toBe(10);
  }, 30000);

  it('should calculate exponential backoff correctly in mark_fiscal_queue_failed', async () => {
    if (!pool) {
      console.log('⏭️  Skipping test - DATABASE_URL not set');
      return;
    }
    
    // 1. Criar item na fila
    const orderData = {
      id: TEST_ORDER_ID,
      total_cents: 1000,
      items: [{ id: 'item-1', name: 'Test', quantity: 1, price_snapshot: 1000 }],
    };
    const paymentData = {
      method: 'cash',
      amountCents: 1000,
    };

    const queueId = await createTestQueueItem({
      restaurantId: TEST_RESTAURANT_ID,
      orderId: TEST_ORDER_ID,
      orderData,
      paymentData,
      retryCount: 0,
      maxRetries: 10,
    });

    // 2. Simular primeira falha
    await pool.query(
      `SELECT public.mark_fiscal_queue_failed(
        $1::uuid,
        $2::text,
        $3::integer
      )`,
      [queueId, 'Test error: First failure', 60]
    );

    // 3. Verificar backoff da primeira tentativa (2^0 * 60 = 60 segundos)
    let item = await getQueueItem(queueId);
    expect(item.status).toBe('retrying');
    expect(item.retry_count).toBe(1);
    
    const firstRetryAt = new Date(item.next_retry_at);
    const now = new Date();
    const delayMs = firstRetryAt.getTime() - now.getTime();
    const delaySeconds = Math.round(delayMs / 1000);
    
    // Deve ser aproximadamente 60 segundos (com tolerância de 5 segundos)
    expect(delaySeconds).toBeGreaterThanOrEqual(55);
    expect(delaySeconds).toBeLessThanOrEqual(65);

    // 4. Simular segunda falha
    await pool.query(
      `UPDATE gm_fiscal_queue 
       SET status = 'retrying',
           next_retry_at = NOW() - INTERVAL '1 minute'
       WHERE id = $1`,
      [queueId]
    );

    // Simular segunda falha
    await pool.query(
      `SELECT public.mark_fiscal_queue_failed(
        $1::uuid,
        $2::text,
        $3::integer
      )`,
      [queueId, 'Test error: Second failure', 60]
    );

    // 5. Verificar backoff da segunda tentativa (2^1 * 60 = 120 segundos)
    item = await getQueueItem(queueId);
    expect(item.retry_count).toBe(2);
    
    const secondRetryAt = new Date(item.next_retry_at);
    const delayMs2 = secondRetryAt.getTime() - now.getTime();
    const delaySeconds2 = Math.round(delayMs2 / 1000);
    
    // Deve ser aproximadamente 120 segundos (com tolerância de 5 segundos)
    expect(delaySeconds2).toBeGreaterThanOrEqual(115);
    expect(delaySeconds2).toBeLessThanOrEqual(125);
  }, 30000);
});
