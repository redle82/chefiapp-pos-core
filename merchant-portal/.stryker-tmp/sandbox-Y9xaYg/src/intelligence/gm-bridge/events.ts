import type { GMEvent, GMEventType, GMSeverity } from './types';

/**
 * ChefIApp Event Bridge
 * 
 * Emitter for high-level operational events to the central dashboard.
 * Designed to be fire-and-forget from the perspective of the UI,
 * but durable in transport (future).
 */

class GMEventBridge {
    private static instance: GMEventBridge;
    private project: 'ChefIApp' = 'ChefIApp';
    private env: 'development' | 'production' | 'staging' = import.meta.env.MODE === 'production' ? 'production' : 'development';

    public static getInstance(): GMEventBridge {
        if (!GMEventBridge.instance) {
            GMEventBridge.instance = new GMEventBridge();
        }
        return GMEventBridge.instance;
    }

    /**
     * Emit an operational event.
     */
    public emit(
        type: GMEventType,
        severity: GMSeverity,
        instanceId: string, // Restaurant ID
        payload: Record<string, any>,
        actorId = 'system'
    ) {
        const event: GMEvent = {
            event_id: crypto.randomUUID(),
            ts: Date.now(),
            project: this.project,
            instance_id: instanceId,
            environment: this.env,
            actor: {
                id: actorId,
                role: 'unknown' // In V2 derive from session
            },
            severity,
            type,
            payload
        };

        // 1. Log to Console (Dev Mode)
        if (this.env === 'development') {
            console.groupCollapsed(`[GM-BRIDGE] 📡 ${type}`);
            console.log(event);
            console.groupEnd();
        }

        // 2. Queue for Transport (Future: Supabase/HTTP)
        // this.transport.send(event);
    }
}

export const Bridge = GMEventBridge.getInstance();
