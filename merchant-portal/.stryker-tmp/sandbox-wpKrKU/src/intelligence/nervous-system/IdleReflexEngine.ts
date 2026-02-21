import type { Task, StaffRole, LatentObligation } from '../../pages/AppStaff/context/StaffCoreTypes';
// import type { LatentObligation } from '../../pages/AppStaff/context/StaffTypes';
// import type { LatentObligation } from '../../pages/AppStaff/context/metabolism';
import { now as getNow } from './Clock';

// ------------------------------------------------------------------
// 🧠 SYSTEM REFLEX ENGINE (Canonical)
// ------------------------------------------------------------------
// "Idle is presence of unused capacity in a safe environment."
// ------------------------------------------------------------------

interface NervousState {
    orders: any[]; // Typed loosely to avoid circular deps
    shiftState: 'active' | 'offline' | 'closing' | 'closed';
    lastActivityAt: number;
    activeRole: StaffRole;
    tasks: Task[];
    operationalMode?: 'local' | 'connected';
    obligations: LatentObligation[]; // 🧬 METABOLIC INPUT
}

type DayPhase = 'morning' | 'peak' | 'lull';

export const checkSystemReflex = (state: NervousState): Task[] => {
    // 0. BASIC GATES
    if (state.shiftState !== 'active') return [];

    // 🛡️ PREVENT FLICKER (If system just spoke, don't speak again)
    const hasReflexTask = state.tasks.some(t => t.meta?.source === 'system-reflex' && t.status !== 'done');
    if (hasReflexTask) return [];

    const now = getNow();

    // ----------------------------------------------------------------
    // 0️⃣ ACTIVE DUTY REFLEX (The Work Itself)
    // ----------------------------------------------------------------
    // "If there is a fire, putting it out is not a choice."

    const activeDutyTasks: Task[] = [];

    state.orders.forEach(order => {
        // KITCHEN: NEW -> PREPARE
        if (order.status === 'new') {
            activeDutyTasks.push({
                id: `action-${order.id}-accept`,
                type: 'mission_critical',
                title: `Aceitar Pedido #${order.tableNumber}`,
                description: `Mesa ${order.tableNumber} aguardando início.`,
                reason: 'Pedido Novo',
                status: 'pending',
                assigneeRole: 'kitchen',
                priority: 'critical',
                riskLevel: 90,
                uiMode: 'action',
                context: 'kitchen',
                createdAt: now,
                meta: {
                    source: 'kds-sync',
                    orderId: order.id,
                    action: 'prepare',
                    tableNumber: order.tableNumber
                }
            });
        }

        // KITCHEN: PREPARING -> READY
        if (order.status === 'preparing') {
            activeDutyTasks.push({
                id: `action-${order.id}-ready`,
                type: 'mission_critical',
                title: `Finalizar Mesa #${order.tableNumber}`,
                description: `Em preparação há ${Math.floor((now - new Date(order.createdAt).getTime()) / 60000)} min.`,
                reason: 'Produção em andamento',
                status: 'pending',
                assigneeRole: 'kitchen',
                priority: 'attention',
                riskLevel: 50,
                uiMode: 'action',
                context: 'kitchen',
                createdAt: now,
                meta: {
                    source: 'kds-sync',
                    orderId: order.id,
                    action: 'ready',
                    tableNumber: order.tableNumber
                }
            });
        }

        // WAITER: READY -> SERVE
        if (order.status === 'ready') {
            activeDutyTasks.push({
                id: `action-${order.id}-serve`,
                type: 'mission_critical',
                title: `SERVIR Mesa #${order.tableNumber}`,
                description: `Pedido pronto no pass.`,
                reason: 'Cliente aguardando',
                status: 'pending',
                assigneeRole: 'waiter',
                priority: 'critical',
                riskLevel: 80,
                uiMode: 'action',
                context: 'floor',
                createdAt: now,
                meta: {
                    source: 'kds-sync',
                    orderId: order.id,
                    action: 'serve',
                    tableNumber: order.tableNumber
                }
            });
        }
    });

    if (activeDutyTasks.length > 0) {
        // If we have active duty, we return it immediately.
        // We do NOT filter out reflex tasks here, as we want to mix them or prioritize active duty.
        // For simplicity in Phase A: Active Duty replaces Idle thoughts.
        return activeDutyTasks;
    }

    // ----------------------------------------------------------------
    // 1️⃣ METABOLIC PHYSICS LAYER (Idle Logic)
    // ----------------------------------------------------------------

    // A. CALCULATE PHASE (Metabolism)
    const hour = new Date(now).getHours();
    let phase: DayPhase;
    if (hour < 11) phase = 'morning';
    else if (hour >= 11 && hour < 14) phase = 'peak'; // Lunch Rush
    else if (hour >= 18 && hour < 21) phase = 'peak'; // Dinner Rush
    else if (hour >= 14 && hour < 18) phase = 'lull'; // Afternoon Lull
    else phase = 'lull'; // Late night

    // B. CALCULATE DENSITY
    const density = state.operationalMode === 'connected' ? 'high' : 'low';

    // C. CALCULATE PRESSURE (Sympathetic)
    // Orders are LUG (Fight) - Immediate Override
    const hasActiveOrders = state.orders.some(o => o.status === 'new' || o.status === 'preparing');
    const backlogSize = state.orders.filter(o => o.status === 'new').length;

    // D. CALCULATE BRAIN LOAD (Cognitive)
    // Critical tasks or high risk prevent idle thoughts
    const hasCriticalTasks = state.tasks.some(t => t.priority === 'critical' && t.status === 'pending');
    const riskLevel = state.tasks.reduce((acc, t) => t.status === 'pending' ? acc + (t.riskLevel || 0) : acc, 0) / (state.tasks.length || 1);

    // ----------------------------------------------------------------
    // 2️⃣ THE EMERGENCE EQUATION (shouldIdleTaskEmerge)
    // ----------------------------------------------------------------

    // I. Micro-Motion Threshold (Energy)
    // In rush, brain accepts larger micro-pauses. In lull, any vibration counts.
    const microMotionThreshold = phase === 'peak' ? 5000 : 2000;
    if (now - state.lastActivityAt < microMotionThreshold) {
        return [];
    }

    // II. Sympathetic Override (Pressure)
    // If fighting (orders), no reflecting.
    if (hasActiveOrders) {
        // Special Case: Pressure Reflex happens here (see below)
        return generatePressureReflex(state, now, backlogSize);
    }

    // III. Cognitive Load (Brain)
    // If mind is cluttered, no new suggestions.
    const riskTolerance = density === 'low' ? 30 : 60; // Single player feels risk more intensely
    if (hasCriticalTasks || riskLevel > riskTolerance || backlogSize > 3) { // 3 is BACKLOG_TOLERANCE
        return [];
    }

    // IV. Metabolic Threshold (Context)
    const threshold = calculateMetabolicThreshold(density, phase);
    const idleTime = now - state.lastActivityAt;

    if (idleTime > threshold) {
        // ----------------------------------------------------------------
        // 🧬 METABOLIC REFLEX (Eat Latent Obligations)
        // ----------------------------------------------------------------
        // This is where Law 6 kicks in. Time 2 meets Time 1.

        const relevantObligations = state.obligations?.filter(obl =>
            obl.status === 'active' &&
            obl.criticality !== 'high' // High crit handled by Manager Pressure
        ) || [];

        if (relevantObligations.length > 0) {
            const ob = relevantObligations[0];
            // We consume the first available obligation
            console.log(`🧠 Metabolic Reflex: Converting Obligation [${ob.id}] to Task`);

            return [{
                id: `reflex-metabolic-${ob.id}-${now}`,
                type: 'preventive',
                title: ob.title,
                description: ob.description,
                reason: 'Obrigação Metabólica Latente.',
                status: 'pending',
                assigneeRole: state.activeRole,
                priority: 'background',
                riskLevel: 10,
                uiMode: 'check',
                context: state.activeRole === 'kitchen' ? 'kitchen' : 'floor',
                createdAt: now,
                meta: { source: 'inventory-synapse', mode: 'idle', generatedAt: now }
            }];
        }

        return generateIdleReflex(state, now, phase);
    }

    return [];
};

/**
 * Hysteresis Calculation
 */
function calculateMetabolicThreshold(density: 'low' | 'high', phase: DayPhase): number {
    if (density === 'low') { // System is Partner
        switch (phase) {
            case 'morning': return 120_000;   // 2 min (Prep agile)
            case 'peak': return 300_000;   // 5 min (Rush protection)
            case 'lull': return 90_000;    // 90s (Micro-tasks)
        }
    }
    // High Density = System is Observer (Patient)
    return 600_000; // 10 min
}

// ----------------------------------------------------------------
// 3️⃣ REFLEX GENERATORS
// ----------------------------------------------------------------

function generateIdleReflex(state: NervousState, now: number, phase: DayPhase): Task[] {
    const { activeRole } = state;
    console.log(`🌱 Nervous System: Idle Emerged @ ${phase}. Role: ${activeRole}`);

    const newTasks: Task[] = [];

    if (activeRole === 'waiter') {
        newTasks.push({
            id: `reflex-waiter-${now}`,
            type: 'preventive',
            title: phase === 'lull' ? 'Detalhes Invisíveis' : 'Preparar o Palco',
            description: phase === 'lull' ? 'Alinhar cadeiras. Verificar saleiros.' : 'O próximo cliente merece magia.',
            reason: 'Ocioso & Seguro.',
            status: 'pending',
            assigneeRole: 'waiter',
            priority: 'background',
            riskLevel: 10,
            uiMode: 'check',
            context: 'floor',
            createdAt: now,
            meta: { source: 'system-reflex', mode: 'idle', generatedAt: now }
        });
    }

    if (activeRole === 'kitchen') {
        newTasks.push({
            id: `reflex-kitchen-${now}`,
            type: 'preventive',
            title: 'Mise en Place Mental',
            description: 'Limpar bancada. Afiar faca. Respirar.',
            reason: 'Preparação vence a pressão.',
            status: 'pending',
            assigneeRole: 'kitchen',
            priority: 'background',
            riskLevel: 10,
            uiMode: 'check',
            context: 'kitchen',
            createdAt: now,
            meta: { source: 'system-reflex', mode: 'idle', generatedAt: now }
        });
    }

    // Add Cleaning logic if needed
    if (activeRole === 'cleaning') {
        newTasks.push({
            id: `reflex-cleaning-${now}`,
            type: 'preventive',
            title: 'Profundidade',
            description: 'Rodapés e Vidros. Onde ninguém vê.',
            reason: 'Manutenção profunda.',
            status: 'pending',
            assigneeRole: 'cleaning',
            priority: 'background',
            riskLevel: 10,
            uiMode: 'check',
            context: 'floor',
            createdAt: now,
            meta: { source: 'system-reflex', mode: 'idle', generatedAt: now }
        });
    }

    return newTasks;
}

function generatePressureReflex(state: NervousState, now: number, backlog: number): Task[] {
    // Only certain roles receive help during pressure.
    // Waiters/Kitchen have tools. Cleaning/Runners have tasks.

    if (state.activeRole === 'cleaning' && backlog > 5) { // High backlog trigger
        return [{
            id: `reflex-vigilance-${now}`,
            type: 'reactive',
            title: 'Vigilância de Fluxo',
            description: 'Chão seco. Caminhos livres. Ajude o fluxo.',
            reason: 'Alta pressão detectada.',
            status: 'pending',
            assigneeRole: 'cleaning',
            priority: 'attention',
            riskLevel: 50,
            uiMode: 'check',
            context: 'floor',
            createdAt: now,
            meta: { source: 'system-reflex', mode: 'pressure', generatedAt: now }
        }];
    }

    return [];
}
