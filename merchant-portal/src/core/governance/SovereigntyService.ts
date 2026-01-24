import { supabase } from '../supabase';

export interface SovereigntyMetrics {
    dirtyCount: number;
    quarantinedCount: number;
    queue: {
        pending: number;
        processing: number;
        resolved: number;
        failed: number;
        dead: number;
    };
    totalQueueSize: number;
}

export interface ReconciliationJob {
    id: string;
    entity_type: string;
    entity_id: string;
    reason: string;
    severity: string; // 'NORMAL' | 'HIGH' | 'CRITICAL'
    status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'FAILED' | 'DEAD';
    attempts: number;
    max_attempts: number;
    last_error?: string;
    created_at: string;
    updated_at: string;
}

export class SovereigntyService {

    /**
     * Get High-Level Health Metrics
     */
    static async getMetrics(restaurantId: string): Promise<SovereigntyMetrics> {
        // 1. Dirty/Quarantined Count (Cash Registers)
        // Note: In a larger system we'd aggregate multiple tables. 
        // For now, CashRegister is the only one with law 2.5 enforcement.
        const { count: dirtyCount, error: dirtyError } = await supabase
            .from('gm_cash_registers')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurantId)
            .eq('kernel_shadow_status', 'DIRTY');

        const { count: quarantinedCount } = await supabase
            .from('gm_cash_registers')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurantId)
            .eq('kernel_shadow_status', 'QUARANTINED');

        // 2. Queue Stats
        // We can use a group by query via RPC if performance needed, but for dashboard simple select is fine or multiple counts.
        // Or fetch all jobs if list is small. 
        // Let's do a simple count per status query is cleaner but 5 queries.
        // Optimization: Fetch all active jobs (non-resolved) + count resolved via head.

        // Actually, let's fetch 'not resolved' for the list, and just count resolved.

        const { data: queueStats, error: queueError } = await supabase
            .from('gm_reconciliation_queue')
            .select('status')
            .eq('restaurant_id', restaurantId);
        // Warning: If thousands of jobs, this is heavy. 
        // Pagination handles the list, but metrics might need aggregate.
        // For MVP, client-side aggregation of recent 1000 is okay, 
        // or better using `.from(...).select('status', {count:'exact'})` per status.

        // Let's assume queue is relatively clean (processed jobs marked RESOLVED).
        // Best approach for MVP:
        const metrics: SovereigntyMetrics = {
            dirtyCount: dirtyCount || 0,
            quarantinedCount: quarantinedCount || 0,
            queue: {
                pending: 0,
                processing: 0,
                resolved: 0,
                failed: 0,
                dead: 0
            },
            totalQueueSize: 0
        };

        if (queueStats) {
            queueStats.forEach((job: any) => {
                const s = job.status.toLowerCase() as keyof typeof metrics.queue;
                if (metrics.queue[s] !== undefined) {
                    metrics.queue[s]++;
                }
            });
            metrics.totalQueueSize = queueStats.length;
        }

        return metrics;
    }

    /**
     * Get Reconciliation Queue (Paginated)
     */
    static async getQueue(restaurantId: string, page: number = 0, pageSize: number = 50): Promise<ReconciliationJob[]> {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from('gm_reconciliation_queue')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return data as ReconciliationJob[];
    }

    /**
     * Trigger Manual Reconciliation (Edge Function)
     */
    static async triggerHealer(): Promise<any> {
        const { data, error } = await supabase.functions.invoke('reconcile', {
            method: 'POST',
        });
        if (error) throw error;
        return data;
    }
}
