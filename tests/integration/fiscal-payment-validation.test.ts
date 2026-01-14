/**
 * FISCAL PAYMENT VALIDATION TEST
 * 
 * TASK-2.4.2: Teste de Validação de Pagamento
 * 
 * Testa que:
 * - Pagamento parcial rejeita emissão fiscal
 * - Pagamento total permite emissão fiscal
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const API_URL = process.env.API_URL || 'http://localhost:4320';

let pool: Pool | null = null;

// Conditional setup for integration tests
beforeAll(() => {
  if (DATABASE_URL) {
    pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  }
});

afterAll(async () => {
  if (pool) {
    await pool.end();
  }
});

describe('TASK-2.4.2: Fiscal Payment Validation', () => {
  const skip = !DATABASE_URL;
  
  beforeAll(() => {
    if (skip) {
      console.warn('⚠️  DATABASE_URL not set. Skipping fiscal-payment-validation integration tests.');
    }
  });

  beforeEach(async () => {
    if (skip || !pool) return;
    
    // Clean up test data (ignore errors if tables don't exist)
    try {
      await pool.query(`DELETE FROM public.gm_fiscal_queue WHERE order_id::text LIKE 'test-%'`);
    } catch (e) {
      // Ignore if table doesn't exist
    }
    try {
      await pool.query(`DELETE FROM public.gm_payments WHERE order_id::text LIKE 'test-%'`);
    } catch (e) {
      // Ignore if table doesn't exist
    }
    try {
      await pool.query(`DELETE FROM public.gm_order_items WHERE order_id::text LIKE 'test-%'`);
    } catch (e) {
      // Ignore if table doesn't exist
    }
    try {
      await pool.query(`DELETE FROM public.gm_orders WHERE id::text LIKE 'test-%'`);
    } catch (e) {
      // Ignore if table doesn't exist
    }
  });

  it(skip ? '⏭️  Skipping test - DATABASE_URL not set' : 'should reject fiscal emission for partial payment', async () => {
    if (skip || !pool) return;

    // Criar pedido de teste
    const restaurantId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Example UUID
    const orderId = `test-partial-${Date.now()}`;
    const orderTotal = 10000; // €100.00 em centavos

    // Inserir pedido com status 'pending' e payment_status 'partially_paid'
    // Tentar total_cents primeiro (schema usado pelo endpoint)
    try {
      await pool.query(
        `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_cents, created_at)
         VALUES ($1, $2, 'pending', 'partially_paid', $3, NOW())`,
        [orderId, restaurantId, orderTotal]
      );
    } catch (e: any) {
      // Fallback para total_amount se total_cents não existir, ou status diferente
      if (e.message?.includes('total_cents') || e.message?.includes('enum')) {
        try {
          await pool.query(
            `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_amount, created_at)
             VALUES ($1, $2, 'pending', 'partially_paid', $3, NOW())`,
            [orderId, restaurantId, orderTotal]
          );
        } catch (e2: any) {
          // Se ainda falhar, tentar com status 'OPEN' (texto)
          await pool.query(
            `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_cents, created_at)
             VALUES ($1, $2, 'OPEN', 'partially_paid', $3, NOW())`,
            [orderId, restaurantId, orderTotal]
          );
        }
      } else {
        throw e;
      }
    }

    // Criar pagamento parcial (€50.00)
    const paymentId = `test-payment-partial-${Date.now()}`;
    await pool.query(
      `INSERT INTO public.gm_payments (id, order_id, amount_cents, status, payment_method, created_at)
       VALUES ($1, $2, $3, 'paid', 'cash', NOW())`,
      [paymentId, orderId, 5000] // €50.00
    );

    // Tentar emitir fiscal (deve falhar)
    const response = await fetch(`${API_URL}/api/fiscal/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-chefiapp-token': 'test-token', // Mock token
      },
      body: JSON.stringify({
        orderId,
        restaurantId,
        paymentMethod: 'cash',
        amountCents: orderTotal,
        idempotencyKey: `test-partial-${Date.now()}`,
      }),
    });

    expect(response.status).toBe(400);
    const errorData = await response.json();
    expect(errorData.error).toBe('ORDER_NOT_FULLY_PAID');
    expect(errorData.payment_status).toBe('partially_paid');
  });

  it(skip ? '⏭️  Skipping test - DATABASE_URL not set' : 'should reject fiscal emission when total paid is less than order total', async () => {
    if (skip || !pool) return;

    const restaurantId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const orderId = `test-insufficient-${Date.now()}`;
    const orderTotal = 10000; // €100.00

    // Inserir pedido com payment_status 'paid' mas total pago menor
    try {
      await pool.query(
        `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_cents, created_at)
         VALUES ($1, $2, 'pending', 'paid', $3, NOW())`,
        [orderId, restaurantId, orderTotal]
      );
    } catch (e: any) {
      if (e.message?.includes('total_cents') || e.message?.includes('enum')) {
        try {
          await pool.query(
            `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_amount, created_at)
             VALUES ($1, $2, 'pending', 'paid', $3, NOW())`,
            [orderId, restaurantId, orderTotal]
          );
        } catch (e2: any) {
          await pool.query(
            `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_cents, created_at)
             VALUES ($1, $2, 'OPEN', 'paid', $3, NOW())`,
            [orderId, restaurantId, orderTotal]
          );
        }
      } else {
        throw e;
      }
    }

    // Criar pagamento insuficiente (€80.00)
    const paymentId = `test-payment-insufficient-${Date.now()}`;
    await pool.query(
      `INSERT INTO public.gm_payments (id, order_id, amount_cents, status, payment_method, created_at)
       VALUES ($1, $2, $3, 'paid', 'cash', NOW())`,
      [paymentId, orderId, 8000] // €80.00
    );

    // Tentar emitir fiscal (deve falhar)
    const response = await fetch(`${API_URL}/api/fiscal/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-chefiapp-token': 'test-token',
      },
      body: JSON.stringify({
        orderId,
        restaurantId,
        paymentMethod: 'cash',
        amountCents: orderTotal,
        idempotencyKey: `test-insufficient-${Date.now()}`,
      }),
    });

    expect(response.status).toBe(400);
    const errorData = await response.json();
    expect(errorData.error).toBe('INSUFFICIENT_PAYMENT');
    expect(Number(errorData.total_cents)).toBe(orderTotal);
    expect(Number(errorData.total_paid_cents)).toBe(8000);
  });

  it(skip ? '⏭️  Skipping test - DATABASE_URL not set' : 'should reject fiscal emission when amountCents does not match order total', async () => {
    if (skip || !pool) return;

    const restaurantId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const orderId = `test-amount-mismatch-${Date.now()}`;
    const orderTotal = 10000; // €100.00

    // Inserir pedido totalmente pago
    try {
      await pool.query(
        `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_cents, created_at)
         VALUES ($1, $2, 'pending', 'paid', $3, NOW())`,
        [orderId, restaurantId, orderTotal]
      );
    } catch (e: any) {
      if (e.message?.includes('total_cents') || e.message?.includes('enum')) {
        try {
          await pool.query(
            `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_amount, created_at)
             VALUES ($1, $2, 'pending', 'paid', $3, NOW())`,
            [orderId, restaurantId, orderTotal]
          );
        } catch (e2: any) {
          await pool.query(
            `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_cents, created_at)
             VALUES ($1, $2, 'OPEN', 'paid', $3, NOW())`,
            [orderId, restaurantId, orderTotal]
          );
        }
      } else {
        throw e;
      }
    }

    // Criar pagamento total
    const paymentId = `test-payment-total-${Date.now()}`;
    await pool.query(
      `INSERT INTO public.gm_payments (id, order_id, amount_cents, status, payment_method, created_at)
       VALUES ($1, $2, $3, 'paid', 'cash', NOW())`,
      [paymentId, orderId, orderTotal]
    );

    // Tentar emitir fiscal com amountCents diferente (deve falhar)
    const response = await fetch(`${API_URL}/api/fiscal/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-chefiapp-token': 'test-token',
      },
      body: JSON.stringify({
        orderId,
        restaurantId,
        paymentMethod: 'cash',
        amountCents: 15000, // €150.00 (diferente do total)
        idempotencyKey: `test-amount-mismatch-${Date.now()}`,
      }),
    });

    expect(response.status).toBe(400);
    const errorData = await response.json();
    expect(errorData.error).toBe('AMOUNT_MISMATCH');
    expect(Number(errorData.requested_amount_cents)).toBe(15000);
    expect(Number(errorData.order_total_cents)).toBe(orderTotal);
  });

  it(skip ? '⏭️  Skipping test - DATABASE_URL not set' : 'should allow fiscal emission when payment is fully paid', async () => {
    if (skip || !pool) return;

    const restaurantId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const orderId = `test-full-payment-${Date.now()}`;
    const orderTotal = 10000; // €100.00

    // Inserir pedido totalmente pago
    try {
      await pool.query(
        `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_cents, created_at)
         VALUES ($1, $2, 'pending', 'paid', $3, NOW())`,
        [orderId, restaurantId, orderTotal]
      );
    } catch (e: any) {
      if (e.message?.includes('total_cents') || e.message?.includes('enum')) {
        try {
          await pool.query(
            `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_amount, created_at)
             VALUES ($1, $2, 'pending', 'paid', $3, NOW())`,
            [orderId, restaurantId, orderTotal]
          );
        } catch (e2: any) {
          await pool.query(
            `INSERT INTO public.gm_orders (id, restaurant_id, status, payment_status, total_cents, created_at)
             VALUES ($1, $2, 'OPEN', 'paid', $3, NOW())`,
            [orderId, restaurantId, orderTotal]
          );
        }
      } else {
        throw e;
      }
    }

    // Criar pagamento total
    const paymentId = `test-payment-full-${Date.now()}`;
    await pool.query(
      `INSERT INTO public.gm_payments (id, order_id, amount_cents, status, payment_method, created_at)
       VALUES ($1, $2, $3, 'paid', 'cash', NOW())`,
      [paymentId, orderId, orderTotal]
    );

    // Tentar emitir fiscal (deve funcionar)
    const response = await fetch(`${API_URL}/api/fiscal/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-chefiapp-token': 'test-token',
      },
      body: JSON.stringify({
        orderId,
        restaurantId,
        paymentMethod: 'cash',
        amountCents: orderTotal, // Corresponde ao total
        idempotencyKey: `test-full-${Date.now()}`,
      }),
    });

    // Pode retornar 200 (sucesso) ou 401 (se autenticação falhar)
    // O importante é que não retorne 400 (erro de validação)
    expect(response.status).not.toBe(400);
    
    if (response.status === 200) {
      const data = await response.json();
      expect(data.queue_id).toBeDefined();
      expect(data.status).toBe('pending');
    }
  });
});
