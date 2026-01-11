import { Bridge } from './events';
import { Snapshot } from './snapshot';
import { type GMEventType, type GMSeverity } from './types';

/**
 * ChefIApp Telemetry Bridge Client
 * 
 * The single conduit for ChefIApp to talk to the external "Owner Dashboard".
 * Usage:
 *   GMBridgeClient.emit('ORDER_CREATED', 'info', { orderId: '123' })
 *   GMBridgeClient.sendSnapshot()
 */

export class GMBridgeClient {
    private static instance: GMBridgeClient;
    private restaurantId: string = 'unknown';

    private constructor() { }

    public static getInstance(): GMBridgeClient {
        if (!GMBridgeClient.instance) {
            GMBridgeClient.instance = new GMBridgeClient();
        }
        return GMBridgeClient.instance;
    }

    public initialize(restaurantId: string) {
        this.restaurantId = restaurantId;
        console.log(`[GM-BRIDGE] Initialized for ${restaurantId}`);
    }

    public emit(type: GMEventType, severity: GMSeverity, payload: Record<string, any>) {
        if (this.restaurantId === 'unknown') {
            console.warn('[GM-BRIDGE] Warning: Emitting event before initialization');
        }
        Bridge.emit(type, severity, this.restaurantId, payload);
    }

    public async sendSnapshot() {
        if (this.restaurantId === 'unknown') return;

        const snapshot = await Snapshot.capture(this.restaurantId);

        if (import.meta.env.DEV) {
            console.groupCollapsed(`[GM-BRIDGE] 📸 Snapshot Captured`);
            console.log(snapshot);
            console.groupEnd();
        }

        // Future: await fetch('https://api.chefiapp.com/gm/snapshot', { method: 'POST', body: JSON.stringify(snapshot) })
    }
}

export const Telemetry = GMBridgeClient.getInstance();
