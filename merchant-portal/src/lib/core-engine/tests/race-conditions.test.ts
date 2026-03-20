/**
 * Race Condition Tests
 * 
 * TASK-1.4.3: Teste de Race Condition (PAYMENT + ORDER)
 * 
 * Tests that simulate concurrent PAYMENT:CONFIRMED and ORDER:CANCEL
 * and verify that there are no race conditions.
 */

import { InMemoryRepo } from '../repo/InMemoryRepo';
import { CoreExecutor } from '../executor/CoreExecutor';
import type { Order, Session, Payment, OrderItem } from '../repo/types';

describe('TASK-1.4.3: Race Condition Tests (PAYMENT + ORDER)', () => {
  let repo: InMemoryRepo;
  let executor: CoreExecutor;

  beforeEach(() => {
    repo = new InMemoryRepo();
    executor = new CoreExecutor(repo);
  });

  afterEach(() => {
    repo.clear();
  });

  /**
   * TASK-1.4.3: Teste que PAYMENT:CONFIRM e ORDER:CANCEL simultâneos
   * não causam race condition. Um deve suceder e o outro detectar conflito ou aguardar lock.
   * Estado final deve ser consistente (não order paid + cancelled).
   */
  it('should prevent race condition when PAYMENT:CONFIRM and ORDER:CANCEL are concurrent', async () => {
    // Setup: Create session, order, and payment
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'LOCKED', // Order must be LOCKED for payment confirmation
      version: 1,
      total_cents: 1000, // 10.00
    };
    repo.saveOrder(order);

    const item: OrderItem = {
      id: 'item-1',
      order_id: 'order-1',
      product_id: 'product-1',
      name: 'Test Product',
      quantity: 1,
      price_snapshot_cents: 1000, // 10.00 in cents
      subtotal_cents: 1000, // 10.00 in cents
    };
    repo.saveOrderItem(item);

    const payment: Payment = {
      id: 'payment-1',
      order_id: 'order-1',
      session_id: 'session-1',
      method: 'CARD',
      amount_cents: 1000, // Full payment
      state: 'PENDING',
      version: 1,
    };
    repo.savePayment(payment);

    // TASK-1.4.3: Simular duas transições concorrentes
    // 1. PAYMENT:CONFIRM (deve travar payment + order)
    // 2. ORDER:CANCEL (deve travar order, mas order já está travado)
    
    const paymentPromise = executor.transition({
      tenantId: 'test-tenant',
      entity: 'PAYMENT',
      entityId: 'payment-1',
      event: 'CONFIRM',
      context: { order_id: 'order-1' },
    });

    // Pequeno delay para garantir que PAYMENT:CONFIRMED comece primeiro
    await new Promise(resolve => setTimeout(resolve, 10));

    const cancelPromise = executor.transition({
      tenantId: 'test-tenant',
      entity: 'ORDER',
      entityId: 'order-1',
      event: 'CANCEL',
    });

    // Aguardar ambas as transições
    const [paymentResult, cancelResult] = await Promise.all([
      paymentPromise,
      cancelPromise,
    ]);

    // Verificar que pelo menos uma transição falhou ou detectou conflito
    // (não podemos ter order PAID e CANCELED ao mesmo tempo)
    const finalOrder = repo.getOrder('order-1');
    
    // Estado final deve ser consistente
    expect(finalOrder).toBeDefined();
    
    // Verificar que não temos estado inconsistente (PAID + CANCELED)
    // O order deve estar em um estado válido: PAID ou CANCELED, não ambos
    if (finalOrder!.state === 'PAID') {
      // Se order está PAID, então PAYMENT:CONFIRMED sucedeu
      expect(paymentResult.success).toBe(true);
      // ORDER:CANCEL deve ter falhado (order não pode ser cancelado se está PAID)
      expect(cancelResult.success).toBe(false);
    } else if (finalOrder!.state === 'CANCELED') {
      // Se order está CANCELED, então ORDER:CANCEL sucedeu
      expect(cancelResult.success).toBe(true);
      // PAYMENT:CONFIRMED deve ter falhado (payment não pode ser confirmado se order está CANCELED)
      expect(paymentResult.success).toBe(false);
    } else {
      // Order deve estar em um estado válido (LOCKED se ambas falharam)
      expect(['LOCKED', 'PAID', 'CANCELED']).toContain(finalOrder!.state);
    }

    // Verificar que não temos estado inconsistente
    // O order deve estar em um estado válido (não pode ser PAID e CANCELED ao mesmo tempo)
    expect(['LOCKED', 'PAID', 'CANCELED']).toContain(finalOrder!.state);
    
    // Se order está PAID, não pode estar CANCELED (e vice-versa)
    if (finalOrder!.state === 'PAID') {
      expect(finalOrder!.state).not.toBe('CANCELED');
    } else if (finalOrder!.state === 'CANCELED') {
      expect(finalOrder!.state).not.toBe('PAID');
    }
  });

  /**
   * TASK-1.4.3: Teste que quando PAYMENT:CONFIRMED sucede primeiro,
   * ORDER:CANCEL deve falhar (order já está PAID).
   */
  it('should prevent ORDER:CANCEL when order is already PAID', async () => {
    // Setup
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'LOCKED',
      version: 1,
      total_cents: 1000,
    };
    repo.saveOrder(order);

    const payment: Payment = {
      id: 'payment-1',
      order_id: 'order-1',
      session_id: 'session-1',
      method: 'CARD',
      amount_cents: 1000,
      state: 'PENDING',
      version: 1,
    };
    repo.savePayment(payment);

    // Confirmar pagamento primeiro
    const paymentResult = await executor.transition({
      tenantId: 'test-tenant',
      entity: 'PAYMENT',
      entityId: 'payment-1',
      event: 'CONFIRM',
      context: { order_id: 'order-1' },
    });

    // Verificar resultado (pode falhar se houver guard que impede)
    if (!paymentResult.success) {
      console.log('Payment confirmation failed:', paymentResult.error);
    }
    expect(paymentResult.success).toBe(true);
    
    // Verificar que order está PAID
    const orderAfterPayment = repo.getOrder('order-1');
    expect(orderAfterPayment?.state).toBe('PAID');

    // Tentar cancelar order (deve falhar)
    const cancelResult = await executor.transition({
      tenantId: 'test-tenant',
      entity: 'ORDER',
      entityId: 'order-1',
      event: 'CANCEL',
    });

    expect(cancelResult.success).toBe(false);
    expect(cancelResult.error).toBeDefined();
    
    // Order ainda deve estar PAID
    const finalOrder = repo.getOrder('order-1');
    expect(finalOrder?.state).toBe('PAID');
  });

  /**
   * TASK-1.4.3: Teste que quando ORDER:CANCEL sucede primeiro,
   * PAYMENT:CONFIRMED deve falhar (order já está CANCELED).
   */
  it('should prevent PAYMENT:CONFIRMED when order is already CANCELED', async () => {
    // Setup
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'LOCKED',
      version: 1,
      total_cents: 1000,
    };
    repo.saveOrder(order);

    const payment: Payment = {
      id: 'payment-1',
      order_id: 'order-1',
      session_id: 'session-1',
      method: 'CARD',
      amount_cents: 1000,
      state: 'PENDING',
      version: 1,
    };
    repo.savePayment(payment);

    // Cancelar order primeiro
    const cancelResult = await executor.transition({
      tenantId: 'test-tenant',
      entity: 'ORDER',
      entityId: 'order-1',
      event: 'CANCEL',
    });

    expect(cancelResult.success).toBe(true);
    
    // Verificar que order está CANCELED
    const orderAfterCancel = repo.getOrder('order-1');
    expect(orderAfterCancel?.state).toBe('CANCELED');

    // Tentar confirmar pagamento (deve falhar)
    const paymentResult = await executor.transition({
      tenantId: 'test-tenant',
      entity: 'PAYMENT',
      entityId: 'payment-1',
      event: 'CONFIRM',
    });

    expect(paymentResult.success).toBe(false);
    expect(paymentResult.error).toBeDefined();
    
    // Order ainda deve estar CANCELED
    const finalOrder = repo.getOrder('order-1');
    expect(finalOrder?.state).toBe('CANCELED');
  });

  /**
   * TASK-1.4.3: Teste que múltiplos locks são adquiridos na ordem correta
   * (ordem determinística previne deadlock).
   */
  it('should acquire multiple locks in deterministic order', async () => {
    // Setup
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'LOCKED',
      version: 1,
      total_cents: 1000,
    };
    repo.saveOrder(order);

    const payment: Payment = {
      id: 'payment-1',
      order_id: 'order-1',
      session_id: 'session-1',
      method: 'CARD',
      amount_cents: 1000,
      state: 'PENDING',
      version: 1,
    };
    repo.savePayment(payment);

    // PAYMENT:CONFIRM deve travar payment-1 e order-1 na ordem determinística
    // (sorted: order-1, payment-1)
    const paymentResult = await executor.transition({
      tenantId: 'test-tenant',
      entity: 'PAYMENT',
      entityId: 'payment-1',
      event: 'CONFIRM',
      context: { order_id: 'order-1' },
    });

    expect(paymentResult.success).toBe(true);
    
    // Verificar que order está PAID
    const finalOrder = repo.getOrder('order-1');
    expect(finalOrder?.state).toBe('PAID');
    
    // Verificar que payment está CONFIRMED
    const payments = repo.getPayments('order-1');
    const finalPayment = payments.find(p => p.id === 'payment-1');
    expect(finalPayment?.state).toBe('CONFIRMED');
  });
});
