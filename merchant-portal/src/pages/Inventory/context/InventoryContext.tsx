import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { InventoryItem, TaskRecipe } from '../../../core/inventory/InventoryTypes';
import type { EquipmentOrgan } from '../../AppStaff/context/StaffCoreTypes';
import type { InventorySignal } from '../../../intelligence/nervous-system/InventoryReflexEngine';
import { checkInventoryReflex } from '../../../intelligence/nervous-system/InventoryReflexEngine';
import { Cortex } from '../../../intelligence/nervous-system/Cortex'; // 🧠 The Cortex
import { ORGAN_REGISTRY } from '../../../core/inventory/EquipmentOrganRegistry';
import { MetabolicClock, type MetabolicPulse } from '../../../intelligence/nervous-system/MetabolicClock';
import { MetabolicAudit } from '../../../intelligence/nervous-system/MetabolicAudit';
import { SystemEvents } from '../../../core/events/SystemEvents';
import { GlobalEventStore } from '../../../core/events/EventStore'; // Phase 14
import { CoreExecutor } from '../../../core/events/CoreExecutor';
import { useStaff } from '../../AppStaff/context/StaffContext';

// ------------------------------------------------------------------
// 🫀 INVENTORY CONTEXT (THE GUT)
// ------------------------------------------------------------------
// "Diet is what we buy. Metabolism is what we do."

interface InventoryContextType {
    items: InventoryItem[];
    recipes: TaskRecipe[];
    organs: EquipmentOrgan[];
    updateItem: (id: string, updates: Partial<InventoryItem>) => void;
    consumeItem: (itemId: string, quantity: number, reason?: string, correlationId?: string) => void;
    restockItem: (itemId: string, quantity: number, invoiceId?: string) => void;
    adjustItem: (itemId: string, newLevel: number, reason: string) => void;

    isLoading: boolean;
    hungerSignals: InventorySignal[]; // Added
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// ✅ Protocol 12/13: Silence > Lie
const resolveOrganForItem = (item: InventoryItem): { organId: string; organName?: string } | null => {
    const organId = (item as any).defaultOrganId as string | undefined;
    const organName = (item as any).defaultOrganName as string | undefined;
    if (!organId) return null;
    return { organId, organName };
};

export const InventoryReflexProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { activeRole, activeShift, registerTask, tasks } = useStaff() as any;
    const [hungerSignals, setHungerSignals] = useState<InventorySignal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 🏗️ CATALOGUE (Static Definition / Genesis State)
    // In a real system, this comes from a Product/Inventory Service
    const INITIAL_ITEMS: InventoryItem[] = [
        {
            id: 'base-pizza-artesanal',
            name: 'Base Pizza (Artesanal)',
            category: 'raw_material',
            packaging: { type: 'box', hasDispenser: false, volumePerUnit: 1, unit: 'un' },
            lifecycle: {
                requiresPrep: false,
                shelfLifeAfterPrep: 0,
                restockRule: { type: 'threshold', min: 20, max: 100 },
                responsibleRole: 'kitchen',
            },
            currentStock: 100,
            lastUpdated: new Date(),
            defaultOrganId: 'organ-main-freezer',
            defaultOrganName: 'Freezer Principal',
        } as any,
        {
            id: 'fresh-mozzarella',
            name: 'Mozzarella Fresca',
            category: 'consumable',
            packaging: { type: 'pack', hasDispenser: false, volumePerUnit: 1000, unit: 'g' },
            lifecycle: {
                requiresPrep: false,
                shelfLifeAfterPrep: 5,
                restockRule: { type: 'threshold', min: 200, max: 5000 },
                responsibleRole: 'kitchen'
            },
            currentStock: 5000, // 5kg
            lastUpdated: new Date(),
            defaultOrganId: 'organ-main-fridge',
            defaultOrganName: 'Fridge Principal'
        } as any,
        {
            id: 'molho-tomate-casa',
            name: 'Molho Tomate (Casa)',
            category: 'prep',
            packaging: { type: 'container', hasDispenser: true, volumePerUnit: 5000, unit: 'ml' },
            lifecycle: { requiresPrep: true, shelfLifeAfterPrep: 48, restockRule: { type: 'threshold', min: 1000, max: 5000 }, responsibleRole: 'kitchen' },
            currentStock: 5000,
            lastUpdated: new Date()
        } as any,
        // Legacy/Mock items to keep UI working
        {
            id: 'beer-super-bock',
            name: 'Super Bock (Barril)',
            category: 'consumable',
            packaging: { type: 'crate', hasDispenser: true, volumePerUnit: 50, unit: 'L' },
            lifecycle: {
                requiresPrep: false,
                shelfLifeAfterPrep: 0,
                restockRule: { type: 'calendar', dayOfWeek: 3, cutOffHour: 14 },
                responsibleRole: 'bar',
            },
            currentStock: 3,
            lastRestockedAt: Date.now(),
            defaultOrganId: 'organ-main-fridge',
            defaultOrganName: 'Fridge Principal',
        } as any,
        {
            id: 'ketchup-heinz-bulk',
            name: 'Ketchup Heinz (Bag 3kg)',
            category: 'consumable',
            packaging: { type: 'bulk_bag', hasDispenser: false, volumePerUnit: 3000, unit: 'L' },
            lifecycle: {
                requiresPrep: true,
                shelfLifeAfterPrep: 24,
                restockRule: { type: 'threshold', min: 2, max: 5 },
                responsibleRole: 'kitchen',
            },
            currentStock: 1, // Low stock triggers hunger
            lastRestockedAt: Date.now() - 86400000,
            defaultOrganId: 'organ-dry-storage-A',
            defaultOrganName: 'Dry Storage A',
        } as any,
    ];

    const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);

    const [recipes] = useState<TaskRecipe[]>([
        {
            id: 'decant-ketchup-daily',
            targetItemId: 'ketchup-heinz-bulk',
            conditions: { requiredPackaging: 'bulk_bag', requiresDispenser: false, stockBelow: 2 },
            definition: {
                title: 'Decantar Ketchup',
                description: 'Transferir bag para bisnagas de serviço (Mise en Place).',
                role: 'kitchen',
                estimatedTime: 600,
                priority: 'high',
            },
        },
    ]);

    const organs = useMemo(() => ORGAN_REGISTRY, []);

    // 🏗️ PHASE 14: HYDRATION (Metabolic Memory)
    useEffect(() => {
        const hydrate = async () => {
            try {
                // 1. Convert Catalog to State Record
                const initialInventory: Record<string, InventoryItem> = {};
                INITIAL_ITEMS.forEach(i => initialInventory[i.id] = i);

                // 2. Replay Logic (The Iron Core)
                const history = await GlobalEventStore.getAllSince(0);

                if (history.length > 0) {
                    // Use CoreExecutor to reduce ALL history (Orders + Inventory Events)
                    const state = CoreExecutor.reduceAll(history, {
                        orders: [], // We don't need orders here, but Executor requires the shape
                        inventory: initialInventory
                    });

                    // 3. Update State
                    setItems(Object.values(state.inventory));
                } else {
                    setItems(INITIAL_ITEMS);
                }
            } catch (e) {
                console.error('[Inventory] Metabolic hydration failed:', e);
            } finally {
                setIsLoading(false);
            }
        };

        hydrate();
    }, []);

    // 🔄 METABOLIC PULSE LISTENER (The Nervous System)
    useEffect(() => {
        MetabolicClock.start(30000);

        const processMetabolicCycle = async (pulse: MetabolicPulse) => {
            if (!activeShift) return;

            const now = new Date(pulse.timestamp);
            const currentDay = now.getDay();
            const currentHour = now.getHours();

            const currentHungerSignals: InventorySignal[] = [];

            for (const item of items) {
                // 🧠 1. Cortex Evaluation
                const dynamicSignal = await Cortex.evaluate(item);
                if (dynamicSignal) {
                    currentHungerSignals.push(dynamicSignal);
                    continue;
                }

                // 📅 2. Calendar Check
                const rule = item.lifecycle.restockRule;
                if (rule.type === 'calendar' && currentDay === rule.dayOfWeek && currentHour < rule.cutOffHour) {
                    const organ = resolveOrganForItem(item);
                    if (organ) {
                        currentHungerSignals.push({
                            kind: 'HUNGER',
                            itemId: item.id,
                            itemName: item.name,
                            organId: organ.organId,
                            organName: organ.organName,
                            currentLevel: item.currentStock,
                            parLevel: 0,
                            unit: item.packaging?.unit || 'un',
                            severity: 80,
                            timestamp: pulse.timestamp,
                            context: 'Calendar Ritual'
                        });
                    }
                }
            }

            // Reflexes -> Tasks
            const tasksFromReflex = checkInventoryReflex({
                signals: currentHungerSignals,
                context: { activeRole: activeRole || 'manager', density: 'low' },
                existingTasks: tasks ?? [],
                organs: organs
            });

            tasksFromReflex.forEach((t: any) => {
                const audited = {
                    ...t,
                    meta: { ...(t.meta || {}), pulseId: pulse.id, pulseAt: pulse.timestamp },
                };
                registerTask?.(audited);
            });

            if (tasksFromReflex.length > 0) {
                MetabolicAudit.append({
                    type: 'METABOLIC_AUDIT',
                    pulseId: pulse.id,
                    timestamp: Date.now(),
                    tickRate: 0,
                    note: `Tasks: ${tasksFromReflex.length} (${tasksFromReflex.map((t: any) => t.id).join(', ')})`,
                });
            }
            setHungerSignals(currentHungerSignals);
        };

        SystemEvents.on('metabolic:pulse', processMetabolicCycle);
        return () => SystemEvents.off('metabolic:pulse', processMetabolicCycle);
    }, [activeShift, activeRole, items, registerTask, tasks]);

    // ⚡ ACTION DISPATCHERS (The Muscles)

    // ⚡ ACTION DISPATCHERS (The Muscles)

    const consumeItem = async (itemId: string, quantity: number, reason: string = 'manual', correlationId?: string) => {
        if (quantity <= 0) {
            console.warn('[Inventory] Rejected consumption of <= 0 quantity.');
            return;
        }

        // Optimistic
        setItems(prev => {
            const next = [...prev];
            const idx = next.findIndex(i => i.id === itemId);
            if (idx >= 0) {
                // GUARD: Removed Clamp (Phase 11.2 Final)
                // We allow negative stock to represent "Metabolic Debt".
                // The UI should render this as a Critical state, not a zero state.
                const newStock = next[idx].currentStock - quantity;
                next[idx] = { ...next[idx], currentStock: newStock };
            }
            return next;
        });

        await dispatchEvent('INVENTORY_CONSUMED', { itemId, quantity, reason }, correlationId);
    };

    const restockItem = async (itemId: string, quantity: number, invoiceId?: string) => {
        if (quantity <= 0) return;
        // Optimistic
        setItems(prev => {
            const next = [...prev];
            const idx = next.findIndex(i => i.id === itemId);
            if (idx >= 0) {
                next[idx] = { ...next[idx], currentStock: next[idx].currentStock + quantity, lastRestockedAt: Date.now() };
            }
            return next;
        });

        await dispatchEvent('INVENTORY_RESTOCKED', { itemId, quantity, invoiceId });
    };

    const adjustItem = async (itemId: string, newLevel: number, reason: string) => {
        if (newLevel < 0) return; // Basic sanity
        // Optimistic
        setItems(prev => {
            const next = [...prev];
            const idx = next.findIndex(i => i.id === itemId);
            if (idx >= 0) {
                next[idx] = { ...next[idx], currentStock: newLevel };
            }
            return next;
        });

        await dispatchEvent('INVENTORY_ADJUSTED', { itemId, newLevel, reason });
    };

    const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
        setItems(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)));
        await dispatchEvent('INVENTORY_ITEM_UPDATED', { itemId: id, updates });
    };

    // Helper to constructing sealed events
    const dispatchEvent = async (type: any, payload: any, correlationId?: string) => {
        try {
            const now = Date.now();
            await GlobalEventStore.append({
                eventId: crypto.randomUUID(),
                type: type,
                payload: payload,
                // Core Schema Alignment
                stream_id: 'INVENTORY:GLOBAL',
                stream_version: 0, // Todo: Optimistic Concurrency
                occurred_at: new Date(now),
                correlation_id: correlationId,

                meta: {
                    timestamp: now, // Kept for legacy reducers
                    actorId: activeRole || 'system',
                    sessionId: 'session_1',
                    version: 1,
                }
            } as any);
        } catch (e) {
            console.error(`[Inventory] Failed to dispatch ${type}:`, e);
        }
    };

    return (
        <InventoryContext.Provider value={{
            items,
            recipes,
            organs,
            consumeItem,
            restockItem,
            adjustItem,
            updateItem,
            isLoading,
            hungerSignals
        }}>
            {children}
        </InventoryContext.Provider>
    );
};

// Renamed export to match original usage if needed, or keeping explicit. 
// User demanded "UM useInventory".
// I will keep `useInventoryContext` as an alias if needed, but User said "useInventory".
// I will export BOTH to be safe or just obey. `useInventoryContext` was the previous name.
export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) throw new Error('useInventory must be used within an InventoryReflexProvider');
    return context;
};

// Backward compatibility alias (to prevent breaking other files)
export const useInventoryContext = useInventory;
