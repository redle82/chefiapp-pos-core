import { getTableClient } from '../infra/coreRpc';
import { getFiscalService } from './FiscalService';
import { Logger } from '../logger';

const MAX_RETRIES = 10;
const ALERT_THRESHOLD = 3;

interface FiscalPendingEvent {
    fiscal_event_id: string;
    order_id: string;
    restaurant_id: string;
    retry_count: number;
    fiscal_status: string;
}

/**
 * FiscalQueueWorker
 * 
 * Ensures every "PAID" order eventually gets a "Fiscal Signature".
 * Implements Dead Letter Queue for persistent failures.
 */
export class FiscalQueueWorker {
    private interval: any;
    private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    private isRunning = false;
    private pendingCount = 0;
    private deadLetterCount = 0;
    private listeners: ((pendingCount: number, deadLetterCount: number) => void)[] = [];

    public start() {
        if (this.interval) return;
        Logger.info('[FiscalQueue] Worker Started 👷');
        // Initial run after short delay to allow app boot
        setTimeout(() => this.run(), 5000);
        this.interval = setInterval(() => this.run(), this.CHECK_INTERVAL_MS);
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            Logger.info('[FiscalQueue] Worker Stopped');
        }
    }

    public subscribe(listener: (pendingCount: number, deadLetterCount: number) => void) {
        this.listeners.push(listener);
        listener(this.pendingCount, this.deadLetterCount);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.pendingCount, this.deadLetterCount));
    }

    /**
     * Manual retry for a specific fiscal event
     */
    public async retryEvent(fiscalEventId: string): Promise<boolean> {
        try {
            const client = await getTableClient();
            const { data: event, error } = await client
                .from('fiscal_event_store')
                .select('*')
                .eq('fiscal_event_id', fiscalEventId)
                .single();

            if (error || !event) {
                Logger.error(`[FiscalQueue] Event ${fiscalEventId} not found`);
                return false;
            }

            await client
                .from('fiscal_event_store')
                .update({
                    dead_letter: false,
                    dead_letter_reason: null,
                    retry_count: 0,
                    last_retry_at: new Date().toISOString()
                })
                .eq('fiscal_event_id', fiscalEventId);

            // Trigger immediate processing
            await this.processEvent(event);
            return true;
        } catch (e) {
            Logger.error(`[FiscalQueue] Manual retry failed for ${fiscalEventId}`, e);
            return false;
        }
    }

    /**
     * Main Reconciliation Loop
     */
    public async run() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            Logger.debug('[FiscalQueue] Starting reconciliation...');

            // 1. Get pending fiscal events
            // Nota: A coluna dead_letter não existe na tabela fiscal_event_store
            // Usamos apenas fiscal_status para filtrar eventos pendentes
            const runClient = await getTableClient();
            const { data: pendingEvents, error: pendingError } = await runClient
                .from('fiscal_event_store')
                .select('fiscal_event_id, order_id, restaurant_id, retry_count, fiscal_status')
                .eq('fiscal_status', 'PENDING')
                .order('created_at', { ascending: true })
                .limit(50); // Process in batches

            // Handle table not found (404) gracefully - table may not exist in local schema
            if (pendingError) {
                if (pendingError.code === '42P01' || pendingError.message?.includes('does not exist') || pendingError.status === 404) {
                    Logger.debug('[FiscalQueue] fiscal_event_store table not found, skipping reconciliation');
                    this.pendingCount = 0;
                    this.notifyListeners();
                    return;
                }
                throw pendingError;
            }

            // 2. Dead letter count - coluna dead_letter não existe, usar 0 por enquanto
            // TODO: Adicionar coluna dead_letter na migration ou usar outro método para rastrear DLQ
            this.deadLetterCount = 0;
            this.pendingCount = pendingEvents?.length || 0;
            this.notifyListeners();

            if (!pendingEvents || pendingEvents.length === 0) {
                Logger.debug('[FiscalQueue] No pending events. ✅');
                return;
            }

            Logger.warn(`[FiscalQueue] Found ${pendingEvents.length} pending events. Processing...`);

            // 3. Process each event
            let successCount = 0;
            for (const event of pendingEvents) {
                const success = await this.processEvent(event);
                if (success) successCount++;
            }

            Logger.info(`[FiscalQueue] Processing complete. Success: ${successCount}/${pendingEvents.length}`);

            // Update counts after processing
            this.pendingCount = Math.max(0, pendingEvents.length - successCount);
            this.notifyListeners();

        } catch (err) {
            Logger.error('[FiscalQueue] Reconciliation failed', err);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Process individual fiscal event
     */
    private async processEvent(event: FiscalPendingEvent): Promise<boolean> {
        const currentRetry = (event.retry_count || 0) + 1;

        try {
            Logger.info(`[FiscalQueue] Processing event ${event.fiscal_event_id} (attempt ${currentRetry})...`);

            // Attempt to submit to AT
            const service = getFiscalService();
            const result = await service.processPaymentConfirmed({
                orderId: event.order_id,
                restaurantId: event.restaurant_id,
                paymentMethod: 'retry', // Marker for retry
                amountCents: 0, // Will be fetched from order
            });

            if (result && result.status === 'REPORTED') {
                Logger.info(`[FiscalQueue] Event ${event.fiscal_event_id} reported successfully ✅`);
                return true;
            }

            // If not reported, treat as failure
            await this.handleFailure(event, currentRetry, 'Submission did not return REPORTED status');
            return false;

        } catch (e: any) {
            await this.handleFailure(event, currentRetry, e.message || 'Unknown error');
            return false;
        }
    }

    /**
     * Handle failure - increment retry, move to DLQ if max reached
     */
    private async handleFailure(event: FiscalPendingEvent, retryCount: number, errorMessage: string) {
        Logger.warn(`[FiscalQueue] Event ${event.fiscal_event_id} failed (attempt ${retryCount}): ${errorMessage}`);

        if (retryCount >= MAX_RETRIES) {
            // Move to Dead Letter Queue
            Logger.error(`[FiscalQueue] Event ${event.fiscal_event_id} reached MAX_RETRIES (${MAX_RETRIES}). Moving to Dead Letter Queue.`);

            const failClient = await getTableClient();
            await failClient
                .from('fiscal_event_store')
                .update({
                    retry_count: retryCount,
                    last_retry_at: new Date().toISOString(),
                    dead_letter: true,
                    dead_letter_reason: `Max retries exceeded. Last error: ${errorMessage}`,
                    fiscal_status: 'FAILED'
                })
                .eq('fiscal_event_id', event.fiscal_event_id);

            // TODO: Send critical alert to owner
            this.sendOwnerAlert(event.restaurant_id, 'CRITICAL', `Invoice moved to Dead Letter Queue after ${MAX_RETRIES} failures`);

        } else {
            const updateClient = await getTableClient();
            await updateClient
                .from('fiscal_event_store')
                .update({
                    retry_count: retryCount,
                    last_retry_at: new Date().toISOString()
                })
                .eq('fiscal_event_id', event.fiscal_event_id);

            // Send warning at threshold
            if (retryCount === ALERT_THRESHOLD) {
                this.sendOwnerAlert(event.restaurant_id, 'WARNING', `Invoice has failed ${ALERT_THRESHOLD} times and will continue retrying`);
            }
        }
    }

    /**
     * Send alert to restaurant owner (placeholder for email/push)
     */
    private async sendOwnerAlert(restaurantId: string, severity: 'WARNING' | 'CRITICAL', message: string) {
        // TODO: Integrate with notification system (email, push, in-app)
        Logger.warn(`[FiscalQueue] OWNER ALERT (${severity}) for ${restaurantId}: ${message}`);

        try {
            const client = await getTableClient();
            await client.from('gm_notifications').insert({
                restaurant_id: restaurantId,
                type: 'FISCAL_ALERT',
                severity,
                message,
                read: false
            });
        } catch {
            // Ignore if table doesn't exist
        }
    }

    /**
     * Get dead letter events for a restaurant
     * Nota: A coluna dead_letter não existe na tabela fiscal_event_store
     * Por enquanto, retorna eventos rejeitados ou com muitas tentativas
     */
    public async getDeadLetterEvents(restaurantId: string) {
        const client = await getTableClient();
        const { data, error } = await client
            .from('fiscal_event_store')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .or('fiscal_status.eq.REJECTED,retry_count.gte.10')
            .order('updated_at', { ascending: false });

        if (error) {
            if (error.message?.includes('retry_count')) {
                const { data: rejectedData, error: rejectedError } = await client
                    .from('fiscal_event_store')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .eq('fiscal_status', 'REJECTED')
                    .order('updated_at', { ascending: false });
                if (rejectedError) throw rejectedError;
                return (Array.isArray(rejectedData) ? rejectedData : []) || [];
            }
            throw error;
        }
        return Array.isArray(data) ? data : [];
    }
}

export const FiscalQueue = new FiscalQueueWorker();

