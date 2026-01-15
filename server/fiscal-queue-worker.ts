/**
 * Fiscal Queue Worker
 * 
 * TASK-2.1.1: Worker para processar fila de emissão fiscal
 * 
 * Implementa lógica completa de processamento fiscal:
 * - Busca dados do pedido do DB
 * - Detecta país do restaurante
 * - Seleciona adapter baseado no país e configuração
 * - Cria TaxDocument
 * - Valida conformidade legal
 * - Chama adapter.onSealed
 * - Registra em fiscal_event_store
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { InvoiceXpressAdapterServer } from './fiscal/InvoiceXpressAdapterServer';
import { TicketBAIAdapter } from '../fiscal-modules/adapters/TicketBAIAdapter';
import { SAFTAdapter } from '../fiscal-modules/adapters/SAFTAdapter';
import { ConsoleFiscalAdapter } from '../fiscal-modules/ConsoleFiscalAdapter';
import { LegalComplianceValidator } from '../fiscal-modules/validators/LegalComplianceValidator';
import type { TaxDocument, FiscalResult } from '../fiscal-modules/types';
import type { FiscalObserver } from '../fiscal-modules/FiscalObserver';
import type { LegalSeal } from '../legal-boundary/types';
import type { CoreEvent } from '../event-log/types';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const POLL_INTERVAL_MS = Number(process.env.FISCAL_QUEUE_POLL_INTERVAL_MS || 5000);

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 10 });

interface FiscalQueueItem {
  id: string;
  restaurant_id: string;
  order_id: string;
  order_data: any;
  payment_data: any;
  retry_count: number;
  max_retries: number;
}

/**
 * Busca dados completos do pedido do DB (incluindo items)
 */
async function getOrderData(orderId: string, restaurantId: string): Promise<any> {
  const { rows } = await pool.query(
    `SELECT 
      o.*,
      r.name as restaurant_name,
      r.address as restaurant_address,
      r.city as restaurant_city,
      r.postal_code as restaurant_postal_code,
      r.country_code as restaurant_country_code,
      json_agg(
        json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'name_snapshot', oi.name_snapshot,
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'price_snapshot', oi.price_snapshot,
          'unit_price', oi.price_snapshot / oi.quantity,
          'subtotal', oi.price_snapshot
        )
      ) FILTER (WHERE oi.id IS NOT NULL) as items
    FROM gm_orders o
    LEFT JOIN gm_restaurants r ON r.id = o.restaurant_id
    LEFT JOIN gm_order_items oi ON oi.order_id = o.id
    WHERE o.id = $1 AND o.restaurant_id = $2
    GROUP BY o.id, r.id`,
    [orderId, restaurantId]
  );

  if (rows.length === 0) {
    throw new Error(`Order ${orderId} not found for restaurant ${restaurantId}`);
  }

  return rows[0];
}

/**
 * Busca país do restaurante
 */
async function getRestaurantCountry(restaurantId: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT country_code, iso FROM gm_restaurants WHERE id = $1`,
    [restaurantId]
  );

  if (rows.length === 0) {
    return 'ES'; // Default: Espanha
  }

  return rows[0].country_code || rows[0].iso || 'ES';
}

/**
 * Busca configuração fiscal do restaurante
 */
async function getRestaurantFiscalConfig(restaurantId: string) {
  const { rows } = await pool.query(
    `SELECT fiscal_provider, fiscal_config FROM gm_restaurants WHERE id = $1`,
    [restaurantId]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Seleciona adapter fiscal baseado no país e configuração
 */
async function selectAdapter(country: string, restaurantId: string): Promise<FiscalObserver> {
  const config = await getRestaurantFiscalConfig(restaurantId);

  if (config) {
    const fiscalConfig = (config.fiscal_config as any) || {};
    const provider = config.fiscal_provider || 'mock';

    // Se InvoiceXpress está configurado, usar InvoiceXpressAdapterServer
    if (provider === 'invoice_xpress' && fiscalConfig.invoicexpress?.accountName && fiscalConfig.invoicexpress?.apiKey) {
      return {
        onSealed: async (seal: LegalSeal, event: CoreEvent): Promise<FiscalResult> => {
          const adapter = new InvoiceXpressAdapterServer(
            fiscalConfig.invoicexpress.accountName,
            fiscalConfig.invoicexpress.apiKey
          );

          // Extrair order_data e payment_data do event payload
          const orderData = (event.payload as any)?.order_data || {};
          const paymentData = (event.payload as any)?.payment_data || {};

          // TASK-2.3.2: Extrair vatRate do TaxDocument se disponível
          const taxDoc = (event.payload as any)?.tax_document as TaxDocument | undefined;
          const vatRate = taxDoc?.vatRate || (country === 'PT' ? 0.23 : 0.21); // Default baseado no país

          const invoiceResult = await adapter.emitInvoice(orderData, paymentData, vatRate);

          return {
            status: 'REPORTED',
            gov_protocol: String(invoiceResult.id || 0),
            reported_at: new Date(),
            pdf_url: invoiceResult.pdf?.url,
          };
        }
      };
    }
  }

  // Fallback: Adapters regionais baseados no país
  if (country === 'ES') {
    return new TicketBAIAdapter();
  } else if (country === 'PT') {
    return new SAFTAdapter();
  }

  // Default: Mock adapter
  return new ConsoleFiscalAdapter();
}

/**
 * Cria documento fiscal a partir do pedido
 * 
 * [P0-05 FIX] Uses order.total_cents as fiscal base, NOT payment.amountCents
 * Reason: Payments can be partial (split payments). Tax document must reflect 
 * the FULL order value for legal compliance.
 */
function createTaxDocument(order: any, payment: {
  paymentMethod: string;
  amountCents: number;
}, country: string = 'ES'): TaxDocument {
  const restaurantName = order.restaurant_name || 'Restaurante';
  const restaurantAddress = order.restaurant_address || 'N/A';
  const restaurantCity = order.restaurant_city || 'N/A';
  const restaurantPostalCode = order.restaurant_postal_code || '0000-000';

  // Detectar tipo de documento baseado no país
  let docType: 'MOCK' | 'TICKETBAI' | 'SAF-T' = 'MOCK';
  let vatRate = 0.21; // Default: 21% (Espanha)

  if (country === 'ES') {
    docType = 'TICKETBAI';
    vatRate = 0.21; // 21% IVA (Espanha)
  } else if (country === 'PT') {
    docType = 'SAF-T';
    vatRate = 0.23; // 23% IVA (Portugal)
  }

  // [P0-05 FIX] Use order.total_cents as fiscal base (NOT payment.amountCents)
  // payments can be partial, but fiscal document MUST reflect full order value
  const fiscalBaseCents = order.total_cents ?? payment.amountCents;
  const totalAmount = fiscalBaseCents / 100; // Converter para euros
  const vatAmount = totalAmount * vatRate / (1 + vatRate); // IVA incluído no total
  const subtotal = totalAmount - vatAmount;
  const vatAmountCents = Math.round(vatAmount * 100); // TASK-2.3.1: Valor absoluto em centavos

  return {
    doc_type: docType,
    ref_event_id: `EVENT-${order.id}`,
    ref_seal_id: `SEAL-${order.id}`,
    total_amount: totalAmount,
    taxes: {
      vat: vatAmount,
    },
    // TASK-2.3.1: Separar vatRate de vatAmount
    vatRate: vatRate, // Taxa como percentual (0.23 = 23%)
    vatAmount: vatAmountCents, // Valor absoluto em centavos
    items: (order.items || []).map((item: any) => ({
      code: item.product_id || 'N/A',
      description: item.name_snapshot || item.product_name || 'Item',
      quantity: item.quantity || 1,
      unit_price: (item.price_snapshot || item.unit_price || 0) / 100,
      total: ((item.price_snapshot || item.unit_price || 0) * (item.quantity || 1)) / 100,
    })),
    raw_payload: {
      order_id: order.id,
      restaurant_id: order.restaurant_id,
      restaurant_name: restaurantName,
      address: restaurantAddress,
      city: restaurantCity,
      postal_code: restaurantPostalCode,
      tax_registration_number: order.tax_registration_number || '999999999',
      payment_method: payment.paymentMethod,
      total_amount: totalAmount,
      vat_amount: vatAmount,
      subtotal: subtotal,
      items: order.items,
      generated_at: new Date().toISOString(),
    },
  };
}

/**
 * Registra resultado em fiscal_event_store
 */
async function recordFiscalEvent(
  orderId: string,
  restaurantId: string,
  taxDoc: TaxDocument,
  result: FiscalResult
): Promise<void> {
  await pool.query(
    `INSERT INTO fiscal_event_store (
      order_id,
      restaurant_id,
      doc_type,
      gov_protocol,
      payload_sent,
      response_received,
      fiscal_status,
      ref_event_id,
      ref_seal_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (order_id, doc_type) DO UPDATE SET
      gov_protocol = EXCLUDED.gov_protocol,
      response_received = EXCLUDED.response_received,
      fiscal_status = EXCLUDED.fiscal_status,
      updated_at = NOW()`,
    [
      orderId,
      restaurantId,
      taxDoc.doc_type,
      result.gov_protocol || null,
      JSON.stringify(taxDoc.raw_payload || {}),
      JSON.stringify(result),
      result.status,
      taxDoc.ref_event_id,
      taxDoc.ref_seal_id,
    ]
  );
}

/**
 * Processa um item da fila fiscal
 */
async function processFiscalQueueItem(item: FiscalQueueItem): Promise<void> {
  console.log(`[FiscalWorker] Processing queue item ${item.id}`, {
    orderId: item.order_id,
    restaurantId: item.restaurant_id,
    retryCount: item.retry_count,
  });

  try {
    // 1. Buscar dados completos do pedido do DB
    const order = await getOrderData(item.order_id, item.restaurant_id);
    if (!order) {
      throw new Error(`Order ${item.order_id} not found`);
    }

    // 2. Detectar país do restaurante
    const country = await getRestaurantCountry(item.restaurant_id);

    // 3. Selecionar adapter baseado no país e configuração
    const adapter = await selectAdapter(country, item.restaurant_id);

    // 4. Criar documento fiscal
    const taxDoc = createTaxDocument(order, item.payment_data, country);

    // 5. Validar conformidade legal
    const validation = LegalComplianceValidator.validate(taxDoc, country as 'PT' | 'ES');

    if (!validation.isValid) {
      console.error(`[FiscalWorker] Legal compliance validation failed`, {
        orderId: item.order_id,
        errors: validation.errors,
        warnings: validation.warnings,
      });

      if (validation.errors.length > 0) {
        throw new Error(`Documento fiscal não está em conformidade: ${validation.errors.map((e: any) => e.message).join(', ')}`);
      }
    } else if (validation.warnings.length > 0) {
      console.warn(`[FiscalWorker] Legal compliance warnings`, {
        orderId: item.order_id,
        warnings: validation.warnings,
      });
    }

    // 6. Criar LegalSeal e CoreEvent mock para adapter.onSealed
    const seal: LegalSeal = {
      seal_id: `SEAL-${item.order_id}-${Date.now()}`,
      entity_type: 'ORDER',
      entity_id: item.order_id,
      seal_event_id: `EVENT-${item.order_id}-${Date.now()}`,
      stream_hash: `HASH-${item.order_id}`,
      sealed_at: new Date(),
      sequence: 1,
      legal_state: 'PAYMENT_SEALED',
      financial_state: JSON.stringify({ amount: item.payment_data.amountCents }),
    };

    const event: CoreEvent = {
      event_id: `EVENT-${item.order_id}-${Date.now()}`,
      stream_id: `ORDER:${item.order_id}`,
      stream_version: 0,
      type: 'PAYMENT_CONFIRMED',
      payload: {
        order_id: item.order_id,
        payment_id: item.payment_data.paymentId,
        amount_cents: item.payment_data.amountCents,
        payment_method: item.payment_data.method,
        tax_document: taxDoc,
        order_data: order,
        payment_data: item.payment_data,
      },
      occurred_at: new Date(),
      idempotency_key: `fiscal:${item.order_id}`,
      actor_ref: 'FISCAL_WORKER',
    };

    // 7. Processar via adapter
    const result = await adapter.onSealed(seal, event);

    // CRITICAL: Verificar se fiscal foi rejeitado
    if (result.status === 'REJECTED') {
      console.error(`[FiscalWorker] ❌ FISCAL REJECTED - Credentials not configured`, {
        orderId: item.order_id,
        error: result.error_details,
        restaurantId: item.restaurant_id,
      });
      throw new Error(`Fiscal rejected: ${result.error_details || 'Unknown error'}`);
    }

    // CRITICAL: Verificar se SUCCESS mas sem gov_protocol (External ID missing)
    if ((result.status === 'SUCCESS' || result.status === 'REPORTED') && !result.gov_protocol) {
      console.error(`[FiscalWorker] ❌ CRITICAL: Fiscal ${result.status} but no gov_protocol (External ID missing)`, {
        orderId: item.order_id,
        restaurantId: item.restaurant_id,
        result: result,
        attempt: item.retry_count + 1,
      });

      // Manter status PENDING_EXTERNAL_ID e forçar retry
      await pool.query(
        `UPDATE public.gm_fiscal_queue 
         SET external_id_status = 'PENDING_EXTERNAL_ID',
             updated_at = timezone('utc'::text, now())
         WHERE id = $1`,
        [item.id]
      );

      throw new Error(`Fiscal ${result.status} but no protocol received - External ID missing`);
    }

    // 8. Registrar em fiscal_event_store
    await recordFiscalEvent(item.order_id, item.restaurant_id, taxDoc, result);

    // 9. Confirmar External ID recebido
    if (result.gov_protocol) {
      await pool.query(
        `SELECT public.confirm_external_id($1::uuid, $2::text)`,
        [item.id, result.gov_protocol]
      );
      console.log(`[FiscalWorker] ✅ External ID confirmed: ${result.gov_protocol} for order ${item.order_id}`);
    }

    // 10. Marcar como completo
    await markCompleted(item.id, {
      status: result.status,
      gov_protocol: result.gov_protocol,
      pdf_url: result.pdf_url,
      raw_response: result,
    });

    console.log(`[FiscalWorker] ✅ Queue item ${item.id} completed. Status: ${result.status}, Protocol: ${result.gov_protocol}`);

  } catch (error: any) {
    console.error(`[FiscalWorker] ❌ Queue item ${item.id} failed:`, error.message);

    // TASK-2.2.1: Marcar como falhou com retry e exponential backoff
    // Backoff: 2^attempts * 60 segundos (60s, 120s, 240s, 480s, 960s, ...)
    // Máximo 10 tentativas (definido em max_retries)
    const baseDelaySeconds = 60;
    await pool.query(
      `SELECT public.mark_fiscal_queue_failed(
        $1::uuid,
        $2::text,
        $3::integer
      )`,
      [item.id, error.message || 'Unknown error', baseDelaySeconds]
    );

    // TASK-2.2.2: Log do retry ou falha permanente
    const nextRetryCount = item.retry_count + 1;
    if (nextRetryCount < item.max_retries) {
      const backoffSeconds = baseDelaySeconds * Math.pow(2, item.retry_count);
      console.log(`[FiscalWorker] Item ${item.id} will retry in ${backoffSeconds}s (attempt ${nextRetryCount}/${item.max_retries})`);
    } else {
      // TASK-2.2.2: Item excedeu max_retries - marcar como FAILED_EXTERNAL_ID
      console.error(`[FiscalWorker] ❌ CRITICAL: Item ${item.id} exceeded max retries (${item.max_retries}). Marking as FAILED_EXTERNAL_ID.`, {
        orderId: item.order_id,
        restaurantId: item.restaurant_id,
        error: error.message,
        attempts: nextRetryCount,
      });

      // Marcar External ID como falhado (alerta visível no dashboard)
      await pool.query(
        `SELECT public.fail_external_id($1::uuid, $2::text)`,
        [item.id, `Max retries exceeded (${item.max_retries}). Last error: ${error.message}`]
      );

      // TODO: Em produção, enviar notificação para gerente (push, email, webhook)
      // Por enquanto, apenas log crítico + status no DB (visível via view)
    }
  }
}

async function markCompleted(queueId: string, result: any) {
  await pool.query(
    `SELECT public.mark_fiscal_queue_completed(
        $1::uuid,
        $2::jsonb,
        NULL::uuid
      )`,
    [queueId, JSON.stringify(result)]
  );
}

/**
 * Loop principal do worker
 * 
 * TASK-2.2.1: Processa itens 'pending' e 'retrying' (quando next_retry_at <= NOW())
 * - get_next_fiscal_queue_item() já filtra itens retrying com next_retry_at <= NOW()
 * - Backoff exponencial: 2^attempts * 60 segundos (60s, 120s, 240s, 480s, 960s, ...)
 * - Máximo 10 tentativas (max_retries)
 */
async function workerLoop(): Promise<void> {
  while (true) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.get_next_fiscal_queue_item()`
      );

      if (rows.length > 0) {
        const item = rows[0] as FiscalQueueItem;

        // Log se é retry
        if (item.retry_count > 0) {
          const backoffSeconds = 60 * Math.pow(2, item.retry_count - 1);
          console.log(`[FiscalWorker] Retrying item ${item.id} (attempt ${item.retry_count + 1}/${item.max_retries}, backoff was ${backoffSeconds}s)`);
        }

        await processFiscalQueueItem(item);
      } else {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (error: any) {
      console.error('[FiscalWorker] Error in worker loop:', error);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

async function startWorker(): Promise<void> {
  console.log('[FiscalWorker] Starting fiscal queue worker v1.1 (Order-Based Math Fix)...');
  try {
    await pool.query('SELECT 1');
    console.log('[FiscalWorker] ✅ Database connection OK');
  } catch (error) {
    console.error('[FiscalWorker] ❌ Database connection failed:', error);
    process.exit(1);
  }
  workerLoop().catch(error => {
    console.error('[FiscalWorker] Fatal error:', error);
    process.exit(1);
  });
}

if (require.main === module) {
  startWorker();
}

export { startWorker, processFiscalQueueItem };
