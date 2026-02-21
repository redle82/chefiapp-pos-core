// @ts-nocheck
import { DbWriteGate } from '../governance/DbWriteGate';
import { Logger } from '../logger';

/**
 * Table Projection (Sovereign)
 * 
 * Manages database writes for Table Domain.
 */

export const persistTableStatus = async (payload: any, context: any) => {
    const { tableId, status, tenantId } = payload;
    // Map event 'target' state to payload 'status' if not provided explicitly?
    // Usually Config passes { status: 'occupied' } in metadata or we imply it from state.
    // But kernel.execute({ event: 'OCCUPY', tableId }) -> logic might be needed.
    // For now, assume payload contains the target 'status'.
    // Wait, state machine defines "target": "OCCUPIED".
    // Does Kernel pass the *target state* to the effect?
    // Review CoreExecutor: it passes `event.payload` to effect.
    // So the payload must contain 'status' or the effect must derive it.
    // Better: Effect takes `targetState` from transition context?
    // Currently CoreExecutor doesn't seem to inject targetState automatically into payload.
    // So caller (TableContext) should pass { status: 'occupied' } OR effect hardcodes it?
    // Reusable effect `persistTableStatus` implies it reads status from payload.

    if (!status) {
        Logger.error('TABLE_PROJECTION: Missing status in payload', { tableId });
        return;
    }

    const { error } = await DbWriteGate.update(
        'TableProjection',
        'gm_tables',
        { status, updated_at: new Date().toISOString() },
        { id: tableId },
        { tenantId: (context?.tenantId || tenantId) }
    );

    if (error) {
        Logger.error('TABLE_PROJECTION: Failed to update status', error, { tableId, status });
        throw new Error('Table status update failed');
    }

    Logger.info('TABLE: Status Updated', { tableId, status });
};
