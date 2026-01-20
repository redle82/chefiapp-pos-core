import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getTabIsolated, setTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import type {
    OperationalContract,
    StaffRole,
    Task,
    LatentObligation,
    SpecDriftAlert,
    BusinessType,
    DominantTool
} from './StaffCoreTypes';

// Re-export types for consumers
export type { StaffRole, Task, OperationalContract, LatentObligation, BusinessType, DominantTool } from './StaffCoreTypes';


// 🛡️ SECURITY: Global MOCK Guard
const ALLOW_MOCKS = import.meta.env.DEV || import.meta.env.MODE === 'test';

// MODE B: REMOTE CONTRACT (Connect via Bridge)
// Unified function (Client + Mock Hybrid)
const joinRemoteOperationHelper = async (code: string, setOpContract: (c: OperationalContract) => void, setActiveRole: (r: StaffRole) => void): Promise<{ success: boolean; message?: string }> => {
    try {
        console.log('🔌 Connecting to Bridge with code:', code);

        // A) MOCK PATH (Dev Only)
        if (ALLOW_MOCKS && code.includes('mock')) {
            // Simulate network
            await new Promise(resolve => setTimeout(resolve, 800));

            if (code === 'FAIL') return { success: false, message: 'Simulação de Falha de Rede.' };

            const contract: OperationalContract = {
                id: 'mock-restaurant-connected',
                type: 'restaurant',
                name: 'Restaurante Conectado (Demo)',
                mode: 'connected',
                permissions: []
            };

            setOpContract(contract);

            // Auto-set role
            let role: StaffRole = 'worker';
            if (code.toLowerCase().includes('mgr')) role = 'manager';
            else if (code.toLowerCase().includes('kit')) role = 'kitchen';
            else if (code.toLowerCase().includes('own')) role = 'owner';

            setActiveRole(role);
            setTabIsolated('staff_role', role);
            return { success: true };
        }

        // B) REAL PATH (Production / Supabase)
        if (typeof supabase === 'undefined') {
            return { success: false, message: 'Modo remoto indisponível (Supabase Runtime Missing).' };
        }

        const { data, error } = await supabase
            .from('active_invites')
            .select('*')
            .eq('code', code)
            .single();

        if (error || !data) {
            // Mensagem específica baseada no erro
            let errorMessage = 'Código inválido ou expirado.';
            if (error?.code === 'PGRST116') {
                errorMessage = 'Código não encontrado. Verifique se digitou corretamente.';
            } else if (error?.code === '22P02') {
                errorMessage = 'Formato de código inválido. Use o formato CHEF-XXXX-XX.';
            } else if (error?.message?.includes('expired')) {
                errorMessage = 'Este código expirou. Solicite um novo ao gerente.';
            }
            return { success: false, message: errorMessage };
        }

        const contract: OperationalContract = {
            id: data.restaurant_id,
            type: 'restaurant',
            name: 'Restaurante Conectado',
            mode: 'connected',
            permissions: []
        };

        setOpContract(contract);

        const role = (data.role_granted as StaffRole) || 'worker';
        setActiveRole(role);
        setTabIsolated('staff_role', role);

        return { success: true };

    } catch (err) {
        console.error(err);
        return { success: false, message: 'Erro de conexão.' };
    }
};
import { useOrders } from '../../TPV/context/OrderContext';
import { checkSystemReflex } from '../../../intelligence/nervous-system/IdleReflexEngine';
import { useReflexEngine } from '../core/ReflexEngine';
import { now as getNow } from '../../../intelligence/nervous-system/Clock';
import { supabase } from '../../../core/supabase';
import { calculateShiftLoad } from '../../../intelligence/nervous-system/ShiftEngine';
import type { ShiftMetrics } from '../../../intelligence/nervous-system/ShiftEngine';
import { TrainingProvider, useTraining } from '../../../intelligence/education/TrainingContext';
import { findRelevantLesson } from '../../../intelligence/education/MicroLessonEngine';
import { calculatePressure } from '../../../intelligence/forecast/PressureForecast';
import type { PressureMetrics } from '../../../intelligence/forecast/PressureForecast';
import { getShiftPrediction } from '../../../intelligence/forecast/ShiftPredictor';
import type { ShiftPrediction } from '../../../intelligence/forecast/ShiftPredictor';

// ...

// ------------------------------------------------------------------
// 🧠 MODELO MENTAL (The State Engine)
// ------------------------------------------------------------------


interface StaffContextType {
    // 1. IDENTITY & CONTRACT
    operationalContract: OperationalContract | null;
    activeWorkerId: string | null;
    activeRole: StaffRole;
    shiftState: 'offline' | 'active' | 'closing' | 'closed';
    activeShift: 'offline' | 'active' | 'closing' | 'closed'; // Alias for consumers

    // 2. STATE DERIVATION (The Brain)
    dominantTool: DominantTool;

    // 3. SETUP ACTIONS
    createLocalContract: (type: BusinessType) => void;
    joinRemoteOperation: (code: string) => Promise<{ success: boolean; message?: string }>;

    // 4. WORKER ACTIONS
    checkIn: (workerName: string) => void;
    checkOut: () => void;

    // 5. TASK ENGINE
    tasks: Task[];
    startTask: (taskId: string) => void;
    completeTask: (taskId: string) => void;
    unfocusTask: (taskId: string) => void;
    createTask: (args: {
        title: string;
        assigneeId: string | null;
        assigneeRole?: StaffRole;
        description?: string;
        priority?: 'background' | 'attention' | 'urgent' | 'critical';
        reason?: string;
        type?: 'foundational' | 'mission_critical';
    }) => void;
    currentRiskLevel: number;

    // 🧪 SIMULATION HOOKS (Internal Use Only)
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    setShiftState: React.Dispatch<React.SetStateAction<'offline' | 'active' | 'closing' | 'closed'>>;

    // 🔋 ENERGY SENSOR
    notifyActivity: () => void;
    lastActivityAt: number;

    // 🧠 METABOLIC INPUT (Inventory -> Brain)
    reportObligations: (source: string, obligations: LatentObligation[]) => void;

    // 🛡️ IMMUNE SYSTEM (Human Sensor -> Brain)
    reportSpecDrift: (alert: Omit<SpecDriftAlert, 'id' | 'detectedAt' | 'status'>) => void;
    specDrifts: SpecDriftAlert[]; // 🛡️ Telemetry for Owner Dashboard
    pressureMode: 'idle' | 'pressure' | 'recovery'; // 🩺 Real-time Pulse
    obligations: LatentObligation[]; // Added to satisfy ManagerCalendarView

    // 6. SHIFT INTELLIGENCE (Phase B)
    shiftStart: number | null;
    activeStaffCount: number;
    shiftMetrics: ShiftMetrics;

    // 7. FORECAST (Phase D)
    forecast: {
        pressure: PressureMetrics;
        prediction: ShiftPrediction;
    };

    // ROSTER
    employees: any[];
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

type StaffProviderProps = {
    children: React.ReactNode;
    restaurantId?: string | null;
    userId?: string | null;
};

// INTERNAL PROVIDER (Where logic lives)
const StaffProviderInternal: React.FC<StaffProviderProps> = ({ children, restaurantId, userId }) => {
    // EXTERNAL SIGNALS (The Senses)
    const { orders, performOrderAction } = useOrders(); // Requires OrderProvider to wrap StaffProvider
    const { triggerLesson, learnedSkills } = useTraining(); // Phase C: Training

    // 1. IDENTITY
    const [operationalContract, setOpContract] = useState<OperationalContract | null>(null);
    const [activeWorkerId, setActiveWorkerId] = useState<string | null>(userId || null);
    const [activeRole, setActiveRole] = useState<StaffRole>('worker');

    // 2. SHIFT STATE
    const [shiftState, setShiftState] = useState<'offline' | 'active' | 'closing' | 'closed'>('offline');
    const [lastActivityAt, setLastActivityAt] = useState<number>(getNow());

    // 3. TASK ENGINE (The Conscious Mind)
    const [tasks, setTasks] = useState<Task[]>([]);

    // 4. METABOLISM (Inventory -> Brain)
    const [obligations, setObligations] = useState<LatentObligation[]>([]);
    // const [dominantTool, setDominantTool] = useState<DominantTool>('hands'); // Derived

    // 5. IMMUNE SYSTEM (Spec Drift)
    const [specDrifts, setSpecDrifts] = useState<SpecDriftAlert[]>([]);
    const [pressureMode, setPressureMode] = useState<'idle' | 'pressure' | 'recovery'>('idle');

    // 6. ROSTER (For Assignee Selection)
    const [employees] = useState([
        { id: 'emp-1', name: 'João (Cozinha)', role: 'kitchen', status: 'active' },
        { id: 'emp-2', name: 'Maria (Salão)', role: 'waiter', status: 'active' },
        { id: 'emp-3', name: 'Carlos (Bar)', role: 'bar_manager', status: 'active' },
    ]);

    // INIT
    useEffect(() => {
        const storedRole = getTabIsolated('staff_role');
        if (storedRole) setActiveRole(storedRole as StaffRole);

        // Resume session if active
        // In real app, check Supabase presence
        if (userId) setShiftState('active'); // Auto-start for dev flow?
    }, [userId]);


    // SENSOR: Activity Heartbeat
    const notifyActivity = useCallback(() => {
        setLastActivityAt(getNow());
    }, []);

    // LOGIC: Dominant Tool Derivation
    const dominantTool = useMemo((): DominantTool => {
        if (shiftState === 'offline') return 'hands';
        if (activeRole === 'manager') return 'tablet';
        if (activeRole === 'kitchen') return 'knife';
        if (activeRole === 'waiter') return 'tray';
        return 'hands';
    }, [shiftState, activeRole]);

    // LOGIC: Risk Level Derivation
    const currentRiskLevel = useMemo(() => {
        if (shiftState !== 'active') return 0;
        const totalRisk = tasks.reduce((acc, t) => t.status === 'pending' ? acc + (t.riskLevel || 0) : acc, 0);
        return Math.min(100, totalRisk);
    }, [tasks, shiftState]);

    // SYSTEM REFLEX (The Subconscious)
    useReflexEngine(
        tasks,
        setTasks,
        operationalContract?.mode || 'local',
        shiftState,
        lastActivityAt,
        activeRole,
        obligations,
        orders,
        pressureMode // Pass current pressure mode
    );

    // TRAINING REFLEX (Phase C)
    // Watch for new tasks derived from orders and trigger menu-contextual lessons
    useEffect(() => {
        if (!orders || orders.length === 0) return;

        // Find recent KDS tasks
        const recentTasks = tasks.filter(t =>
            t.meta?.source === 'kds-sync' &&
            t.status === 'pending' &&
            // Simple check: created in last 10 seconds (in real logic we'd mark 'trainingChecked')
            (getNow() - new Date(t.createdAt).getTime() < 10000)
        );

        recentTasks.forEach(task => {
            const orderId = task.meta?.orderId;
            if (!orderId) return;

            const order = orders.find(o => o.id === orderId);
            if (!order || !order.items) return;

            // Check items for lessons
            order.items.forEach((item: any) => {
                const lesson = findRelevantLesson('menu_item', item.name_snapshot || item.name, activeRole, learnedSkills);
                if (lesson) {
                    // Check if not already triggering
                    triggerLesson(lesson);
                }
            });
        });
    }, [tasks.length, activeRole, learnedSkills, triggerLesson]);
    // Dependency on tasks.length is a simple heuristic to re-check when tasks arrive.

    // ACTIONS
    const createLocalContract = (type: BusinessType) => {
        const id = `local-${type}-${Date.now()}`;
        setOpContract({
            id,
            type,
            name: `${type === 'restaurant' ? 'Restaurante' : 'Loja'} Local`,
            mode: 'local',
            permissions: ['admin'] // Local creator is admin
        });
        setActiveRole('manager'); // Creator is manager
        setShiftState('active');
        notifyActivity();
    };

    const joinRemoteOperation = async (code: string) => {
        return joinRemoteOperationHelper(code, setOpContract, setActiveRole);
    };

    const checkIn = (workerName: string) => {
        setActiveWorkerId(workerName);
        setShiftState('active');
        notifyActivity();
    };

    const checkOut = () => {
        setShiftState('closed');
        setActiveWorkerId(null);
        setOpContract(null);
    };

    const startTask = (taskId: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'focused' } : t));
        notifyActivity();
    };

    const completeTask = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);

        // 🌉 KDS BRIDGE: If task is a KDS sync, trigger the action
        if (task?.meta?.source === 'kds-sync' && task.meta.orderId && task.meta.action) {
            console.log(`🌉 BRIDGE: Triggering Action ${task.meta.action} for Order ${task.meta.orderId}`);
            performOrderAction(task.meta.orderId, task.meta.action)
                .then(() => console.log('✅ BRIDGE: Action Success'))
                .catch(err => {
                    console.error('❌ BRIDGE: Action Failed', err);
                    alert('Falha ao sincronizar com KDS. Tente novamente.');
                    // Revert optimistic update?
                    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending' } : t));
                    return; // Stop completion
                });
        }

        // Optimistic
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'done' } : t));

        const completedCount = tasks.filter(t => t.status === 'done').length + 1;

        let message = completedCount === 1
            ? '✅ Tarefa concluída!'
            : `✅ ${completedCount} tarefas hoje! Ótimo trabalho!`;

        if (operationalContract?.mode === 'local') {
            message = '⚠️ Preview: Ação não salva no servidor';
        }

        window.dispatchEvent(new CustomEvent('staff-task-complete', {
            detail: { message, taskTitle: task?.title }
        }));
        notifyActivity();

        // Supabase
        if (!taskId.startsWith('temp') && !taskId.startsWith('init')) {
            supabase.from('app_tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', taskId).then();
        }
    };

    const unfocusTask = (taskId: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending' } : t));
    };

    const createTask = (args: Parameters<StaffContextType['createTask']>[0]) => {
        const newTask: Task = {
            id: `manual-${Date.now()}`,
            title: args.title,
            description: args.description || '',
            status: 'pending',
            assigneeRole: args.assigneeRole || 'worker', // Default to generic worker
            priority: args.priority || 'attention',
            type: args.type || 'foundational',
            riskLevel: 10,
            uiMode: 'check',
            context: 'floor', // Default context
            createdAt: getNow(),
            meta: { source: 'manual-assignment', createdBy: activeWorkerId }
        };

        setTasks(prev => [newTask, ...prev]);
        notifyActivity();

        // Persist Manual Task
        if (operationalContract?.id) {
            supabase.from('app_tasks').insert({
                id: newTask.id,
                restaurant_id: operationalContract.id,
                title: newTask.title,
                description: newTask.description,
                status: 'pending',
                priority: newTask.priority,
                type: newTask.type,
                assignee_role: newTask.assigneeRole,
                assignee_id: newTask.meta?.assigneeId,
                created_by: newTask.meta?.createdBy,
                created_at: new Date(newTask.createdAt).toISOString()
            }).then(({ error }) => {
                if (error) console.error('Manual Task Insert Failed:', error);
            });
        }
    };

    const reportObligations = (source: string, newObligations: LatentObligation[]) => {
        // Simple merge for now, avoiding duplicates by ID
        setObligations(prev => {
            const others = prev.filter(o => !newObligations.some(n => n.id === o.id));
            return [...others, ...newObligations];
        });
    };

    const reportSpecDrift = (alert: Omit<SpecDriftAlert, 'id' | 'detectedAt' | 'status'>) => {
        const newAlert: SpecDriftAlert = {
            id: `drift-${Date.now()}`,
            ...alert,
            detectedAt: getNow(),
            status: 'active'
        };
        setSpecDrifts(prev => [newAlert, ...prev]);
        notifyActivity();
    };


    return (
        <StaffContext.Provider value={{
            operationalContract,
            activeWorkerId,
            activeRole,
            shiftState,
            activeShift: shiftState, // Alias
            dominantTool,
            tasks,
            employees, // Expose Roster
            createTask, // Expose Creation
            createLocalContract,
            checkIn,
            checkOut,
            startTask,
            completeTask,
            unfocusTask,
            currentRiskLevel,
            setTasks,
            setShiftState,
            notifyActivity,
            lastActivityAt,
            reportObligations,
            reportSpecDrift,
            specDrifts,
            pressureMode,
            joinRemoteOperation,
            obligations,

            // PHASE B: Shift Intelligence
            shiftStart: activeWorkerId ? lastActivityAt : null,
            activeStaffCount: 1,
            shiftMetrics: calculateShiftLoad(tasks.filter(t => t.status !== 'done').length, 1),

            // PHASE D: Forecast
            forecast: {
                pressure: calculatePressure(
                    orders?.filter(o => (getNow() - new Date(o.created_at).getTime()) < 15 * 60 * 1000).length || 0, // Last 15 min
                    1, // Staff (Hardcoded 1 for now)
                    10 // Avg Prep (Hardcoded 10 min)
                ),
                prediction: getShiftPrediction(new Date(getNow()))
            }

        }}>
            {children}
        </StaffContext.Provider>
    );
};

// EXPORTED PROVIDER (WRAPPER)
export const StaffProvider: React.FC<StaffProviderProps> = (props) => {
    return (
        <TrainingProvider>
            <StaffProviderInternal {...props} />
        </TrainingProvider>
    );
};

export const useStaff = () => {
    const context = useContext(StaffContext);
    if (!context) throw new Error('useStaff must be used within StaffProvider');
    return context;
};
