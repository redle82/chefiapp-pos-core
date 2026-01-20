import { supabase } from '../supabase';
import { getFiscalService } from './FiscalService';
import { Logger } from '../logger';

/**
 * FiscalQueueWorker
 * 
 * Ensures every "PAID" order eventually gets a "Fiscal Signature".
 * Runs periodically to reconcile gm_orders vs fiscal_event_store.
 */
export class FiscalQueueWorker {
    private interval: any;
    private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    private isRunning = false;
    private pendingCount = 0;
    private listeners: ((pendingCount: number) => void)[] = [];

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

    public subscribe(listener: (pendingCount: number) => void) {
        this.listeners.push(listener);
        listener(this.pendingCount);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.pendingCount));
    }

    /**
     * Main Reconciliation Loop
     */
    public async run() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            Logger.debug('[FiscalQueue] Starting reconciliation...');

            // 1. Get recent PAID orders (last 24h)
            // We only care about orders that SHOULD have a signature
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { data: paidOrders, error: ordersError } = await supabase
                .from('gm_orders')
                .select('id, restaurant_id, total_amount, payment_method, updated_at')
                .or('status.eq.paid,payment_status.eq.paid') // Handle both status conventions
                .gte('updated_at', yesterday);

            if (ordersError) throw ordersError;
            if (!paidOrders || paidOrders.length === 0) {
                Logger.debug('[FiscalQueue] No recent paid orders found.');
                this.pendingCount = 0;
                this.notifyListeners();
                return;
            }

            // 2. Get existing fiscal events for these orders
            const orderIds = paidOrders.map(o => o.id);
            const { data: fiscalEvents, error: fiscalError } = await supabase
                .from('fiscal_event_store')
                .select('order_id, fiscal_status')
                .in('order_id', orderIds);

            if (fiscalError) throw fiscalError;

            // 3. Find Missing Signatures
            // Order is missing signature if:
            // - No record in fiscalEvents
            // - OR record exists but status is NOT 'REPORTED' (and not 'REJECTED' which is terminal)
            const signedOrderIds = new Set(
                fiscalEvents
                    ?.filter(e => e.fiscal_status === 'REPORTED' || e.fiscal_status === 'REJECTED')
                    .map(e => e.order_id)
            );

            const missingOrders = paidOrders.filter(o => !signedOrderIds.has(o.id));

            this.pendingCount = missingOrders.length;
            this.notifyListeners();

            if (missingOrders.length === 0) {
                Logger.debug('[FiscalQueue] All orders are compliant. ✅');
                return;
            }

            Logger.warn(`[FiscalQueue] Found ${missingOrders.length} orders missing details. Attempting repairs...`);

            // 4. Attempt Repair (throttled)
            const service = getFiscalService();
            let successCount = 0;

            for (const order of missingOrders) {
                try {
                    Logger.info(`[FiscalQueue] Repairing Order ${order.id}...`);

                    // Call processPaymentConfirmed
                    const result = await service.processPaymentConfirmed({
                        orderId: order.id,
                        restaurantId: order.restaurant_id,
                        paymentMethod: order.payment_method || 'unknown',
                        amountCents: order.total_amount ? Math.round(order.total_amount * 100) : 0,
                    });

                    if (result && result.status === 'REPORTED') {
                        successCount++;
                    }
                } catch (e) {
                    Logger.error(`[FiscalQueue] Failed to repair order ${order.id}`, e);
                }
            }

            Logger.info(`[FiscalQueue] Repairs complete. Success: ${successCount}/${missingOrders.length}`);

            // Update final count
            this.pendingCount = Math.max(0, missingOrders.length - successCount);
            this.notifyListeners();

        } catch (err) {
            Logger.error('[FiscalQueue] Reconciliation failed', err);
        } finally {
            this.isRunning = false;
        }
    }
}

export const FiscalQueue = new FiscalQueueWorker();
