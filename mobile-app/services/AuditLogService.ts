/**
 * AuditLogService - Sistema de logs de auditoria
 * 
 * Bug #13 Fix: Registra ações críticas para rastreabilidade
 * 
 * Ações registradas:
 * - void (cancelar item)
 * - desconto (aplicar desconto)
 * - fechar caixa
 * - pagar pedido
 */

import { supabase } from './supabase';

export type AuditAction = 
    | 'void_item'
    | 'apply_discount'
    | 'close_cash_drawer'
    | 'pay_order'
    | 'open_cash_drawer'
    | 'cash_movement';

export interface AuditLogEntry {
    action: AuditAction;
    userId: string;
    businessId: string;
    shiftId?: string;
    orderId?: string;
    amount?: number; // em centavos
    reason?: string;
    metadata?: Record<string, any>;
}

/**
 * Registra uma ação crítica no sistema de auditoria
 */
export class AuditLogService {
    /**
     * Loga uma ação crítica
     */
    static async log(entry: AuditLogEntry): Promise<void> {
        try {
            // Tentar inserir na tabela de audit logs (se existir)
            const { error } = await supabase
                .from('gm_audit_logs')
                .insert({
                    action: entry.action,
                    user_id: entry.userId,
                    restaurant_id: entry.businessId,
                    shift_id: entry.shiftId || null,
                    order_id: entry.orderId || null,
                    amount_cents: entry.amount || null,
                    reason: entry.reason || null,
                    metadata: entry.metadata || {},
                    created_at: new Date().toISOString()
                });

            // Se a tabela não existir, apenas logar no console (não quebrar o fluxo)
            if (error) {
                // Se for erro de tabela não encontrada, apenas logar
                if (error.message.includes('does not exist') || error.code === '42P01') {
                    console.warn('[AuditLog] Table gm_audit_logs does not exist. Logging to console:', entry);
                    return;
                }
                // Outros erros são críticos e devem ser logados
                console.error('[AuditLog] Error logging action:', error, entry);
            } else {
                console.log('[AuditLog] Action logged:', entry.action, entry.userId);
            }
        } catch (e) {
            // Falha silenciosa - não quebrar o fluxo operacional
            console.error('[AuditLog] Failed to log action:', e, entry);
        }
    }

    /**
     * Loga cancelamento de item (void)
     */
    static async logVoidItem(
        userId: string,
        businessId: string,
        orderId: string,
        itemId: string,
        reason: string,
        shiftId?: string
    ): Promise<void> {
        await this.log({
            action: 'void_item',
            userId,
            businessId,
            shiftId,
            orderId,
            reason,
            metadata: { itemId }
        });
    }

    /**
     * Loga aplicação de desconto
     */
    static async logDiscount(
        userId: string,
        businessId: string,
        orderId: string,
        amount: number,
        reason: string,
        shiftId?: string
    ): Promise<void> {
        await this.log({
            action: 'apply_discount',
            userId,
            businessId,
            shiftId,
            orderId,
            amount,
            reason
        });
    }

    /**
     * Loga fechamento de caixa
     */
    static async logCloseCashDrawer(
        userId: string,
        businessId: string,
        actualCash: number,
        expectedCash: number,
        difference: number,
        shiftId?: string
    ): Promise<void> {
        await this.log({
            action: 'close_cash_drawer',
            userId,
            businessId,
            shiftId,
            amount: actualCash,
            metadata: {
                expectedCash,
                difference
            }
        });
    }

    /**
     * Loga abertura de caixa
     */
    static async logOpenCashDrawer(
        userId: string,
        businessId: string,
        openingFloat: number,
        shiftId?: string
    ): Promise<void> {
        await this.log({
            action: 'open_cash_drawer',
            userId,
            businessId,
            shiftId,
            amount: openingFloat
        });
    }

    /**
     * Loga pagamento de pedido
     */
    static async logPayOrder(
        userId: string,
        businessId: string,
        orderId: string,
        amount: number,
        method: string,
        shiftId?: string
    ): Promise<void> {
        await this.log({
            action: 'pay_order',
            userId,
            businessId,
            shiftId,
            orderId,
            amount,
            metadata: { paymentMethod: method }
        });
    }

    /**
     * Loga movimento de caixa (suprimento/sangria)
     */
    static async logCashMovement(
        userId: string,
        businessId: string,
        type: 'supply' | 'bleed',
        amount: number,
        reason: string,
        shiftId?: string
    ): Promise<void> {
        await this.log({
            action: 'cash_movement',
            userId,
            businessId,
            shiftId,
            amount,
            reason,
            metadata: { movementType: type }
        });
    }
}
