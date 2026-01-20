import { supabase } from '../supabase';
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
            const { data: event, error } = await supabase
                .from('fiscal_event_store')
                .select('*')
                .eq('fiscal_event_id', fiscalEventId)
                .single();

            if (error || !event) {
                Logger.error(`[FiscalQueue] Event ${fiscalEventId} not found`);
                return false;
            }

            // Reset retry count for manual retry
            await supabase
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

            // 1. Get pending fiscal events (not in DLQ)
            const { data: pendingEvents, error: pendingError } = await supabase
                .from('fiscal_event_store')
                .select('fiscal_event_id, order_id, restaurant_id, retry_count, fiscal_status')
                .eq('fiscal_status', 'PENDING')
                .or('dead_letter.is.null,dead_letter.eq.false')
                .order('created_at', { ascending: true })
                .limit(50); // Process in batches

            if (pendingError) throw pendingError;

            // 2. Get dead letter count
            const { count: dlCount } = await supabase
                .from('fiscal_event_store')
                .select('*', { count: 'exact', head: true })
                .eq('dead_letter', true);

            this.deadLetterCount = dlCount || 0;
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

            await supabase
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
            // Update retry count
            await supabase
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

        // For now, log to a notifications table if it exists
        try {
            await supabase.from('gm_notifications').insert({
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
     */
    public async getDeadLetterEvents(restaurantId: string) {
        const { data, error } = await supabase
            .from('fiscal_event_store')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('dead_letter', true)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
}

export const FiscalQueue = new FiscalQueueWorker();

