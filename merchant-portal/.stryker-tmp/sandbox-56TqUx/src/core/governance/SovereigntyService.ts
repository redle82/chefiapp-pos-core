// @ts-nocheck
import { getTableClient } from '../infra/coreRpc';

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
     * Get High-Level Health Metrics (Core quando Docker — Fase 4)
     * Core pode não ter kernel_shadow_status em gm_cash_registers; em erro retorna 0.
     */
    static async getMetrics(restaurantId: string): Promise<SovereigntyMetrics> {
        const client = await getTableClient();
        let dirtyCount = 0;
        let quarantinedCount = 0;

        try {
            const { data: dirtyRows, error: dirtyErr } = await client
                .from('gm_cash_registers')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .eq('kernel_shadow_status', 'DIRTY');
            dirtyCount = dirtyErr ? 0 : (Array.isArray(dirtyRows) ? dirtyRows.length : 0);
        } catch {
            dirtyCount = 0;
        }
        try {
            const { data: quarantinedRows, error: quarantinedErr } = await client
                .from('gm_cash_registers')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .eq('kernel_shadow_status', 'QUARANTINED');
            quarantinedCount = quarantinedErr ? 0 : (Array.isArray(quarantinedRows) ? quarantinedRows.length : 0);
        } catch {
            quarantinedCount = 0;
        }

        const { data: queueStats } = await client
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
     * Get Reconciliation Queue (Paginated) — Core quando Docker (Fase 4)
     */
    static async getQueue(restaurantId: string, page: number = 0, pageSize: number = 50): Promise<ReconciliationJob[]> {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const client = await getTableClient();
        const { data, error } = await client
            .from('gm_reconciliation_queue')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return (Array.isArray(data) ? data : []) as ReconciliationJob[];
    }

    /**
     * Trigger Manual Reconciliation — Core only.
     * Reconciliation: Core (Docker) only. If not Docker, throw.
     */
    static async triggerHealer(): Promise<any> {
        const { BackendType, getBackendType } = await import('../infra/backendAdapter');
        if (getBackendType() !== BackendType.docker) {
            throw new Error(
                'Reconciliation requires Docker Core. Backend not configured or not Docker.'
            );
        }
        const core = (await import('../infra/dockerCoreFetchClient')).getDockerCoreFetchClient();
        const res = await core.rpc('reconcile', {});
        if (res.error) throw res.error;
        return res.data;
    }
}
