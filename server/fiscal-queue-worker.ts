/**
 * Fiscal Queue Worker
 * 
 * SPRINT 1 - Tarefa 1.1: Worker para processar fila de emissão fiscal
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { InvoiceXpressAdapterServer } from './fiscal/InvoiceXpressAdapterServer';

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

async function getRestaurantFiscalConfig(restaurantId: string) {
  const { rows } = await pool.query(
    `SELECT fiscal_provider, fiscal_config FROM gm_restaurants WHERE id = $1`,
    [restaurantId]
  );
  if (rows.length === 0) return null;
  return rows[0];
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
    // 1. Buscar configuração fiscal
    const config = await getRestaurantFiscalConfig(item.restaurant_id);
    if (!config) throw new Error('Restaurant config not found');

    const { fiscal_provider, fiscal_config } = config;

    // 2. Selecionar adapter
    if (fiscal_provider !== 'invoice_xpress' && fiscal_provider !== 'INVOICEXPRESS') {
      // If mocked/dev, just mock success
      if (!fiscal_provider || fiscal_provider === 'mock') {
        await markCompleted(item.id, { status: 'MOCKED', protocol: 'DEV-MOCK' });
        return;
      }
      throw new Error(`Provider ${fiscal_provider} not supported yet`);
    }

    const ixConfig = fiscal_config?.invoicexpress;
    if (!ixConfig?.accountName || !ixConfig?.apiKey) {
      throw new Error('InvoiceXpress credentials missing in restaurant config');
    }

    // 3. Processar
    const adapter = new InvoiceXpressAdapterServer(ixConfig.accountName, ixConfig.apiKey);
    console.log(`[FiscalWorker] Emitting InvoiceXpress for Order ${item.order_id}`);

    const invoiceResult = await adapter.emitInvoice(item.order_data, item.payment_data);

    // 4. Salvar Sucesso
    await markCompleted(item.id, {
      status: 'REPORTED',
      gov_protocol: String(invoiceResult.id || 0),
      raw_response: invoiceResult
    });

    console.log(`[FiscalWorker] ✅ Queue item ${item.id} completed. Invoice ID: ${invoiceResult.id}`);

  } catch (error: any) {
    console.error(`[FiscalWorker] ❌ Queue item ${item.id} failed:`, error.message);

    // Marcar como falhou (com retry se possível)
    await pool.query(
      `SELECT public.mark_fiscal_queue_failed(
        $1::uuid,
        $2::text,
        $3::integer
      )`,
      [item.id, error.message || 'Unknown error', 60] // Retry após 60s
    );
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
 */
async function workerLoop(): Promise<void> {
  while (true) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.get_next_fiscal_queue_item()`
      );

      if (rows.length > 0) {
        const item = rows[0] as FiscalQueueItem;
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
