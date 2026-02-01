import { useEffect } from 'react';
import { useAppStaffOrders } from '../hooks/useAppStaffOrders';
import { useStaff } from '../context/StaffContext';
import type { Task } from '../context/StaffCoreTypes';

// REFLEX DEFINITIONS
// 1. "Cashier cleared order" -> "Table needs cleaning"

// 🧠 CACHE (Session Memory to avoid DB spam)
const sessionReflexCache = new Set<string>();

export const useReflexEngine = (
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    notifyActivity: () => void,
    restaurantId: string | null
) => {
    // FASE 3.3: Isolado - AppStaff não depende de TPV
    const { orders: appStaffOrders } = useAppStaffOrders(restaurantId);
    // Converter para formato esperado
    const orders = appStaffOrders.map(order => ({
      id: order.id,
      status: (order.status === 'OPEN' ? 'new' : 
               order.status === 'IN_PREP' ? 'preparing' : 
               order.status === 'READY' ? 'ready' : 
               order.status === 'PAID' ? 'paid' : 
               order.status === 'CANCELLED' ? 'cancelled' : 'new') as 'new' | 'preparing' | 'ready' | 'served' | 'paid' | 'partially_paid' | 'cancelled',
      tableNumber: order.table_number || undefined,
    }));

    useEffect(() => {
        if (!orders) return;

        const processReflexes = async () => {
            const { supabase } = await import('../../../core/supabase');
            const { getTabIsolated } = await import('../../../core/storage/TabIsolatedStorage');
            const rId = getTabIsolated('chefiapp_restaurant_id');
            if (!rId) return;

            // REFLEX 1: TABLE CLEANING
            // Candidates: Paid orders
            const paidOrders = orders.filter(o => o.status === 'paid');

            for (const order of paidOrders) {
                const reflexKey = 'clean-table';
                const targetId = order.id;
                const taskId = `${reflexKey}-${order.tableNumber}-${targetId.slice(0, 4)}`;
                const cacheKey = `${reflexKey}:${targetId}`;

                // 1. L1 Cache Check (Fast)
                if (sessionReflexCache.has(cacheKey)) continue;

                // 2. Local Task Check (Medium)
                // We can't easily check 'tasks' state here without adding it to dependency array (loop risk).
                // But we can check if we *already* fired it in this session via cache.
                // If it's a fresh page load, we go to L2 (DB).

                // 3. L2 DB Check (Sovereign)
                const { data: existing } = await supabase
                    .from('reflex_firings')
                    .select('id')
                    .match({ restaurant_id: rId, reflex_key: reflexKey, target_id: targetId })
                    .maybeSingle();

                if (existing) {
                    sessionReflexCache.add(cacheKey);
                    continue; // Already fired globally
                }

                // 🔥 FIRE!
                console.log('⚡ REFLEX FIRED (Idempotent):', taskId);

                // A. Insert Memory
                await supabase.from('reflex_firings').insert({
                    restaurant_id: rId,
                    reflex_key: reflexKey,
                    target_id: targetId
                });
                sessionReflexCache.add(cacheKey);

                const newTask: Task = {
                    id: taskId,
                    type: 'maintenance',
                    title: `Limpar Mesa ${order.tableNumber}`,
                    description: 'Cliente pagou. Mesa livre.',
                    status: 'pending',
                    priority: 'high',
                    riskLevel: 20,
                    assigneeRole: 'waiter',
                    uiMode: 'check',
                    reason: 'Financial Closure Event',
                    createdAt: Date.now()
                };

                // B. Create Physical Task (DB + Local)
                // We fire and forget the DB insert to not block UI, relying on local state for immediate feedback
                supabase.from('app_tasks').insert({
                    id: newTask.id,
                    restaurant_id: rId,
                    title: newTask.title,
                    description: newTask.description,
                    status: 'pending',
                    priority: newTask.priority,
                    type: newTask.type,
                    assignee_role: newTask.assigneeRole,
                    created_at: new Date(newTask.createdAt).toISOString()
                }).then(({ error }) => {
                    if (error) console.error('Reflex Task Insert Failed:', error);
                });

                setTasks(prev => {
                    if (prev.some(t => t.id === taskId)) return prev; // Double tap protection
                    return [...prev, newTask];
                });
                notifyActivity();
            }
        };

        processReflexes();

    }, [orders]); // Reacts whenever orders change (Realtime)
};
