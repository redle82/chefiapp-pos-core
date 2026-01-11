/**
 * Cash Register - Sistema de Caixa Real
 * 
 * Gerencia abertura e fechamento de caixa com totais reais.
 */

import { supabase } from '../supabase';
import { PaymentEngine } from './PaymentEngine';
import { Logger } from '../logger/Logger';

export class CashRegisterError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'CashRegisterError';
    }
}

export interface CashRegister {
    id: string;
    restaurantId: string;
    name: string;
    status: 'open' | 'closed';
    openedAt?: Date;
    closedAt?: Date;
    openedBy?: string;
    closedBy?: string;
    openingBalanceCents: number;
    closingBalanceCents?: number;
    totalSalesCents: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface OpenCashRegisterInput {
    restaurantId: string;
    name?: string;
    openingBalanceCents: number;
    openedBy: string;
}

export interface CloseCashRegisterInput {
    cashRegisterId: string;
    restaurantId: string;
    closingBalanceCents: number;
    closedBy: string;
}

export class CashRegisterEngine {
    /**
     * Abrir caixa
     */
    static async openCashRegister(input: OpenCashRegisterInput): Promise<CashRegister> {
        // Verificar se já existe caixa aberto
        const { data: existing } = await supabase
            .from('gm_cash_registers')
            .select('*')
            .eq('restaurant_id', input.restaurantId)
            .eq('status', 'open')
            .maybeSingle();

        if (existing) {
            throw new CashRegisterError(
                'Já existe um caixa aberto. Feche o caixa atual antes de abrir outro.',
                'CASH_REGISTER_ALREADY_OPEN'
            );
        }

        // Criar caixa
        const { data: registerData, error } = await supabase
            .from('gm_cash_registers')
            .insert({
                restaurant_id: input.restaurantId,
                name: input.name || 'Caixa Principal',
                status: 'open',
                opened_at: new Date().toISOString(),
                opened_by: input.openedBy,
                opening_balance_cents: input.openingBalanceCents,
                total_sales_cents: 0,
            })
            .select()
            .single();

        if (error) {
            Logger.error('CASH_REGISTER_OPEN_FAILED', error, { input });
            throw new CashRegisterError(
                `Erro ao abrir caixa: ${error.message || 'Erro desconhecido'}`,
                'CASH_REGISTER_OPEN_FAILED'
            );
        }

        Logger.info('CashRegister: Opened', { registerId: registerData.id, restaurantId: input.restaurantId, openingBalanceCents: input.openingBalanceCents });

        // Audit log
        await logAuditEvent({
            action: 'cash_register_opened',
            resourceEntity: 'gm_cash_registers',
            resourceId: registerData.id,
            metadata: {
                restaurant_id: input.restaurantId,
                opening_balance_cents: input.openingBalanceCents,
            },
        });

        return this.mapDbRegisterToRegister(registerData);
    }

    /**
     * Fechar caixa
     * 
     * VALIDAÇÃO CRÍTICA: Não pode fechar caixa com orders abertos
     */
    static async closeCashRegister(input: CloseCashRegisterInput): Promise<CashRegister> {
        // Buscar caixa
        const register = await this.getCashRegisterById(input.cashRegisterId, input.restaurantId);

        if (register.status !== 'open') {
            throw new CashRegisterError(
                'Caixa não está aberto. Abra o caixa antes de fechá-lo.',
                'CASH_REGISTER_NOT_OPEN'
            );
        }

        // VALIDAÇÃO CRÍTICA: Verificar orders abertos antes de fechar
        const { data: openOrders, error: ordersError } = await supabase
            .from('gm_orders')
            .select('id, table_number')
            .eq('restaurant_id', input.restaurantId)
            .in('status', ['pending', 'preparing', 'ready'])
            .neq('payment_status', 'PAID');

        if (ordersError) {
            Logger.error('CASH_REGISTER_CLOSE_CHECK_FAILED', ordersError, { cashRegisterId: input.cashRegisterId });
            throw new CashRegisterError(
                `Erro ao verificar pedidos abertos: ${ordersError.message || 'Erro desconhecido'}`,
                'CASH_REGISTER_CLOSE_CHECK_FAILED'
            );
        }

        if (openOrders && openOrders.length > 0) {
            throw new CashRegisterError(
                `Não é possível fechar o caixa com ${openOrders.length} pedido(s) aberto(s). Feche ou cancele os pedidos primeiro.`,
                'CASH_REGISTER_HAS_OPEN_ORDERS'
            );
        }

        // Calcular total de vendas do dia
        const todayPayments = await PaymentEngine.getTodayPayments(input.restaurantId);
        const totalSalesCents = todayPayments.reduce(
            (sum, payment) => sum + payment.amountCents,
            0
        );

        // Fechar caixa
        const { data: registerData, error } = await supabase
            .from('gm_cash_registers')
            .update({
                status: 'closed',
                closed_at: new Date().toISOString(),
                closed_by: input.closedBy,
                closing_balance_cents: input.closingBalanceCents,
                total_sales_cents: totalSalesCents,
            })
            .eq('id', input.cashRegisterId)
            .eq('restaurant_id', input.restaurantId)
            .select()
            .single();

        if (error) {
            Logger.error('CASH_REGISTER_CLOSE_FAILED', error, { input });
            throw new CashRegisterError(
                `Erro ao fechar caixa: ${error.message || 'Erro desconhecido'}`,
                'CASH_REGISTER_CLOSE_FAILED'
            );
        }

        Logger.info('CashRegister: Closed', { registerId: registerData.id, restaurantId: input.restaurantId, closingBalanceCents: input.closingBalanceCents });

        // Audit log
        await logAuditEvent({
            action: 'cash_register_closed',
            resourceEntity: 'gm_cash_registers',
            resourceId: registerData.id,
            metadata: {
                restaurant_id: input.restaurantId,
                closing_balance_cents: input.closingBalanceCents,
            },
        });

        return this.mapDbRegisterToRegister(registerData);
    }

    /**
     * Buscar caixa por ID
     */
    static async getCashRegisterById(
        cashRegisterId: string,
        restaurantId: string
    ): Promise<CashRegister> {
        const { data, error } = await supabase
            .from('gm_cash_registers')
            .select('*')
            .eq('id', cashRegisterId)
            .eq('restaurant_id', restaurantId)
            .single();

        if (error) {
            Logger.error('CASH_REGISTER_FETCH_FAILED', error, { cashRegisterId, restaurantId });
            throw new CashRegisterError(
                `Erro ao buscar caixa: ${error.message || 'Erro desconhecido'}`,
                'CASH_REGISTER_FETCH_FAILED'
            );
        }
        if (!data) {
            throw new CashRegisterError(
                'Caixa não encontrado. Verifique se o ID está correto.',
                'CASH_REGISTER_NOT_FOUND'
            );
        }

        return this.mapDbRegisterToRegister(data);
    }

    /**
     * Buscar caixa aberto do restaurante
     */
    static async getOpenCashRegister(restaurantId: string): Promise<CashRegister | null> {
        const { data, error } = await supabase
            .from('gm_cash_registers')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('status', 'open')
            .maybeSingle();

        if (error) {
            Logger.error('CASH_REGISTER_FETCH_OPEN_FAILED', error, { restaurantId });
            throw new CashRegisterError(
                `Erro ao buscar caixa aberto: ${error.message || 'Erro desconhecido'}`,
                'CASH_REGISTER_FETCH_OPEN_FAILED'
            );
        }

        return data ? this.mapDbRegisterToRegister(data) : null;
    }

    /**
     * Buscar caixas do restaurante
     */
    static async getCashRegisters(restaurantId: string): Promise<CashRegister[]> {
        const { data, error } = await supabase
            .from('gm_cash_registers')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

        if (error) {
            Logger.error('CASH_REGISTERS_FETCH_FAILED', error, { restaurantId });
            throw new CashRegisterError(
                `Erro ao buscar caixas: ${error.message || 'Erro desconhecido'}`,
                'CASH_REGISTERS_FETCH_FAILED'
            );
        }

        return (data || []).map(this.mapDbRegisterToRegister);
    }

    /**
     * Mapear dados do banco para CashRegister
     */
    private static mapDbRegisterToRegister(dbRegister: {
        id: string;
        restaurant_id: string;
        name: string;
        status: string;
        opened_at?: string;
        closed_at?: string;
        opened_by?: string;
        closed_by?: string;
        opening_balance_cents: number;
        closing_balance_cents?: number;
        total_sales_cents: number;
        created_at: string;
        updated_at: string;
    }): CashRegister {
        return {
            id: dbRegister.id,
            restaurantId: dbRegister.restaurant_id,
            name: dbRegister.name,
            status: dbRegister.status as 'open' | 'closed',
            openedAt: dbRegister.opened_at ? new Date(dbRegister.opened_at) : undefined,
            closedAt: dbRegister.closed_at ? new Date(dbRegister.closed_at) : undefined,
            openedBy: dbRegister.opened_by,
            closedBy: dbRegister.closed_by,
            openingBalanceCents: dbRegister.opening_balance_cents,
            closingBalanceCents: dbRegister.closing_balance_cents,
            totalSalesCents: dbRegister.total_sales_cents,
            createdAt: new Date(dbRegister.created_at),
            updatedAt: new Date(dbRegister.updated_at),
        };
    }
}

