/**
 * Payment Engine - Sistema de Pagamentos Real
 * 
 * Gerencia pagamentos de pedidos com métodos reais e persistência.
 */

import { supabase } from '../supabase';
import { OrderEngine, type PaymentMethod, type PaymentStatus } from './OrderEngine';
import { logAuditEvent } from '../audit/logAuditEvent';

export interface PaymentInput {
    orderId: string;
    restaurantId: string;
    cashRegisterId: string; // [REQUIRED] Sovereign Validation
    amountCents: number;
    method: PaymentMethod;
    metadata?: Record<string, any>;
    idempotencyKey?: string; // Optional external key
}

export interface Payment {
    id: string;
    tenantId: string;
    orderId: string;
    amountCents: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    createdAt: Date;
    metadata?: Record<string, any>;
}

export class PaymentEngine {
    // ... (JSDoc unchanged)
    static async processPayment(input: PaymentInput): Promise<Payment> {
        const startTime = Date.now();

        // Gerar idempotency key para prevenir replay attacks
        const idempotencyKey = input.idempotencyKey || `${input.orderId}-${Date.now()}-${crypto.randomUUID()}`;

        // Usar função SQL transacional (tudo ou nada)
        const { data, error } = await supabase.rpc('process_order_payment', {
            p_order_id: input.orderId,
            p_restaurant_id: input.restaurantId,
            p_cash_register_id: input.cashRegisterId,
            p_method: input.method,
            p_amount_cents: input.amountCents,
            p_operator_id: input.metadata?.operatorId || null,
            p_idempotency_key: idempotencyKey,
        });

        const durationMs = Date.now() - startTime;

        if (error) {
            // LOG FALHA (observabilidade)
            await this.logPaymentAttempt({
                orderId: input.orderId,
                restaurantId: input.restaurantId,
                operatorId: input.metadata?.operatorId,
                amountCents: input.amountCents,
                method: input.method,
                result: 'fail',
                errorCode: error.code || 'UNKNOWN',
                errorMessage: error.message,
                idempotencyKey,
                durationMs,
            });
            throw new Error(`Erro ao processar pagamento: ${error.message || 'Erro desconhecido'}`);
        }

        if (!data || !data.success) {
            // LOG FALHA (observabilidade)
            await this.logPaymentAttempt({
                orderId: input.orderId,
                restaurantId: input.restaurantId,
                operatorId: input.metadata?.operatorId,
                amountCents: input.amountCents,
                method: input.method,
                result: 'fail',
                errorCode: 'TRANSACTION_FAILED',
                errorMessage: 'Payment transaction returned no success',
                idempotencyKey,
                durationMs,
            });
            throw new Error('Transação de pagamento falhou. Verifique os dados e tente novamente.');
        }

        // LOG SUCESSO (observabilidade)
        await this.logPaymentAttempt({
            orderId: input.orderId,
            restaurantId: input.restaurantId,
            operatorId: input.metadata?.operatorId,
            amountCents: input.amountCents,
            method: input.method,
            result: 'success',
            idempotencyKey,
            paymentId: data.payment_id,
            durationMs,
        });

        // Audit log (gm_audit_logs)
        await logAuditEvent({
            action: 'payment_processed',
            resourceEntity: 'gm_payments',
            resourceId: data.payment_id,
            metadata: {
                restaurant_id: input.restaurantId,
                order_id: input.orderId,
                amount_cents: input.amountCents,
                method: input.method,
                idempotency_key: idempotencyKey,
                duration_ms: durationMs,
            },
        });

        // Buscar pagamento criado para retornar objeto completo
        const { data: paymentData, error: fetchError } = await supabase
            .from('gm_payments')
            .select('*')
            .eq('id', data.payment_id)
            .single();

        if (fetchError || !paymentData) {
            throw new Error(`Erro ao buscar pagamento criado: ${fetchError?.message || 'Pagamento não encontrado'}`);
        }

        return {
            id: paymentData.id,
            tenantId: paymentData.tenant_id,
            orderId: paymentData.order_id,
            amountCents: paymentData.amount_cents,
            currency: paymentData.currency,
            method: paymentData.method,
            status: paymentData.status,
            createdAt: new Date(paymentData.created_at),
            metadata: paymentData.metadata,
        };
    }

    /**
     * Buscar pagamentos de um pedido
     */
    static async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
        const { data, error } = await supabase
            .from('gm_payments')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch payments: ${error.message}`);

        return (data || []).map(p => ({
            id: p.id,
            tenantId: p.tenant_id,
            orderId: p.order_id,
            amountCents: p.amount_cents,
            currency: p.currency,
            method: p.method,
            status: p.status,
            createdAt: new Date(p.created_at),
            metadata: p.metadata,
        }));
    }

    /**
     * Buscar pagamentos do dia
     */
    static async getTodayPayments(restaurantId: string): Promise<Payment[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('gm_payments')
            .select('*')
            .eq('tenant_id', restaurantId)
            .eq('status', 'paid')
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch payments: ${error.message}`);

        return (data || []).map(p => ({
            id: p.id,
            tenantId: p.tenant_id,
            orderId: p.order_id,
            amountCents: p.amount_cents,
            currency: p.currency,
            method: p.method,
            status: p.status,
            createdAt: new Date(p.created_at),
            metadata: p.metadata,
        }));
    }

    /**
     * OBSERVABILIDADE: Logar tentativa de pagamento (sucesso ou falha)
     * 
     * Esta função é chamada em TODA tentativa de pagamento.
     * O log é append-only e imutável para auditoria.
     */
    private static async logPaymentAttempt(input: {
        orderId: string;
        restaurantId: string;
        operatorId?: string;
        amountCents: number;
        method: PaymentMethod;
        result: 'success' | 'fail' | 'timeout' | 'cancelled';
        errorCode?: string;
        errorMessage?: string;
        idempotencyKey?: string;
        paymentId?: string;
        durationMs?: number;
    }): Promise<void> {
        try {
            await supabase.rpc('fn_log_payment_attempt', {
                p_order_id: input.orderId,
                p_restaurant_id: input.restaurantId,
                p_operator_id: input.operatorId || null,
                p_amount_cents: input.amountCents,
                p_method: input.method,
                p_result: input.result,
                p_error_code: input.errorCode || null,
                p_error_message: input.errorMessage || null,
                p_idempotency_key: input.idempotencyKey || null,
                p_payment_id: input.paymentId || null,
                p_duration_ms: input.durationMs || null,
                p_client_info: JSON.stringify({
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
                    timestamp: new Date().toISOString(),
                }),
            });
        } catch (err) {
            // Log silencioso - não deve falhar o pagamento se o log falhar
            console.error('[PaymentEngine] Failed to log payment attempt:', err);
        }
    }

    /**
     * MÉTRICAS: Obter saúde do sistema de pagamentos
     */
    static async getPaymentHealth(restaurantId: string): Promise<{
        attempts24h: number;
        success24h: number;
        fail24h: number;
        successRate: number;
        avgDurationMs: number;
        totalProcessedCents: number;
        mostCommonError: string | null;
    }> {
        const { data, error } = await supabase.rpc('get_payment_health', {
            p_restaurant_id: restaurantId,
        });

        if (error) {
            console.error('[PaymentEngine] Failed to get payment health:', error);
            return {
                attempts24h: 0,
                success24h: 0,
                fail24h: 0,
                successRate: 100,
                avgDurationMs: 0,
                totalProcessedCents: 0,
                mostCommonError: null,
            };
        }

        return {
            attempts24h: data?.attempts_24h || 0,
            success24h: data?.success_24h || 0,
            fail24h: data?.fail_24h || 0,
            successRate: data?.success_rate || 100,
            avgDurationMs: data?.avg_duration_ms || 0,
            totalProcessedCents: data?.total_processed_cents || 0,
            mostCommonError: data?.most_common_error || null,
        };
    }
}

