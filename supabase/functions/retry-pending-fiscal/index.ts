/**
 * P0-4 FIX: Background Job para Retentar Faturas PENDING
 * 
 * Esta função Edge é executada periodicamente (via cron ou manualmente)
 * para retentar faturas que falharam e ficaram com status PENDING.
 * 
 * Configuração no Supabase Dashboard:
 * - Cron: 0 */5 * * * * (a cada 5 minutos)
 * - Ou chamar manualmente via API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAX_RETRIES = 10;
const MAX_AGE_HOURS = 24; // Não retentar faturas mais antigas que 24h

interface FiscalEvent {
  fiscal_event_id: string;
  order_id: string;
  restaurant_id: string;
  fiscal_status: string;
  error_details?: string;
  created_at: string;
  retry_count?: number;
}

serve(async (req) => {
  try {
    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar faturas PENDING que precisam ser retentadas
    const maxAge = new Date();
    maxAge.setHours(maxAge.getHours() - MAX_AGE_HOURS);

    const { data: pendingFiscals, error: fetchError } = await supabase
      .from('fiscal_event_store')
      .select('*')
      .eq('fiscal_status', 'PENDING')
      .gte('created_at', maxAge.toISOString())
      .lte('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(50); // Processar até 50 por execução

    if (fetchError) {
      console.error('[RetryPendingFiscal] Error fetching pending fiscals:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending fiscals', details: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingFiscals || pendingFiscals.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending fiscals to retry', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[RetryPendingFiscal] Found ${pendingFiscals.length} pending fiscals to retry`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Processar cada fatura PENDING
    for (const fiscal of pendingFiscals) {
      try {
        // Buscar dados do pedido
        const { data: order, error: orderError } = await supabase
          .from('gm_orders')
          .select('*, items:gm_order_items(*), restaurant:gm_restaurants(*)')
          .eq('id', fiscal.order_id)
          .eq('restaurant_id', fiscal.restaurant_id)
          .single();

        if (orderError || !order) {
          console.error(`[RetryPendingFiscal] Order not found: ${fiscal.order_id}`, orderError);
          failed++;
          continue;
        }

        // Buscar configuração fiscal do restaurante
        const { data: restaurant, error: restaurantError } = await supabase
          .from('gm_restaurants')
          .select('fiscal_config')
          .eq('id', fiscal.restaurant_id)
          .single();

        if (restaurantError || !restaurant?.fiscal_config) {
          console.error(`[RetryPendingFiscal] Fiscal config not found for restaurant: ${fiscal.restaurant_id}`);
          failed++;
          continue;
        }

        const fiscalConfig = restaurant.fiscal_config as any;
        const invoiceXpressConfig = fiscalConfig?.invoicexpress;

        if (!invoiceXpressConfig?.apiKey || !invoiceXpressConfig?.accountName) {
          console.error(`[RetryPendingFiscal] InvoiceXpress credentials not configured for restaurant: ${fiscal.restaurant_id}`);
          // Marcar como REJECTED (não retentar mais)
          await supabase
            .from('fiscal_event_store')
            .update({
              fiscal_status: 'REJECTED',
              error_details: 'Fiscal credentials not configured',
              retry_count: (fiscal.retry_count || 0) + 1,
            })
            .eq('fiscal_event_id', fiscal.fiscal_event_id);
          failed++;
          continue;
        }

        // Reconstruir TaxDocument do payload_sent
        const payloadSent = fiscal.payload_sent as any;
        if (!payloadSent) {
          console.error(`[RetryPendingFiscal] No payload_sent for fiscal: ${fiscal.fiscal_event_id}`);
          failed++;
          continue;
        }

        // Chamar InvoiceXpress API (via backend proxy interno)
        // P0-1 FIX: Edge Function chama backend proxy, que busca API key do banco
        const apiBase = Deno.env.get('API_BASE') || Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'http://localhost:4320';
        const internalServiceKey = Deno.env.get('INTERNAL_SERVICE_KEY') || Deno.env.get('INTERNAL_API_TOKEN') || '';
        
        const response = await fetch(`${apiBase}/api/fiscal/invoicexpress/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-internal-service-key': internalServiceKey,
          },
          body: JSON.stringify({
            invoice: payloadSent.invoice || payloadSent,
            accountName: invoiceXpressConfig.accountName,
            // NÃO enviar apiKey - backend proxy busca do banco
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`InvoiceXpress API Error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        const invoice = result.invoice || result;

        // Atualizar fiscal_event_store com sucesso
        await supabase
          .from('fiscal_event_store')
          .update({
            fiscal_status: 'REPORTED',
            gov_protocol: invoice.id?.toString(),
            pdf_url: invoice.pdf?.url || `https://${invoiceXpressConfig.accountName}.app.invoicexpress.com/documents/${invoice.id}.pdf`,
            qr_code: invoice.qr_code,
            fiscal_signature: invoice.fiscal_signature,
            retry_count: (fiscal.retry_count || 0) + 1,
            error_details: null,
          })
          .eq('fiscal_event_id', fiscal.fiscal_event_id);

        succeeded++;
        console.log(`[RetryPendingFiscal] ✅ Successfully retried fiscal: ${fiscal.fiscal_event_id}`);

      } catch (error: any) {
        console.error(`[RetryPendingFiscal] ❌ Failed to retry fiscal ${fiscal.fiscal_event_id}:`, error);

        // Incrementar retry_count
        const newRetryCount = (fiscal.retry_count || 0) + 1;

        // Se excedeu max retries, marcar como FAILED
        if (newRetryCount >= MAX_RETRIES) {
          await supabase
            .from('fiscal_event_store')
            .update({
              fiscal_status: 'FAILED',
              error_details: `Max retries exceeded: ${error.message}`,
              retry_count: newRetryCount,
            })
            .eq('fiscal_event_id', fiscal.fiscal_event_id);
        } else {
          // Manter PENDING para próxima tentativa
          await supabase
            .from('fiscal_event_store')
            .update({
              retry_count: newRetryCount,
              error_details: error.message || 'Unknown error',
            })
            .eq('fiscal_event_id', fiscal.fiscal_event_id);
        }

        failed++;
      }

      processed++;
    }

    return new Response(
      JSON.stringify({
        message: 'Retry pending fiscal job completed',
        processed,
        succeeded,
        failed,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[RetryPendingFiscal] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: 'Fatal error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
