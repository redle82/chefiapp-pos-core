// @ts-nocheck
// FASE 3.3: Isolado - core não depende de páginas
import type { Order } from '../contracts';
import type { Task } from '../../pages/AppStaff/context/StaffContext';

// ------------------------------------------------------------------
// 🎭 THE WALKING SKELETON (Simulation Engine)
// ------------------------------------------------------------------
// This script breathes life into the system to verify the doctrines.

type SimulatorActions = {
    addOrder: (o: Order) => void;
    clearOrders: () => void;
    setTasks: (t: Task[]) => void;
    setShiftState: (s: 'active' | 'closing') => void;
    updateOrder: (id: string, status: any) => void;
};

export const runSimulatedShift = async (actions: SimulatorActions) => {
    console.log('🎭 STARTING SIMULATION: Friday Night Rush (Compressed)');

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // 1. STATE: IDLE (Recovery Mode)
    // ------------------------------------------------
    console.log('Scene 1: The Calm Before the Storm');
    actions.clearOrders();
    actions.setTasks([]); // Clear noise
    actions.setShiftState('active');

    // Check: KDS should show "Mise en Place Mode"
    // Check: Idle Reflex should trigger in ~5s (accelerated for sim)

    await delay(3000);

    // 2. STATE: RAMP UP (First Tables)
    // ------------------------------------------------
    console.log('Scene 2: First Guests Arrive');
    const order1: Order = {
        id: 'sim-ord-001',
        tableNumber: 5,
        status: 'new',
        items: [{ id: 'i1', name: 'Couvert', quantity: 2, price: 5 }],
        total: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerName: 'Mesa Da Janela'
    };
    actions.addOrder(order1);

    // Check: KDS switches to "Production Mode" (Law 1)
    // Check: Waiter sees orbit notification if configured

    await delay(3000);

    // 3. STATE: THE RUSH (Pressure Spike)
    // ------------------------------------------------
    console.log('Scene 3: THE RUSH (High Pressure)');

    // Inject 5 orders rapidly
    for (let i = 2; i <= 6; i++) {
        actions.addOrder({
            id: `sim-ord-00${i}`,
            tableNumber: i,
            status: 'new',
            items: [
                { id: `f${i}`, name: 'Francesinha', quantity: 2, price: 25 },
                { id: `b${i}`, name: 'Fino', quantity: 4, price: 8 }
            ],
            total: 33,
            createdAt: new Date(),
            updatedAt: new Date(),
            customerName: `Grupo ${i}`
        });
        await delay(300);
    }

    // Inject Critical Task (Simulate Spill)
    const spillTask: Task = {
        id: 'sim-task-crit',
        type: 'reactive',
        title: 'Copo Partido',
        description: 'Vidro no chão. Mesa 4.',
        reason: 'Safety',
        status: 'pending',
        riskLevel: 90,
        assigneeRole: 'cleaning',
        priority: 'critical',
        createdAt: Date.now(),
        meta: { source: 'system-reflex', mode: 'pressure' }
    };
    actions.setTasks([spillTask]);

    // Check: KDS Heartbeat should eventually trigger (if we mock time)
    // Check: Cleaning View -> Vigilance Mode
    // Check: Waiter View -> Critical Orbit Toast

    await delay(5000);

    // 4. STATE: RECOVERY (Cool Down)
    // ------------------------------------------------
    console.log('Scene 4: Clearing the Board');

    // Simulate Kitchen working (Move all to ready)
    for (let i = 1; i <= 6; i++) {
        actions.updateOrder(`sim-ord-00${i}`, 'ready');
        await delay(200);
    }

    await delay(2000);
    actions.clearOrders(); // Cleared

    // Check: KDS returns to Mise En Place Mode
    // Check: System should eventually inject "Deep Clean" tasks

    console.log('🎭 SCENE FINISHED. The System Breathed.');
};
