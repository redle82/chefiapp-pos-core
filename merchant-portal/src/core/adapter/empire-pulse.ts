import { supabase } from '../supabase';

/**
 * Empire Pulse Adapter
 * Emits vital signs to the GoldMonkey Empire.
 */
/**
 * Empire Pulse Adapter
 * Emits vital signs to the GoldMonkey Empire.
 */
export interface PulseContext {
    tenantSlug: string;
    restaurantId?: string; // Future use for exact ID usage
}

export const sendPulse = async (context?: PulseContext) => {
    // 1. Resolve Context (Dynamic or Legacy Default)
    // In Phase K, we default to 'sofia-gastrobar' if not provided because currently the app is single-tenant local.
    // BUT for the Onboarding Engine, we MUST pass the new tenant's slug.
    const tenantSlug = context?.tenantSlug || 'sofia-gastrobar';

    // 1. Gather Vitality Metrics
    // In a real scenario, these would be separate DB queries filtering by restaurant_id if we were multi-tenant in one DB.
    // Since we are "App per Restaurant" logically in Phase 1 (or RLS in Phase 2), we query global.
    // CAUTION: If RLS is on, this query naturally filters to the logged-in user's restaurant.
    // Nota: com head: true, não podemos usar select('*'), então usamos 'id'
    const { count: menuCount } = await supabase.from('gm_products').select('id', { count: 'exact', head: true });

    // Get orders for today
    const today = new Date().toISOString().split('T')[0];
    const { count: orderCount, data: orders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', today);

    // Calculate revenue mock (in reality detailed aggregation)
    const revenue = orders?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

    // 2. Construct the Signal
    const signal = {
        system: "chefiapp-merchant-portal",
        deployment: "production-pilot-k",
        heartbeat: new Date().toISOString(),
        status: "healthy",
        vitality: {
            active_pilot: tenantSlug === 'sofia-gastrobar' ? "Sofia Gastrobar" : tenantSlug, // Simple name mapping for now
            menu_items: menuCount || 0,
            orders_today: orderCount || 0,
            revenue_today: revenue
        },
        risk: {
            level: "low",
            active_alerts: 0
        }
    };

    // 3. Emit (Transmission)
    // Primary: Persistence (The Truth)
    const { error } = await supabase.from('empire_pulses').insert({
        project_slug: 'chefiapp',
        tenant_slug: tenantSlug,
        heartbeat: signal.heartbeat,
        metrics: signal.vitality, // Mapping vitality to metrics
        events: [], // Pulses usually don't carry events unless aggregated
        risk: signal.risk
    });

    if (error) {
        console.warn("[EMPIRE_PULSE] Failed to transmit pulse:", error);
    } else {
        console.groupCollapsed(`[EMPIRE_PULSE] Signal Transmitted @ ${new Date().toLocaleTimeString()} [${tenantSlug}]`);
        console.log("Payload:", signal);
        console.groupEnd();
    }

    return signal;
};

/**
 * Emits a discrete Operational Event to the Empire.
 * @param event The structured event data.
 */
export const emitPulseEvent = async (event: any) => {
    // 1. Construct the Signal Packet as a Pulse entry (or separate event table if needed)
    // For now, we reuse empire_pulses structure but focus on events.
    // Ideally, pulses capture STATE, events capture DELTAS.
    // Genesis v1: Write event to pulse table with empty metrics or specific event flag.

    // Actually, let's create a specialized entry for the event.
    const { error } = await supabase.from('empire_pulses').insert({
        project_slug: 'chefiapp',
        tenant_slug: event.restaurant_id || 'unknown',
        heartbeat: new Date().toISOString(),
        metrics: {},
        events: [event], // Array of 1 event
        risk: { level: event.severity === 'critical' ? 'high' : 'low', active_alerts: 1 }
    });

    // 2. Obs
    if (error) {
        console.warn("[EMPIRE_PULSE] Failed to transmit event:", error);
    } else {
        console.group(`[EMPIRE_PULSE] 🚨 EVENT TRANSMITTED: ${event.signal}`);
        console.log(event);
        console.groupEnd();
    }
};
