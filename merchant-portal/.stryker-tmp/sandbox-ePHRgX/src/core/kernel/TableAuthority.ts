// @ts-nocheck
import { DbWriteGate } from '../governance/DbWriteGate';

export interface TableHardware {
    id?: string;
    number: number;
    seats: number;
    status: 'free' | 'occupied' | 'reserved';
}

/**
 * TABLE AUTHORITY
 * 
 * Infrastructure Authority for Physical/Digital Topography (Tables).
 * 
 * Responsibilities:
 * - Table Hardware Management (Provision, Commission, Decommission)
 * 
 * NOTE:
 * TableAuthority is NOT Event-Sourced by design.
 * Structural state only.
 * May be promoted to Kernel in future versions.
 */
export class TableAuthority {

    /**
     * Provisions a new table (Hardware Installation).
     */
    static async provisionTable(tenantId: string, table: TableHardware) {
        if (!tenantId) throw new Error('TableAuthority: Tenant ID required.');

        const { data, error } = await DbWriteGate.insert(
            'TableAuthority',
            'gm_tables',
            {
                restaurant_id: tenantId,
                number: table.number,
                seats: table.seats || 4,
                status: table.status || 'free'
            },
            { tenantId }
        );

        if (error) throw error;
        return data;
    }

    /**
     * Updates table hardware specs (e.g. changing seats).
     */
    static async updateHardware(tenantId: string, tableId: string, updates: Partial<TableHardware>) {
        if (!tenantId || !tableId) throw new Error('TableAuthority: IDs required.');

        const payload: any = {};
        if (updates.number !== undefined) payload.number = updates.number;
        if (updates.seats !== undefined) payload.seats = updates.seats;
        if (updates.status !== undefined) payload.status = updates.status;
        payload.updated_at = new Date().toISOString();

        const { data, error } = await DbWriteGate.update(
            'TableAuthority',
            'gm_tables',
            payload,
            { id: tableId, restaurant_id: tenantId },
            { tenantId }
        );

        if (error) throw error;
        return data;
    }

    /**
     * Decomissions a table (Hardware Removal).
     * NOTE: This performs a HARD DELETE via bypass, as structural changes are not event-sourced yet.
     */
    static async decommissionTable(tenantId: string, tableId: string) {
        if (!tenantId || !tableId) throw new Error('TableAuthority: IDs required.');

        const { error } = await DbWriteGate.delete(
            'TableAuthority',
            'gm_tables',
            { id: tableId, restaurant_id: tenantId },
            { tenantId }
        );

        if (error) throw error;
        return true;
    }
}
