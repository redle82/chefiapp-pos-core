/**
 * Cash Register - Sistema de Caixa Real
 * 
 * [CLASSIFICATION: INFRASTRUCTURE ADAPTER]
 * [AUTHORITY: HYBRID] (See DOMAIN_WRITE_AUTHORITY_CONTRACT.md)
 * 
 * Gerencia abertura e fechamento de caixa com totais reais.
 * 
 * [ARCHITECTURE NOTE]
 * This engine operates in HYBRID MODE (Law 2 Exception):
 * 1. Direct Write (Projection): Writes to Supabase `gm_cash_registers` (Legacy)
 * 2. Kernel Event (Truth): Routes `OPEN/CLOSE` events through `TenantKernel` (Sovereign)
 * 
 * WARNING: Does not enforce "truth" if Kernel is missing.
 */

import { supabase } from '../supabase';
import { PaymentEngine } from './PaymentEngine';
import { Logger } from '../logger';
import { logAuditEvent } from '../audit/logAuditEvent';
import { DbWriteGate } from '../governance/DbWriteGate';

// TODO: Import from Kernel context when wired
// import type { TenantKernel } from '../../../../core-engine/kernel/TenantKernel';

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
    kernel?: any; // TenantKernel - typed as any for now until wiring is complete
}

export interface CloseCashRegisterInput {
    cashRegisterId: string;
    restaurantId: string;
    closingBalanceCents: number;
    closedBy: string;
    kernel?: any; // TenantKernel
}

export class CashRegisterEngine {
    /**
     * Abrir caixa
     */
    static async openCashRegister(input: OpenCashRegisterInput): Promise<CashRegister> {
        // [ATOMIC] Use RPC to prevent race conditions (double open)
        const { data: result, error } = await supabase.rpc('open_cash_register_atomic', {
            p_restaurant_id: input.restaurantId,
            p_name: input.name || 'Caixa Principal',
            p_opened_by: input.openedBy,
            p_opening_balance_cents: input.openingBalanceCents
        });

        if (error) {
            Logger.error('CASH_REGISTER_OPEN_FAILED', error, { input });
            if (error.message.includes('CASH_REGISTER_ALREADY_OPEN')) {
                throw new CashRegisterError(
                    'Já existe um caixa aberto. Feche o caixa atual antes de abrir outro.',
                    'CASH_REGISTER_ALREADY_OPEN'
                );
            }
            throw new CashRegisterError(
                `Erro ao abrir caixa: ${error.message || 'Erro desconhecido'}`,
                'CASH_REGISTER_OPEN_FAILED'
            );
        }
        // Validation
        if (!input.restaurantId) throw new Error('Restaurant ID required');
        if (!input.openedBy) throw new Error('Opened By required');

        // SOVEREIGNTY: Enforce Kernel Usage (Phase 16)
        if (!input.kernel) {
            throw new Error('Sovereign Kernel required for Cash Register operations (Phase 16)');
        }

        const tempId = uuidv4(); // Generate Sovereignty ID (or use projection return)

        // Execute via Kernel
        // This triggers 'persistOpenCashRegister' Effect -> database write.
        await input.kernel.execute({
            entity: 'cash_register', // Must match state machine ID
            entityId: tempId, // Since we don't have ID yet, we might need to handle this.
            // Wait, for OPEN, usually we don't have an ID yet.
            // But the wrapper expects cash_register entity.
            // The RPC returns the ID.
            // If we generate UUID here, we must ensure RPC accepts it or we rely on RPC ID.
            // Our Projection calls `open_cash_register_atomic` which generates an ID or takes one?
            // Checking Projection: It does NOT pass ID to RPC. RPC generates it.
            // Checking Projection again:
            // "const { data: result } = await supabase.rpc(...)"
            // "Logger.info('Opened', { id: result.id })"
            // So RPC generates ID.
            // PROBLEM: We need the ID back here to return it.
            // Kernel.execute usually returns void.
            // However, after execution, we can query "getActive".
            // Since execution is awaited, the DB write is done.
            event: 'OPEN',
            restaurantId: input.restaurantId,
            opened_by: input.openedBy,
            opening_balance_cents: input.openingBalanceCents,
            name: 'Caixa Principal' // Default
        });

        // After Kernel Execution (and synchronous Effect), the DB is updated.
        // We fetch the open register.
        const openRegister = await this.getOpenCashRegister(input.restaurantId);
        if (!openRegister) {
            throw new Error('Failed to open cash register (Sovereignty Verification)');
        }

        return openRegister;
    }

    // Close a cash register (Sovereign)
    static async closeCashRegister(input: CloseCashRegisterInput): Promise<CashRegister> {
        // SOVEREIGNTY: Enforce Kernel Usage (Phase 16)
        if (!input.kernel) {
            throw new Error('Sovereign Kernel required for Cash Register operations (Phase 16)');
        }

        // Execute via Kernel
        await input.kernel.execute({
            entity: 'cash_register',
            entityId: input.cashRegisterId,
            event: 'CLOSE',
            restaurantId: input.restaurantId,
            closed_by: input.closedBy,
            closing_balance_cents: input.closingBalanceCents
        });

        // Return updated state
        // Note: getCashRegisterById requires restaurantId in signature?
        // Checking getCashRegisterById below... it takes (id, restaurantId).
        // Let's check signature.
        return this.getCashRegisterById(input.cashRegisterId, input.restaurantId);
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

    // [DEPRECATED] emitCashRegisterEvent removed - now using Kernel.execute()
}
