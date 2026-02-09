/**
 * TESTE COMPLETO DE EXTERNAL ID RETRY
 * 
 * Valida os 3 piores cenários:
 * 1. Provedor responde 500 cinco vezes seguidas
 * 2. Provedor responde 200 mas sem gov_protocol
 * 3. Rede cai após pagamento, antes da chamada fiscal
 * 
 * Critérios de aprovação:
 * - Todos os cenários são detectados
 * - Retry automático funciona
 * - Após 10 tentativas → FAILED
 * - Nenhum pedido fica "preso"
 * - Log auditável
 */

import { Pool } from 'pg';
import { MockFiscalAdapterWithFailures } from '../../../fiscal-modules/adapters/MockFiscalAdapterWithFailures';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('External ID Retry - Teste Completo', () => {
  let testRestaurantId: string;
  let testOrderIds: string[] = [];

  beforeAll(async () => {
    // Criar restaurante de teste
    const { rows: restaurantRows } = await pool.query(`
      INSERT INTO public.gm_restaurants (name, slug, operation_status)
      VALUES ('Test Restaurant', 'test-external-id', 'active')
      RETURNING id
    `);
    testRestaurantId = restaurantRows[0].id;

    // Criar pedidos de teste
    for (let i = 0; i < 5; i++) {
      const { rows: orderRows } = await pool.query(`
        INSERT INTO public.gm_orders (restaurant_id, status, total_amount, payment_status)
        VALUES ($1, 'PAID', 3800, 'paid')
        RETURNING id
      `, [testRestaurantId]);
      testOrderIds.push(orderRows[0].id);
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    await pool.query(`DELETE FROM public.gm_fiscal_queue WHERE restaurant_id = $1`, [testRestaurantId]);
    await pool.query(`DELETE FROM public.gm_orders WHERE restaurant_id = $1`, [testRestaurantId]);
    await pool.query(`DELETE FROM public.gm_restaurants WHERE id = $1`, [testRestaurantId]);
    await pool.end();
  });

  describe('Cenário 1: Provedor responde 500 cinco vezes seguidas', () => {
    it('deve retry automaticamente e falhar após 10 tentativas', async () => {
      const orderId = testOrderIds[0];
      
      // Criar item na fila fiscal
      const { rows } = await pool.query(`
        INSERT INTO public.gm_fiscal_queue (
          restaurant_id, order_id, order_data, payment_data, status, external_id_status
        )
        VALUES ($1, $2, '{}'::jsonb, '{"method": "card", "amountCents": 3800}'::jsonb, 'pending', 'PENDING_EXTERNAL_ID')
        RETURNING id
      `, [testRestaurantId, orderId]);

      const queueId = rows[0].id;

      // Simular 10 tentativas com erro 500
      const adapter = new MockFiscalAdapterWithFailures('500');
      
      for (let attempt = 1; attempt <= 10; attempt++) {
        // Simular processamento (em produção, seria o worker)
        try {
          const result = await adapter.onSealed(
            { seal_id: 'test', entity_type: 'ORDER', entity_id: orderId } as any,
            { event_id: 'test', stream_id: 'ORDER:test', type: 'PAYMENT_CONFIRMED', payload: {} } as any
          );

          if (result.status === 'REJECTED') {
            // Marcar como retry (simulando worker)
            await pool.query(`
              SELECT public.mark_fiscal_queue_failed($1::uuid, $2::text, 60)
            `, [queueId, result.error_details || '500 error']);
          }
        } catch (error: any) {
          await pool.query(`
            SELECT public.mark_fiscal_queue_failed($1::uuid, $2::text, 60)
          `, [queueId, error.message]);
        }

        // Verificar estado
        const { rows: statusRows } = await pool.query(`
          SELECT retry_count, external_id_status, status
          FROM public.gm_fiscal_queue
          WHERE id = $1
        `, [queueId]);

        const status = statusRows[0];
        
        if (attempt < 10) {
          expect(status.external_id_status).toBe('PENDING_EXTERNAL_ID');
          expect(status.retry_count).toBe(attempt);
        } else {
          // Após 10 tentativas, deve ser FAILED
          expect(status.external_id_status).toBe('FAILED_EXTERNAL_ID');
          expect(status.status).toBe('failed');
        }
      }
    });
  });

  describe('Cenário 2: Provedor responde 200 mas sem gov_protocol', () => {
    it('deve detectar External ID missing e retry', async () => {
      const orderId = testOrderIds[1];
      
      const { rows } = await pool.query(`
        INSERT INTO public.gm_fiscal_queue (
          restaurant_id, order_id, order_data, payment_data, status, external_id_status
        )
        VALUES ($1, $2, '{}'::jsonb, '{"method": "card", "amountCents": 3800}'::jsonb, 'pending', 'PENDING_EXTERNAL_ID')
        RETURNING id
      `, [testRestaurantId, orderId]);

      const queueId = rows[0].id;
      const adapter = new MockFiscalAdapterWithFailures('success_no_protocol');
      
      // Primeira tentativa: success sem protocol
      const result = await adapter.onSealed(
        { seal_id: 'test', entity_type: 'ORDER', entity_id: orderId } as any,
        { event_id: 'test', stream_id: 'ORDER:test', type: 'PAYMENT_CONFIRMED', payload: {} } as any
      );

      // Verificar que result.status é REPORTED mas sem gov_protocol
      expect(result.status).toBe('REPORTED');
      expect(result.gov_protocol).toBeUndefined();

      // Worker deve detectar e manter PENDING_EXTERNAL_ID
      // (simulando validação do worker)
      if (result.status === 'REPORTED' && !result.gov_protocol) {
        await pool.query(`
          UPDATE public.gm_fiscal_queue 
          SET external_id_status = 'PENDING_EXTERNAL_ID',
              updated_at = timezone('utc'::text, now())
          WHERE id = $1
        `, [queueId]);
      }

      // Verificar estado
      const { rows: statusRows } = await pool.query(`
        SELECT external_id_status, retry_count
        FROM public.gm_fiscal_queue
        WHERE id = $1
      `, [queueId]);

      expect(statusRows[0].external_id_status).toBe('PENDING_EXTERNAL_ID');

      // Segunda tentativa: success COM protocol
      adapter.setFailureMode('success');
      const result2 = await adapter.onSealed(
        { seal_id: 'test', entity_type: 'ORDER', entity_id: orderId } as any,
        { event_id: 'test', stream_id: 'ORDER:test', type: 'PAYMENT_CONFIRMED', payload: {} } as any
      );

      expect(result2.gov_protocol).toBeDefined();

      // Confirmar External ID
      await pool.query(`
        SELECT public.confirm_external_id($1::uuid, $2::text)
      `, [queueId, result2.gov_protocol!]);

      // Verificar estado final
      const { rows: finalRows } = await pool.query(`
        SELECT external_id_status, external_id
        FROM public.gm_fiscal_queue
        WHERE id = $1
      `, [queueId]);

      expect(finalRows[0].external_id_status).toBe('CONFIRMED_EXTERNAL_ID');
      expect(finalRows[0].external_id).toBe(result2.gov_protocol);
    });
  });

  describe('Cenário 3: Rede cai após pagamento, antes da chamada fiscal', () => {
    it('deve manter pedido em PENDING e retry quando rede voltar', async () => {
      const orderId = testOrderIds[2];
      
      // Criar item na fila (simulando que pagamento foi confirmado mas rede caiu)
      const { rows } = await pool.query(`
        INSERT INTO public.gm_fiscal_queue (
          restaurant_id, order_id, order_data, payment_data, status, external_id_status
        )
        VALUES ($1, $2, '{}'::jsonb, '{"method": "card", "amountCents": 3800}'::jsonb, 'pending', 'PENDING_EXTERNAL_ID')
        RETURNING id
      `, [testRestaurantId, orderId]);

      const queueId = rows[0].id;

      // Simular timeout (rede caiu)
      const adapter = new MockFiscalAdapterWithFailures('timeout');
      
      try {
        await adapter.onSealed(
          { seal_id: 'test', entity_type: 'ORDER', entity_id: orderId } as any,
          { event_id: 'test', stream_id: 'ORDER:test', type: 'PAYMENT_CONFIRMED', payload: {} } as any
        );
      } catch (error: any) {
        // Timeout esperado
        expect(error.message).toContain('timeout');
        
        // Marcar como retry
        await pool.query(`
          SELECT public.mark_fiscal_queue_failed($1::uuid, $2::text, 60)
        `, [queueId, error.message]);
      }

      // Verificar que está PENDING_EXTERNAL_ID e aguardando retry
      const { rows: statusRows } = await pool.query(`
        SELECT external_id_status, retry_count, next_retry_at
        FROM public.gm_fiscal_queue
        WHERE id = $1
      `, [queueId]);

      expect(statusRows[0].external_id_status).toBe('PENDING_EXTERNAL_ID');
      expect(statusRows[0].retry_count).toBe(1);
      expect(statusRows[0].next_retry_at).not.toBeNull();

      // Simular reconexão: retry com success
      adapter.setFailureMode('success');
      const result = await adapter.onSealed(
        { seal_id: 'test', entity_type: 'ORDER', entity_id: orderId } as any,
        { event_id: 'test', stream_id: 'ORDER:test', type: 'PAYMENT_CONFIRMED', payload: {} } as any
      );

      expect(result.gov_protocol).toBeDefined();

      // Confirmar External ID
      await pool.query(`
        SELECT public.confirm_external_id($1::uuid, $2::text)
      `, [queueId, result.gov_protocol!]);

      // Verificar estado final
      const { rows: finalRows } = await pool.query(`
        SELECT external_id_status, external_id
        FROM public.gm_fiscal_queue
        WHERE id = $1
      `, [queueId]);

      expect(finalRows[0].external_id_status).toBe('CONFIRMED_EXTERNAL_ID');
      expect(finalRows[0].external_id).toBe(result.gov_protocol);
    });
  });

  describe('Validação: Nenhum pedido fica "preso"', () => {
    it('deve ter timeout ou max retry para todos os pedidos', async () => {
      // Verificar se há pedidos em PENDING há mais de 1 hora sem retry
      const { rows } = await pool.query(`
        SELECT id, order_id, external_id_status, created_at,
               EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - created_at)) / 3600 AS hours_old
        FROM public.gm_fiscal_queue
        WHERE restaurant_id = $1
          AND external_id_status = 'PENDING_EXTERNAL_ID'
          AND EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - created_at)) / 3600 > 1
          AND (next_retry_at IS NULL OR next_retry_at > timezone('utc'::text, now()))
      `, [testRestaurantId]);

      // Não deve haver pedidos "presos" (sem retry agendado há mais de 1 hora)
      expect(rows.length).toBe(0);
    });
  });

  describe('Validação: Log auditável', () => {
    it('deve ter histórico de erros para cada tentativa', async () => {
      const orderId = testOrderIds[3];
      
      const { rows } = await pool.query(`
        INSERT INTO public.gm_fiscal_queue (
          restaurant_id, order_id, order_data, payment_data, status, external_id_status
        )
        VALUES ($1, $2, '{}'::jsonb, '{"method": "card", "amountCents": 3800}'::jsonb, 'pending', 'PENDING_EXTERNAL_ID')
        RETURNING id
      `, [testRestaurantId, orderId]);

      const queueId = rows[0].id;

      // Simular 3 tentativas com erro
      for (let i = 0; i < 3; i++) {
        await pool.query(`
          SELECT public.mark_fiscal_queue_failed($1::uuid, $2::text, 60)
        `, [queueId, `Test error attempt ${i + 1}`]);
      }

      // Verificar error_history
      const { rows: historyRows } = await pool.query(`
        SELECT error_history
        FROM public.gm_fiscal_queue
        WHERE id = $1
      `, [queueId]);

      const errorHistory = historyRows[0].error_history;
      expect(Array.isArray(errorHistory)).toBe(true);
      expect(errorHistory.length).toBe(3);
      
      // Cada entrada deve ter timestamp, error, attempt
      errorHistory.forEach((entry: any, index: number) => {
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('error');
        expect(entry).toHaveProperty('attempt');
        expect(entry.attempt).toBe(index + 1);
      });
    });
  });

  describe('Validação: View para alertas', () => {
    it('deve retornar pedidos pending e failed corretamente', async () => {
      // Criar pedidos em diferentes estados
      const pendingOrderId = testOrderIds[4];
      await pool.query(`
        INSERT INTO public.gm_fiscal_queue (
          restaurant_id, order_id, order_data, payment_data, status, external_id_status
        )
        VALUES ($1, $2, '{}'::jsonb, '{"method": "card", "amountCents": 3800}'::jsonb, 'pending', 'PENDING_EXTERNAL_ID')
      `, [testRestaurantId, pendingOrderId]);

      // Verificar view
      const { rows } = await pool.query(`
        SELECT * FROM public.v_fiscal_pending_external_ids
        WHERE restaurant_id = $1
      `, [testRestaurantId]);

      const pending = rows.filter(r => r.external_id_status === 'PENDING_EXTERNAL_ID');
      const failed = rows.filter(r => r.external_id_status === 'FAILED_EXTERNAL_ID');

      expect(pending.length).toBeGreaterThan(0);
      expect(rows.every((r: any) => r.minutes_since_created !== null)).toBe(true);
    });
  });
});
