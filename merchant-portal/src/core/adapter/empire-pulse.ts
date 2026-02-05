import { BackendType, getBackendType } from '../infra/backendAdapter';
import { getDockerCoreFetchClient } from '../infra/dockerCoreFetchClient';
// ANTI-SUPABASE §4: Empire pulse ONLY via Core. No-op when not Docker.

/**
 * Empire Pulse Adapter — Emits vital signs to the GoldMonkey Empire.
 * Domain read/write ONLY via Docker Core; no Supabase.
 */
export interface PulseContext {
    tenantSlug: string;
    restaurantId?: string;
}

export const sendPulse = async (context?: PulseContext) => {
    if (getBackendType() !== BackendType.docker) {
        return {
            system: "chefiapp-merchant-portal",
            deployment: "production-pilot-k",
            heartbeat: new Date().toISOString(),
            status: "healthy",
            vitality: { active_pilot: context?.tenantSlug || "unknown", menu_items: 0, orders_today: 0, revenue_today: 0 },
            risk: { level: "low", active_alerts: 0 },
        };
    }

    const tenantSlug = context?.tenantSlug || 'sofia-gastrobar';
    const core = getDockerCoreFetchClient();

    const menuRes = await core.from('gm_products').select('id').then((r) => r);
    const menuCount = Array.isArray(menuRes.data) ? menuRes.data.length : 0;

    const today = new Date().toISOString().split('T')[0];
    const ordersRes = await core.from('gm_orders').select('total, created_at').then((r) => r);
    const allOrders = (Array.isArray(ordersRes.data) ? ordersRes.data : []) as { total?: number; created_at?: string }[];
    const todayOrders = allOrders.filter((o) => o.created_at?.startsWith(today));
    const orderCount = todayOrders.length;
    const revenue = todayOrders.reduce((acc, curr) => acc + (curr?.total || 0), 0);

    const signal = {
        system: "chefiapp-merchant-portal",
        deployment: "production-pilot-k",
        heartbeat: new Date().toISOString(),
        status: "healthy",
        vitality: {
            active_pilot: tenantSlug === 'sofia-gastrobar' ? "Sofia Gastrobar" : tenantSlug,
            menu_items: menuCount,
            orders_today: orderCount,
            revenue_today: revenue,
        },
        risk: { level: "low", active_alerts: 0 },
    };

    const insertRes = await core.from('empire_pulses').insert({
        project_slug: 'chefiapp',
        tenant_slug: tenantSlug,
        heartbeat: signal.heartbeat,
        metrics: signal.vitality,
        events: [],
        risk: signal.risk,
    }).then((r) => r);

    if (insertRes.error) {
        console.warn("[EMPIRE_PULSE] Failed to transmit pulse:", insertRes.error);
    } else {
        console.groupCollapsed(`[EMPIRE_PULSE] Signal Transmitted @ ${new Date().toLocaleTimeString()} [${tenantSlug}]`);
        console.log("Payload:", signal);
        console.groupEnd();
    }

    return signal;
};

/**
 * Emits a discrete Operational Event to the Empire. Core only.
 */
export const emitPulseEvent = async (event: any) => {
    if (getBackendType() !== BackendType.docker) return;
    const core = getDockerCoreFetchClient();
    const res = await core.from('empire_pulses').insert({
        project_slug: 'chefiapp',
        tenant_slug: event.restaurant_id || 'unknown',
        heartbeat: new Date().toISOString(),
        metrics: {},
        events: [event],
        risk: { level: event.severity === 'critical' ? 'high' : 'low', active_alerts: 1 },
    }).then((r) => r);

    if (res.error) {
        console.warn("[EMPIRE_PULSE] Failed to transmit event:", res.error);
    } else {
        console.group(`[EMPIRE_PULSE] 🚨 EVENT TRANSMITTED: ${event.signal}`);
        console.log(event);
        console.groupEnd();
    }
};
