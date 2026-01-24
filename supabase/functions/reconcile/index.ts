import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create Service Role Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const limit = 25;

        // 1. Dequeue Jobs
        const { data: jobs, error } = await supabase.rpc('dequeue_reconciliation_jobs', { p_limit: limit });

        if (error) throw error;
        if (!jobs || jobs.length === 0) {
            return new Response(JSON.stringify({ processed: 0, message: 'No jobs' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        const results = { resolved: 0, failed: 0 };
        console.log(`Processing ${jobs.length} reconciliation jobs...`);

        // 2. Process Jobs
        for (const job of jobs) {
            try {
                if (job.entity_type === 'cash_register') {
                    await reconcileCashRegister(supabase, job);
                } else {
                    throw new Error(`Unknown entity type: ${job.entity_type}`);
                }
                results.resolved++;

                // Mark Resolved
                await supabase.from('gm_reconciliation_queue')
                    .update({ status: 'RESOLVED', updated_at: new Date().toISOString() })
                    .eq('id', job.id);

            } catch (err: any) {
                results.failed++;
                console.error(`Reconciliation Failed for Job ${job.id}:`, err);

                const isDead = job.attempts >= job.max_attempts;
                await supabase.from('gm_reconciliation_queue')
                    .update({
                        status: isDead ? 'DEAD' : 'FAILED',
                        last_error: err?.message || String(err),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', job.id);
            }
        }

        return new Response(JSON.stringify({ processed: jobs.length, ...results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

/**
 * CashRegister Reconciler Logic
 * Duplicated from ReconciliationEngine.ts (Frontend) for Edge independence.
 */
async function reconcileCashRegister(supabase: any, job: any) {
    const streamType = job.restaurant_id;
    const streamIdSuffix = `CASH_REGISTER:${job.entity_id}`;

    // Fetch Events
    const { data: events, error } = await supabase
        .from('event_store')
        .select('*')
        .eq('stream_type', streamType)
        .eq('stream_id', streamIdSuffix)
        .order('stream_version', { ascending: true });

    if (error) throw new Error(`Event fetch failed: ${error.message}`);

    if (!events || events.length === 0) {
        // Quarantine
        await supabase.from('gm_cash_registers')
            .update({ kernel_shadow_status: 'QUARANTINED' })
            .eq('id', job.entity_id);
        throw new Error('NO_EVENT_STREAM: Quarantined.');
    }

    // Reduce
    let state: any = {
        status: 'closed',
        total_sales_cents: 0
    };
    let lastEventId = null;
    let lastVersion = 0;

    for (const event of events) {
        lastEventId = event.event_id;
        lastVersion = event.stream_version;
        const payload = (typeof event.payload === 'string') ? JSON.parse(event.payload) : (event.payload || {});
        const type = event.event_type || event.type;

        if (type.endsWith('OPENED') || type === 'CASH_REGISTER_OPEN') {
            state.status = 'open';
            state.opened_at = event.created_at;
            state.opened_by = payload.opened_by || event.meta?.actorId;
            state.opening_balance_cents = payload.opening_balance_cents;
            state.total_sales_cents = 0;
            state.name = payload.name || state.name;
        } else if (type.endsWith('CLOSED') || type === 'CASH_REGISTER_CLOSE') {
            state.status = 'closed';
            state.closed_at = event.created_at;
            state.closed_by = payload.closed_by || event.meta?.actorId;
            state.closing_balance_cents = payload.closing_balance_cents;
            state.total_sales_cents = payload.total_sales_cents;
        }
    }

    // Write Projection
    const { error: updateError } = await supabase
        .from('gm_cash_registers')
        .update({
            status: state.status,
            opened_at: state.opened_at,
            opened_by: state.opened_by,
            opening_balance_cents: state.opening_balance_cents,
            total_sales_cents: state.total_sales_cents,
            closed_at: state.closed_at,
            closed_by: state.closed_by,
            closing_balance_cents: state.closing_balance_cents,
            // Shadow
            kernel_shadow_status: 'CLEAN',
            kernel_last_event_id: lastEventId,
            kernel_last_event_version: lastVersion
        })
        .eq('id', job.entity_id)
        .eq('restaurant_id', job.restaurant_id);

    if (updateError) throw updateError;
}
