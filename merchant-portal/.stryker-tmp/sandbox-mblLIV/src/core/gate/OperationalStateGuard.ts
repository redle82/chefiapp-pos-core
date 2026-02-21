/**
 * Operational State Guard
 * 
 * 🛡️ P0.2 REFINEMENT: Centralized operational state check
 * 
 * This module provides a single source of truth for checking if there's
 * active operational state that should block certain actions (like tenant switch).
 * 
 * Used by:
 * - AppDomainWrapper (Bridge layer)
 * - FlowGate (Sovereign layer)
 */

import { getTabIsolated } from '../storage/TabIsolatedStorage';

export interface OperationalState {
    hasActiveOrder: boolean;
    hasPendingQueue: boolean;
    hasOpenCashRegister: boolean;
    activeOrderId: string | null;
    pendingQueueCount: number;
}

/**
 * Get current operational state
 */
export function getOperationalState(): OperationalState {
    const activeOrderId = getTabIsolated('chefiapp_active_order_id');
    const pendingQueueCount = parseInt(getTabIsolated('chefiapp_offline_queue_count') || '0', 10);

    // Future: Add cash register check when available
    // const openCashRegisterId = getTabIsolated('chefiapp_open_cash_register_id');

    return {
        hasActiveOrder: !!activeOrderId,
        hasPendingQueue: pendingQueueCount > 0,
        hasOpenCashRegister: false, // TODO: Implement when needed
        activeOrderId,
        pendingQueueCount,
    };
}

/**
 * Check if there's any active operational state that should block tenant switch
 * 
 * Returns true if:
 * - Active order exists
 * - Offline queue has pending items
 * - Cash register is open (future)
 */
export function hasActiveOperationalState(): boolean {
    const state = getOperationalState();
    return state.hasActiveOrder || state.hasPendingQueue || state.hasOpenCashRegister;
}

/**
 * Get human-readable reason why operational state is blocking
 */
export function getOperationalStateBlockReason(): string | null {
    const state = getOperationalState();

    if (state.hasActiveOrder) {
        return `Pedido ativo: ${state.activeOrderId}`;
    }
    if (state.hasPendingQueue) {
        return `${state.pendingQueueCount} operação(ões) pendente(s) na fila`;
    }
    if (state.hasOpenCashRegister) {
        return 'Caixa aberto';
    }

    return null;
}
