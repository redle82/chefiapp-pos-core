/**
 * Status Mapper
 * 
 * Maps between UI Dialects (lower_case/legacy) and Kernel Sovereign Status (UPPER_CASE).
 * 
 * @module core/utils/StatusMapper
 */
// @ts-nocheck


import { OrderStatus } from '../types'; // Adjust path if needed

// Kernel Status (Sovereign)
export type KernelOrderStatus = 'OPEN' | 'LOCKED' | 'PAID' | 'CLOSED' | 'CANCELED';

// UI Dialect (Legacy/Presentational)
// pending -> OPEN
// preparing -> LOCKED (or PREPARING if extended)
// ready -> LOCKED (with ready flag? or substate)
// paid -> PAID
// cancelled -> CANCELED

export const StatusMapper = {
    toKernel(uiStatus: string): KernelOrderStatus {
        switch (uiStatus.toLowerCase()) {
            case 'pending': return 'OPEN';
            case 'preparing': return 'LOCKED';
            case 'ready': return 'LOCKED'; // Ready is a substate of LOCKED
            case 'served': return 'LOCKED';
            case 'paid': return 'PAID';
            case 'closed': return 'CLOSED';
            case 'cancelled': return 'CANCELED';
            case 'canceled': return 'CANCELED';
            default: return 'OPEN'; // Auto-recover to OPEN if unknown? Or throw?
        }
    },

    toUI(kernelStatus: KernelOrderStatus): OrderStatus {
        switch (kernelStatus) {
            case 'OPEN': return 'pending';
            case 'LOCKED': return 'preparing'; // Default for LOCKED
            case 'PAID': return 'paid';
            case 'CLOSED': return 'closed';
            case 'CANCELED': return 'cancelled';
            default: return 'pending';
        }
    },

    isModifiable(status: KernelOrderStatus | string): boolean {
        const kernelStatus = this.toKernel(status as string);
        return kernelStatus === 'OPEN';
    }
};
