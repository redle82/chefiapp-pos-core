/**
 * WEB ORDERING SERVICE
 * 
 * Handles public web orders with smart routing:
 * - If restaurant has auto_accept_web_orders = true → Direct to gm_orders
 * - Otherwise → Airlock queue (gm_order_requests) for manual approval
 * 
 * Security layers:
 * - Idempotency: Prevents duplicate orders from double-clicks or network retries
 * - Rate limiting: Prevents spam/flood attacks
 * 
 * Reliability layers:
 * - Retry with exponential backoff: 3 attempts (1s → 2s → 4s)
 * - Progress callbacks: UI feedback during submission
 * - Uncertainty state: Clear messaging when outcome is unknown
 * 
 * @constitutional This service is the bridge between public web and sovereign order system.
 */

import { supabase } from '../supabase';
import {
    checkOrderProtection,
    recordOrderSubmission,
    recordOrderSubmission,
    type OrderProtectionResult
} from './OrderProtection';
import { DbWriteGate } from '../governance/DbWriteGate';

// ─────────────────────────────────────────────────────────────────────────────
// RETRY CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const RETRY_CONFIG = {
    MAX_ATTEMPTS: 3,
    BASE_DELAY_MS: 1000,      // 1s → 2s → 4s (exponential)
    TIMEOUT_MS: 15000,        // 15s per attempt
    TOTAL_TIMEOUT_MS: 30000,  // 30s max total
};

export interface SubmissionProgress {
    attempt: number;
    maxAttempts: number;
    phase: 'SENDING' | 'WAITING' | 'RETRYING' | 'SUCCESS' | 'FAILED' | 'UNCERTAIN';
    message: string;
}

export interface WebOrderItem {
    product_id: string;
    name: string;
    quantity: number;
    price_cents: number;
    notes?: string;
}

export interface WebOrderInput {
    restaurant_id: string;
    items: WebOrderItem[];
    customer_name?: string;
    customer_phone?: string;
    table_number?: number;
    notes?: string;
}

export interface WebOrderResult {
    success: boolean;
    order_id?: string;
    request_id?: string;
    status: 'ACCEPTED' | 'PENDING_APPROVAL' | 'REJECTED' | 'BLOCKED' | 'UNCERTAIN';
    message: string;
    /** If blocked by protection, includes reason */
    blockReason?: 'DUPLICATE' | 'RATE_LIMITED';
    /** Seconds to wait before retry (rate limit) */
    retryAfterSeconds?: number;
    /** If uncertain, suggests next action */
    nextAction?: 'WAIT_AND_CHECK' | 'CONTACT_RESTAURANT';
}

export interface RestaurantWebConfig {
    restaurant_id: string;
    tenant_id: string;
    name: string;
    slug: string;
    web_ordering_enabled: boolean;
    auto_accept_web_orders: boolean;
}

/**
 * WebOrderingService - Public Order Gateway
 */
export const WebOrderingService = {
    /**
     * Get restaurant web configuration
     */
    async getWebConfig(slug: string): Promise<RestaurantWebConfig | null> {
        const { data, error } = await supabase
            .from('gm_restaurants')
            .select('id, name, slug, web_ordering_enabled, auto_accept_web_orders')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            console.error('[WebOrderingService] Config fetch failed:', error);
            return null;
        }

        return {
            restaurant_id: data.id,
            tenant_id: data.id, // ID is the tenant_id in Sovereign Architecture
            name: data.name,
            slug: data.slug,
            web_ordering_enabled: data.web_ordering_enabled ?? true,
            auto_accept_web_orders: data.auto_accept_web_orders ?? false
        };
    },

    /**
     * Submit order with automatic retry and progress callbacks
     * 
     * This is the PRIMARY method for submitting orders.
     * Includes exponential backoff retry (1s → 2s → 4s).
     * 
     * @param input Order data
     * @param onProgress Optional callback for UI progress updates
     */
    async submitOrderWithRetry(
        input: WebOrderInput,
        onProgress?: (progress: SubmissionProgress) => void
    ): Promise<WebOrderResult> {
        const notify = (progress: SubmissionProgress) => {
            console.log(`[WebOrderingService] ${progress.phase}: ${progress.message}`);
            onProgress?.(progress);
        };

        // 🛡️ PROTECTION CHECK FIRST (no retry needed for these)
        const protection = checkOrderProtection(
            input.restaurant_id,
            input.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
            input.table_number
        );

        if (!protection.allowed) {
            console.warn('[WebOrderingService] Order blocked:', protection.reason);

            if (protection.reason === 'DUPLICATE') {
                notify({
                    attempt: 1,
                    maxAttempts: 1,
                    phase: 'FAILED',
                    message: 'Este pedido já foi enviado'
                });
                return {
                    success: false,
                    status: 'BLOCKED',
                    message: 'Este pedido já foi enviado. Verifique o status abaixo.',
                    blockReason: 'DUPLICATE',
                    order_id: protection.existingOrderId,
                    request_id: protection.existingRequestId
                };
            }

            notify({
                attempt: 1,
                maxAttempts: 1,
                phase: 'FAILED',
                message: `Aguarde ${protection.retryAfterSeconds}s para tentar novamente`
            });
            return {
                success: false,
                status: 'BLOCKED',
                message: 'Muitos pedidos. Aguarde um momento.',
                blockReason: 'RATE_LIMITED',
                retryAfterSeconds: protection.retryAfterSeconds
            };
        }

        // RETRY LOOP
        let lastError: Error | null = null;
        const startTime = Date.now();

        for (let attempt = 1; attempt <= RETRY_CONFIG.MAX_ATTEMPTS; attempt++) {
            // Check total timeout
            if (Date.now() - startTime > RETRY_CONFIG.TOTAL_TIMEOUT_MS) {
                break;
            }

            // Progress: Starting attempt
            notify({
                attempt,
                maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
                phase: attempt === 1 ? 'SENDING' : 'RETRYING',
                message: attempt === 1
                    ? 'Enviando seu pedido...'
                    : `Reconectando... (tentativa ${attempt}/${RETRY_CONFIG.MAX_ATTEMPTS})`
            });

            try {
                // Actual submission with timeout
                const result = await Promise.race([
                    this._submitOrderInternal(input),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('TIMEOUT')), RETRY_CONFIG.TIMEOUT_MS)
                    )
                ]);

                // SUCCESS!
                notify({
                    attempt,
                    maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
                    phase: 'SUCCESS',
                    message: result.status === 'ACCEPTED'
                        ? 'Pedido confirmado!'
                        : 'Pedido enviado! Aguardando confirmação.'
                });

                return result;

            } catch (err: any) {
                lastError = err;
                console.warn(`[WebOrderingService] Attempt ${attempt} failed:`, err.message);

                // If not last attempt, wait before retry
                if (attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
                    const delay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt - 1);
                    notify({
                        attempt,
                        maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
                        phase: 'WAITING',
                        message: `Problemas de conexão. Tentando novamente em ${delay / 1000}s...`
                    });
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }

        // ALL ATTEMPTS FAILED - UNCERTAIN STATE
        // The order MIGHT have been received (network could have failed after server processed)
        notify({
            attempt: RETRY_CONFIG.MAX_ATTEMPTS,
            maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
            phase: 'UNCERTAIN',
            message: 'Não foi possível confirmar. Seu pedido pode ter sido recebido.'
        });

        // Record as potential submission (for idempotency - prevents spam retry)
        recordOrderSubmission(
            input.restaurant_id,
            input.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
            input.table_number,
            undefined,
            undefined
        );

        return {
            success: false,
            status: 'UNCERTAIN',
            message: 'Não foi possível confirmar o pedido. Ele pode ter sido recebido pelo restaurante.',
            nextAction: 'WAIT_AND_CHECK'
        };
    },

    /**
     * Internal submission (no retry) - called by submitOrderWithRetry
     */
    async _submitOrderInternal(input: WebOrderInput): Promise<WebOrderResult> {
        console.log('[WebOrderingService] _submitOrderInternal:', input.restaurant_id);

        // 1. Fetch restaurant config
        const { data: restaurant, error: configError } = await supabase
            .from('gm_restaurants')
            .select('id, auto_accept_web_orders, web_ordering_enabled')
            .eq('id', input.restaurant_id)
            .single();

        if (configError || !restaurant) {
            console.error('[WebOrderingService] Restaurant not found:', configError);
            return {
                success: false,
                status: 'REJECTED',
                message: 'Restaurante não encontrado'
            };
        }

        // 2. Check if web ordering is enabled
        if (!restaurant.web_ordering_enabled) {
            return {
                success: false,
                status: 'REJECTED',
                message: 'Pedidos online desativados temporariamente'
            };
        }

        // 3. Calculate totals
        const total_cents = input.items.reduce(
            (sum, item) => sum + (item.price_cents * item.quantity),
            0
        );

        // 4. Route based on auto_accept setting
        if (restaurant.auto_accept_web_orders) {
            return this.createDirectOrder(input, restaurant.id, total_cents); // Use ID as tenant_id
        } else {
            return this.createAirlockRequest(input, restaurant.id, total_cents); // Use ID as tenant_id
        }
    },

    /**
     * DEPRECATED: Use submitOrderWithRetry for better UX
     * Kept for backward compatibility
     */
    async submitOrder(input: WebOrderInput): Promise<WebOrderResult> {
        return this.submitOrderWithRetry(input);
    },

    /**
     * Create order directly in gm_orders (auto-accept path)
     */
    async createDirectOrder(
        input: WebOrderInput,
        tenant_id: string,
        total_cents: number
    ): Promise<WebOrderResult> {
        const orderId = crypto.randomUUID();

        try {
            // A. Create order header
            const { error: orderError } = await DbWriteGate.insert(
                'WebOrderingService',
                'gm_orders',
                {
                    id: orderId,
                    restaurant_id: input.restaurant_id,
                    status: 'new',
                    total_cents,
                    subtotal_cents: total_cents,
                    tax_cents: 0,
                    discount_cents: 0,
                    origin: 'WEB_PUBLIC',
                    customer_name: input.customer_name || 'Cliente Web',
                    table_number: input.table_number,
                    notes: input.notes
                },
                { tenantId: tenant_id }
            );

            if (orderError) throw orderError;

            // B. Create order items
            const orderItems = input.items.map(item => ({
                id: crypto.randomUUID(),
                order_id: orderId,
                product_id: item.product_id,
                name_snapshot: item.name,
                price_snapshot: item.price_cents,
                quantity: item.quantity,
                subtotal_cents: item.price_cents * item.quantity,
                notes: item.notes
            }));

            const { error: itemsError } = await DbWriteGate.insert(
                'WebOrderingService',
                'gm_order_items',
                orderItems,
                { tenantId: tenant_id }
            );

            if (itemsError) {
                // Rollback order if items fail
                const rollQ = await DbWriteGate.delete('WebOrderingService', 'gm_orders', { id: orderId }, { tenantId: tenant_id });
                await rollQ;
                throw itemsError;
            }

            console.log('[WebOrderingService] Direct order created:', orderId);

            // 🛡️ Record successful submission for protection
            recordOrderSubmission(
                input.restaurant_id,
                input.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
                input.table_number,
                orderId,
                undefined
            );

            return {
                success: true,
                order_id: orderId,
                status: 'ACCEPTED',
                message: 'Pedido recebido! Preparando...'
            };

        } catch (err: any) {
            console.error('[WebOrderingService] Direct order failed:', err);
            return {
                success: false,
                status: 'REJECTED',
                message: 'Erro ao criar pedido. Tente novamente.'
            };
        }
    },

    /**
     * Create request in airlock queue (manual approval path)
     */
    async createAirlockRequest(
        input: WebOrderInput,
        tenant_id: string,
        total_cents: number
    ): Promise<WebOrderResult> {
        try {
            const requestPayload = {
                tenant_id,
                restaurant_id: input.restaurant_id,
                items: input.items.map(item => ({
                    product_id: item.product_id,
                    name: item.name,
                    quantity: item.quantity,
                    price_cents: item.price_cents,
                    notes: item.notes
                })),
                total_cents,
                status: 'PENDING',
                request_source: 'WEB_PUBLIC',
                customer_contact: {
                    name: input.customer_name || 'Cliente Web',
                    phone: input.customer_phone,
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
                },
                table_number: input.table_number
                // notes field not in gm_order_requests schema - stored in customer_contact if needed
            };

            const { data: request, error } = await DbWriteGate.insert(
                'WebOrderingService',
                'gm_order_requests',
                requestPayload,
                { tenantId: tenant_id }
            );

            if (error) throw error;

            console.log('[WebOrderingService] Airlock request created:', request.id);

            // 🛡️ Record successful submission for protection
            recordOrderSubmission(
                input.restaurant_id,
                input.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
                input.table_number,
                undefined,
                request.id
            );

            return {
                success: true,
                request_id: request.id,
                status: 'PENDING_APPROVAL',
                message: 'Pedido enviado! Aguardando confirmação do restaurante.'
            };

        } catch (err: any) {
            console.error('[WebOrderingService] Airlock request failed:', err);
            return {
                success: false,
                status: 'REJECTED',
                message: 'Erro ao enviar pedido. Tente novamente.'
            };
        }
    },

    /**
     * Check order/request status (for polling)
     */
    async checkStatus(orderId?: string, requestId?: string): Promise<{
        status: string;
        message: string;
    }> {
        if (orderId) {
            const { data } = await supabase
                .from('gm_orders')
                .select('status')
                .eq('id', orderId)
                .single();

            if (data) {
                const statusMap: Record<string, string> = {
                    'new': 'Pedido recebido',
                    'OPEN': 'Preparando',
                    'IN_PREP': 'Em preparo na cozinha',
                    'READY': 'Pronto para retirada!',
                    'PAID': 'Finalizado',
                    'CANCELLED': 'Cancelado'
                };
                return {
                    status: data.status,
                    message: statusMap[data.status] || data.status
                };
            }
        }

        if (requestId) {
            const { data } = await supabase
                .from('gm_order_requests')
                .select('status, sovereign_order_id')
                .eq('id', requestId)
                .single();

            if (data) {
                if (data.status === 'ACCEPTED' && data.sovereign_order_id) {
                    return this.checkStatus(data.sovereign_order_id);
                }
                const statusMap: Record<string, string> = {
                    'PENDING': 'Aguardando confirmação...',
                    'ACCEPTED': 'Pedido confirmado!',
                    'REJECTED': 'Pedido não aceito'
                };
                return {
                    status: data.status,
                    message: statusMap[data.status] || data.status
                };
            }
        }

        return { status: 'UNKNOWN', message: 'Status não disponível' };
    }
};
