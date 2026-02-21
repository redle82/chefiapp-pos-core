import type { Task, EquipmentOrgan } from '../../pages/AppStaff/context/StaffCoreTypes';

// ------------------------------------------------------------------
// 🧠 INVENTORY REFLEX ENGINE (THE METABOLISM)
// ------------------------------------------------------------------
// Transforms physiological signals (Hunger) into nervous impulses (Tasks).
// Complies with Law 6 (Progressive Externalization).

export type InventorySignal = {
    kind: 'HUNGER';
    itemId: string;
    itemName: string;

    // 🧬 Verdade metabólica
    organId: string;
    organName?: string;

    currentLevel: number;
    parLevel: number;
    unit: string;
    severity: number; // 0-100
    timestamp: number;

    // Optional compatibility fields
    delta?: number;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    context?: string;
};

interface ReflexContext {
    activeRole: 'manager' | 'worker' | 'kitchen' | 'waiter' | 'cleaning';
    density: 'low' | 'high'; // Derived from online connection count
}

interface InventoryReflexInput {
    signals: InventorySignal[];
    context: ReflexContext;
    existingTasks: Task[]; // 🛡️ For duplicate prevention
    organs: EquipmentOrgan[]; // Passed from context
}

// Helper Functions
const makeHungerKey = (organId: string, itemId: string) => `${organId}::${itemId}`;
const makeTaskId = (organId: string, itemId: string) => `stock-${organId}-${itemId}-${Date.now()}`;

export const checkInventoryReflex = (input: InventoryReflexInput): Task[] => {
    const { signals, context, existingTasks, organs } = input;
    const { density } = context;
    const now = Date.now();
    const newTasks: Task[] = [];

    // Organ Map for fast lookup
    const organMap = new Map(organs.map(o => [o.id, o]));

    // 🛡️ PREVENT DUPLICATE HUNGER TASKS
    const existingHungerKeys = new Set(
        existingTasks
            .filter(t => t.meta?.source === 'inventory-reflex' && t.status !== 'done')
            .map(t => t.meta?.hungerKey || t.meta?.signalId)
            .filter(Boolean)
    );

    // Filter Signals (Only High Severity triggers immediate reflex)
    const criticalSignals = signals.filter(s => s.severity > 0);

    for (const signal of criticalSignals) {
        // Safe Organ ID (Adapter)
        const safeOrganId = signal.organId || 'unknown_organ';
        const hungerKey = makeHungerKey(safeOrganId, signal.itemId);

        // ✅ bloqueia duplicado por organ+item
        if (existingHungerKeys.has(hungerKey) || existingHungerKeys.has(signal.itemId)) continue;

        // 🛡️ LAW 8: Zombie Check real: órgão precisa existir
        if (signal.organId) {
            const organ = organMap.get(signal.organId);
            if (!organ && signal.organId !== 'unknown_organ') {
                console.warn(`[Reflex] Organ ${signal.organId} not found in Registry. Ignoring signal.`);
                continue;
            }
        }

        const targetRole: 'manager' | 'global' = density === 'low' ? 'global' : 'manager';

        newTasks.push({
            id: makeTaskId(safeOrganId, signal.itemId),
            type: 'preventive',
            title: `Stock Crítico: ${signal.itemName}`,
            description: `${signal.organName ?? 'Organ'}: ${signal.currentLevel}${signal.unit} abaixo do par (${signal.parLevel}${signal.unit}). Reabastecer.`,
            reason: 'Fome sistémica detectada.',
            riskLevel: 70 + signal.severity * 0.3,
            assigneeRole: targetRole as any,
            priority: signal.severity > 50 ? 'critical' : 'attention',
            context: 'storage', // Requires 'storage' in Task.context
            uiMode: 'check',
            status: 'pending',
            createdAt: now,
            meta: {
                source: 'inventory-reflex',
                mode: 'pressure',
                generatedAt: now,

                // ✅ nova verdade
                hungerKey,
                organId: safeOrganId,
                organName: signal.organName,
                itemId: signal.itemId,

                // ✅ compat com legado
                signalId: signal.itemId,
            },
        });
    }

    return newTasks;
};

// ------------------------------------------------------------------
// 🔄 AUTO-RESOLUTION (Clearing Hunger When Stock Replenished)
// ------------------------------------------------------------------
export const resolveHungerSignals = (
    tasks: Task[],
    signals: InventorySignal[]
): Task[] => {
    const map = new Map<string, InventorySignal>();
    for (const s of signals) {
        if (s.organId) map.set(`${s.organId}::${s.itemId}`, s);
    }

    return tasks.map(task => {
        if (task.meta?.source !== 'inventory-reflex') return task;
        if (task.status === 'done') return task;

        const hungerKey = task.meta?.hungerKey as string | undefined;

        // ✅ retrocompat: tasks antigas sem hungerKey
        if (!hungerKey) {
            const legacySignalId = task.meta?.signalId as string | undefined;
            const legacy = legacySignalId ? signals.find(s => s.itemId === legacySignalId) : undefined;
            if (!legacy) return task;

            if (legacy.currentLevel >= legacy.parLevel || legacy.severity === 0) {
                return {
                    ...task,
                    status: 'done' as const,
                    meta: { ...task.meta, autoResolved: true, resolvedAt: Date.now() },
                };
            }
            return task;
        }

        const signal = map.get(hungerKey);
        if (!signal) return task;

        if (signal.currentLevel >= signal.parLevel || signal.severity === 0) {
            return {
                ...task,
                status: 'done' as const,
                meta: { ...task.meta, autoResolved: true, resolvedAt: Date.now() },
            };
        }

        return task;
    });
};
