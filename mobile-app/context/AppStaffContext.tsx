import { PersistenceService } from '@/services/persistence';
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type OperationType = 'street_vendor' | 'restaurant' | 'hotel';
export type Maturity = 'starter' | 'growing' | 'professional';
export type StaffRole =
    | 'ambulante'   // Street vendor - solo operator
    | 'waiter'      // Table service
    | 'bartender'   // Bar service
    | 'cook'        // Kitchen line cook
    | 'cleaning'    // Cleaning staff
    | 'manager'     // Floor manager
    | 'chef'        // Kitchen manager
    | 'owner';      // Business owner

export type ShiftState = 'offline' | 'active' | 'closing' | 'closed';

export interface Task {
    id: string;
    title: string;
    priority: 'background' | 'attention' | 'urgent' | 'critical';
    status: 'pending' | 'in_progress' | 'done';
    assignedRoles: StaffRole[];
    category: string;
    createdAt: number;
}

export interface OperationalContext {
    operationType: OperationType;
    maturity: Maturity;
    businessName: string;
    businessId: string;
}

// ============================================================================
// ROLE PERMISSIONS MAP (Declarative)
// ============================================================================

export interface RoleConfig {
    label: string;
    emoji: string;
    // permissions: string[]; // REMOVED: Now handled by ContextPolicy
    defaultView: string;
    taskCategories: string[];
    showGamification: boolean;
    showMetrics: boolean;
}

import { getContextPermissions, Permission } from './ContextPolicy';

export type { Permission }; // Exporting for consumers

export const ROLE_PERMISSIONS_MAP: Record<StaffRole, RoleConfig> = {


    ambulante: {
        label: 'Ambulante',
        emoji: '🛒',
        defaultView: 'simple_shift',
        taskCategories: ['basic', 'sales'],
        showGamification: false,
        showMetrics: false,
    },
    waiter: {
        label: 'Garçom',
        emoji: '🍽️',
        defaultView: 'task_stream',
        taskCategories: ['table_service', 'customer', 'delivery'],
        showGamification: true,
        showMetrics: false,
    },
    bartender: {
        label: 'Barman',
        emoji: '🍹',
        defaultView: 'bar_queue',
        taskCategories: ['bar', 'drinks', 'prep'],
        showGamification: true,
        showMetrics: false,
    },
    cook: {
        label: 'Cozinheiro',
        emoji: '👨‍🍳',
        defaultView: 'kitchen_queue',
        taskCategories: ['kitchen', 'prep', 'urgent'],
        showGamification: true,
        showMetrics: false,
    },
    cleaning: {
        label: 'Limpeza',
        emoji: '🧹',
        defaultView: 'checklist',
        taskCategories: ['cleaning', 'maintenance', 'routine'],
        showGamification: false,
        showMetrics: false,
    },
    manager: {
        label: 'Gerente',
        emoji: '🧑‍💼',
        defaultView: 'floor_overview',
        taskCategories: ['all'],
        showGamification: false,
        showMetrics: true,
    },
    chef: {
        label: 'Chef',
        emoji: '👨‍🍳',
        defaultView: 'kitchen_command',
        taskCategories: ['kitchen', 'quality', 'coordination'],
        showGamification: false,
        showMetrics: true,
    },
    owner: {
        label: 'Proprietário',
        emoji: '👑',
        defaultView: 'executive_dashboard',
        taskCategories: [], // No operational tasks
        showGamification: false,
        showMetrics: true,
    },
};

// ============================================================================
// MOCK TASKS BY CATEGORY
// ============================================================================

const MOCK_TASKS: Task[] = [
    // Table Service
    { id: 't1', title: 'Verificar mesa 5', priority: 'attention', status: 'pending', assignedRoles: ['waiter', 'manager'], category: 'table_service', createdAt: Date.now() },
    { id: 't2', title: 'Levar pedido mesa 3', priority: 'urgent', status: 'pending', assignedRoles: ['waiter'], category: 'delivery', createdAt: Date.now() },
    { id: 't3', title: 'Limpar mesa 7', priority: 'background', status: 'pending', assignedRoles: ['waiter', 'cleaning'], category: 'table_service', createdAt: Date.now() },

    // Kitchen
    { id: 't4', title: 'Preparar Risotto especial', priority: 'critical', status: 'pending', assignedRoles: ['cook', 'chef'], category: 'kitchen', createdAt: Date.now() },
    { id: 't5', title: 'Mise en place - legumes', priority: 'attention', status: 'pending', assignedRoles: ['cook'], category: 'prep', createdAt: Date.now() },
    { id: 't6', title: 'Verificar temperatura frigorífico', priority: 'background', status: 'pending', assignedRoles: ['cook', 'chef'], category: 'quality', createdAt: Date.now() },

    // Bar
    { id: 't7', title: 'Cocktail Mesa 12', priority: 'urgent', status: 'pending', assignedRoles: ['bartender'], category: 'bar', createdAt: Date.now() },
    { id: 't8', title: 'Reabastecer gelo', priority: 'attention', status: 'pending', assignedRoles: ['bartender'], category: 'prep', createdAt: Date.now() },

    // Cleaning
    { id: 't9', title: 'Limpar WC - rotina 14h', priority: 'attention', status: 'pending', assignedRoles: ['cleaning'], category: 'cleaning', createdAt: Date.now() },
    { id: 't10', title: 'Varrer entrada', priority: 'background', status: 'pending', assignedRoles: ['cleaning'], category: 'routine', createdAt: Date.now() },

    // Management
    { id: 't11', title: 'Resolver reclamação mesa 8', priority: 'critical', status: 'pending', assignedRoles: ['manager', 'owner'], category: 'customer', createdAt: Date.now() },
    { id: 't12', title: 'Ajustar horários próxima semana', priority: 'background', status: 'pending', assignedRoles: ['manager', 'owner'], category: 'coordination', createdAt: Date.now() },

    // Ambulante
    { id: 't13', title: 'Preparar carrinho', priority: 'attention', status: 'pending', assignedRoles: ['ambulante'], category: 'basic', createdAt: Date.now() },
    { id: 't14', title: 'Verificar stock', priority: 'background', status: 'pending', assignedRoles: ['ambulante'], category: 'sales', createdAt: Date.now() },
];

// ============================================================================
// CONTEXT TYPE
// ============================================================================

export interface AppStaffContextType {
    // Operational Context
    operationalContext: OperationalContext;
    setOperationalContext: (ctx: Partial<OperationalContext>) => void;

    // Role Engine
    activeRole: StaffRole;
    setActiveRole: (role: StaffRole) => void;
    roleConfig: RoleConfig;

    // Shift Engine
    shiftState: ShiftState;
    shiftStart: number | null;
    startShift: () => void;
    endShift: () => void;
    resetShift: () => void;

    // Task Engine
    tasks: Task[];
    completeTask: (taskId: string) => void;

    // Access Control
    canAccess: (permission: string) => boolean;

    // Dev Tools
    allRoles: StaffRole[];
    allOperationTypes: OperationType[];
    allMaturities: Maturity[];
}

// ============================================================================
// ALL OPTIONS (for Dev Panel)
// ============================================================================

const ALL_ROLES: StaffRole[] = ['ambulante', 'waiter', 'bartender', 'cook', 'cleaning', 'manager', 'chef', 'owner'];
const ALL_OPERATION_TYPES: OperationType[] = ['street_vendor', 'restaurant', 'hotel'];
const ALL_MATURITIES: Maturity[] = ['starter', 'growing', 'professional'];

// ============================================================================
// CONTEXT
// ============================================================================

const AppStaffContext = createContext<AppStaffContextType | undefined>(undefined);

export function AppStaffProvider({ children }: { children: React.ReactNode }) {
    // Operational context
    const [operationalContext, setOperationalContextState] = useState<OperationalContext>({
        operationType: 'restaurant',
        maturity: 'professional',
        businessName: 'Sofia Gastrobar',
        businessId: 'sofia-gastrobar-001'
    });

    // Role
    const [activeRole, setActiveRoleState] = useState<StaffRole>('waiter');

    // Shift state
    const [shiftState, setShiftState] = useState<ShiftState>('offline');
    const [shiftStart, setShiftStart] = useState<number | null>(null);

    // Tasks
    const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
    const [isLoaded, setIsLoaded] = useState(false);

    // Role config - derived from role
    const roleConfig = useMemo(() => ROLE_PERMISSIONS_MAP[activeRole], [activeRole]);

    // --- Persistence Logic ---

    useEffect(() => {
        const load = async () => {
            const data = await PersistenceService.loadAppStaff();
            if (data) {
                if (data.activeRole) setActiveRoleState(data.activeRole);
                if (data.shiftState) setShiftState(data.shiftState);
                if (data.shiftStart) setShiftStart(data.shiftStart);
                if (data.operationalContext) setOperationalContextState(data.operationalContext);
            }
            setIsLoaded(true);
        };
        load();
    }, []);

    useEffect(() => {
        if (isLoaded) {
            PersistenceService.saveAppStaff({
                activeRole,
                shiftState,
                shiftStart,
                operationalContext
            });
        }
    }, [activeRole, shiftState, shiftStart, operationalContext, isLoaded]);

    // Setters with side effects
    const setOperationalContext = useCallback((partial: Partial<OperationalContext>) => {
        if (shiftState === 'active') {
            console.warn('[AppStaff] Cannot change operational context during active shift');
            return;
        }
        setOperationalContextState(prev => ({ ...prev, ...partial }));
    }, [shiftState]);

    const setActiveRole = useCallback((role: StaffRole) => {
        if (shiftState === 'active') {
            console.warn('[AppStaff] Cannot change role during active shift');
            return;
        }
        setActiveRoleState(role);
        // Reset shift when role changes
        setShiftState('offline');
        setShiftStart(null);
        console.log(`[AppStaff] Role changed to: ${role}`);
    }, [shiftState]);

    const startShift = useCallback(() => {
        setShiftState('active');
        setShiftStart(Date.now());
        console.log(`[AppStaff] Shift started for role: ${activeRole}`);
    }, [activeRole]);

    const endShift = useCallback(() => {
        setShiftState('closed');
        setShiftStart(null);
        console.log('[AppStaff] Shift ended');
    }, []);

    const resetShift = useCallback(() => {
        setShiftState('offline');
        setShiftStart(null);
        setTasks(MOCK_TASKS.map(t => ({ ...t, status: 'pending' as const })));
        console.log('[AppStaff] Shift reset');
    }, []);

    const completeTask = useCallback((taskId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: 'done' as const } : t
        ));
        console.log(`[AppStaff] Task ${taskId} completed`);
    }, []);

    const canAccess = useCallback((permission: Permission | string): boolean => {
        // Allow string for flexibility, but prefer Permission type
        const allowedPermissions = getContextPermissions(activeRole, operationalContext.maturity);

        // Super-admin override for Owner
        if (activeRole === 'owner') return true;

        // Check if permission is in allowed list
        return allowedPermissions.includes(permission as Permission);
    }, [activeRole, operationalContext.maturity]);

    // Filter tasks by role
    const roleTasks = useMemo(() => {
        const config = ROLE_PERMISSIONS_MAP[activeRole];

        // Owner sees no operational tasks
        if (activeRole === 'owner') return [];

        // Manager sees all tasks
        if (config.taskCategories.includes('all')) return tasks;

        // Others see only their assigned tasks
        return tasks.filter(t =>
            t.assignedRoles.includes(activeRole) ||
            config.taskCategories.includes(t.category)
        );
    }, [tasks, activeRole]);

    return (
        <AppStaffContext.Provider value={{
            operationalContext,
            setOperationalContext,
            activeRole,
            setActiveRole,
            roleConfig,
            shiftState,
            shiftStart,
            startShift,
            endShift,
            resetShift,
            tasks: roleTasks,
            completeTask,
            canAccess,
            allRoles: ALL_ROLES,
            allOperationTypes: ALL_OPERATION_TYPES,
            allMaturities: ALL_MATURITIES,
        }}>
            {children}
        </AppStaffContext.Provider>
    );
}

export function useAppStaff() {
    const context = useContext(AppStaffContext);
    if (!context) {
        throw new Error('useAppStaff must be used within an AppStaffProvider');
    }
    return context;
}

// ============================================================================
// ROLE GATE COMPONENT
// ============================================================================

interface RoleGateProps {
    allowed: StaffRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RoleGate({ allowed, children, fallback = null }: RoleGateProps) {
    const { activeRole } = useAppStaff();

    // Owner always has access
    if (activeRole === 'owner' || allowed.includes(activeRole)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}

// ============================================================================
// PERMISSION GATE COMPONENT
// ============================================================================

interface PermissionGateProps {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
    const { canAccess } = useAppStaff();

    if (canAccess(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
