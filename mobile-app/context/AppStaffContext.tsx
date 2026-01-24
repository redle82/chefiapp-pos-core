import { PersistenceService } from '@/services/persistence';
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '@/services/supabase';
import { AuditLogService } from '@/services/AuditLogService';

// ============================================================================
// TYPES
// ============================================================================

export type OperationType = 'street_vendor' | 'restaurant' | 'hotel';
export type Maturity = 'starter' | 'growing' | 'professional';
export type StaffRole =
    | 'ambulante'   // Legacy: Street vendor
    | 'vendor'      // Street vendor (New standard)
    | 'waiter'      // Table service
    | 'bartender'   // Bar service
    | 'cook'        // Kitchen line cook
    | 'cleaning'    // Cleaning staff
    | 'manager'     // Floor manager
    | 'chef'        // Kitchen manager
    | 'owner'       // Business owner
    | 'supervisor'  // Shift leader
    | 'cashier'     // POS operator
    | 'delivery'    // Driver
    | 'admin';      // System operator


export type ShiftState = 'offline' | 'active' | 'closing' | 'closed';
export type FinancialState = 'drawer_closed' | 'drawer_open' | 'drawer_counting'; // Phase 35

export interface Station {
    id: string;
    name: string;
}

export interface MenuCategoryLink {
    id: string; // Category ID (e.g., 'drink', 'food', or UUID)
    station_id: string | null;
}


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
    vendor: {
        label: 'Vendedor',
        emoji: '🏪',
        defaultView: 'simple_shift',
        taskCategories: ['basic', 'sales'],
        showGamification: false,
        showMetrics: true, // Vendors care about sales
    },
    waiter: {
        label: 'Garçom',
        emoji: '🍽️',
        defaultView: 'task_stream',
        taskCategories: ['table_service', 'customer', 'delivery'],
        showGamification: true, // FASE 4: Habilitar gamificação
        showMetrics: false,
    },
    bartender: {
        label: 'Barman',
        emoji: '🍹',
        defaultView: 'bar_queue',
        taskCategories: ['bar', 'drinks', 'prep'],
        showGamification: true, // FASE 4: Habilitar gamificação
        showMetrics: false,
    },
    cook: {
        label: 'Cozinheiro',
        emoji: '👨‍🍳',
        defaultView: 'kitchen_queue',
        taskCategories: ['kitchen', 'prep', 'urgent'],
        showGamification: true, // FASE 4: Habilitar gamificação
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
    supervisor: {
        label: 'Líder',
        emoji: '👮',
        defaultView: 'task_stream',
        taskCategories: ['all', 'resolution'],
        showGamification: true,
        showMetrics: true,
    },
    cashier: {
        label: 'Caixa',
        emoji: '💸',
        defaultView: 'orders',
        taskCategories: ['sales', 'payments'],
        showGamification: true, // FASE 4: Habilitar gamificação
        showMetrics: true,
    },
    delivery: {
        label: 'Entregador',
        emoji: '🛵',
        defaultView: 'orders',
        taskCategories: ['delivery', 'logistics'],
        showGamification: true, // Gamify delivery speed
        showMetrics: false,
    },
    admin: {
        label: 'Admin',
        emoji: '💻',
        defaultView: 'manager',
        taskCategories: ['admin', 'config'],
        showGamification: false,
        showMetrics: true,
    },
    manager: {
        label: 'Gerente',
        emoji: '🧑‍💼',
        defaultView: 'floor_overview',
        taskCategories: ['all'],
        showGamification: true, // FASE 4: Habilitar gamificação
        showMetrics: true,
    },
    chef: {
        label: 'Chef',
        emoji: '👨‍🍳',
        defaultView: 'kitchen_command',
        taskCategories: ['kitchen', 'quality', 'coordination'],
        showGamification: true, // FASE 4: Habilitar gamificação
        showMetrics: true,
    },
    owner: {
        label: 'Proprietário',
        emoji: '👑',
        defaultView: 'executive_dashboard',
        taskCategories: [], // No operational tasks
        showGamification: true, // FASE 4: Habilitar gamificação
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
    // Bug #9 Fix: Estados explícitos
    appState: 'loading' | 'ready' | 'error';
    errorMessage: string | null;
    retryLoad: () => void;

    // Operational Context
    operationalContext: OperationalContext;
    setOperationalContext: (ctx: Partial<OperationalContext>) => void;

    // Role Engine
    activeRole: StaffRole;
    setActiveRole: (role: StaffRole) => void;
    roleConfig: RoleConfig;

    // User Identity
    userName: string;

    // Shift Engine
    shiftState: ShiftState;
    shiftStart: number | null;
    shiftId: string | null;
    startShift: (openingFloat?: number) => Promise<void>;
    endShift: (totalRevenue: number, closingCash?: number) => Promise<void>;
    resetShift: () => void;
    currentShift: any; // Using any for now to avoid circular deps or complex typing issues quickly

    // Task Engine
    tasks: Task[];
    completeTask: (taskId: string) => void;
    updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => Promise<void>;
    addTask: (title: string, priority: 'urgent' | 'normal', roles: StaffRole[]) => Promise<void>;
    createTask: (title: string, role: StaffRole, priority?: Task['priority']) => void;

    // Financial Engine (Phase 35)
    financialState: FinancialState;
    financialSessionId: string | null;
    openFinancialSession: (openingFloat: number) => Promise<void>;
    closeFinancialSession: (closingCash: number, notes?: string) => Promise<void>;

    // Quality Engine (IQO) - Silent
    recordQualityEvent: (type: string, scoreImpact: number, metadata?: any) => Promise<void>;

    // Access Control
    canAccess: (permission: string) => boolean;

    // Dev Tools
    allRoles: StaffRole[];
    allOperationTypes: OperationType[];
    allMaturities: Maturity[];

    // KDS Smart Routing (Phase 2.2)
    stations: Station[];
    getStationForCategory: (categoryId: string) => Station | null;
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

// Bug #9 Fix: Estados explícitos para nunca quebrar ao recarregar
type AppState = 'loading' | 'ready' | 'error';

export function AppStaffProvider({ children }: { children: React.ReactNode }) {
    // Bug #9 Fix: Estado explícito
    const [appState, setAppState] = useState<AppState>('loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Operational context
    const [operationalContext, setOperationalContextState] = useState<OperationalContext>({
        operationType: 'restaurant',
        maturity: 'professional',
        businessName: 'Sofia Gastrobar',
        businessId: 'sofia-gastrobar-001'
    });

    // Role
    // Role - SECURITY FIX: Default to least privilege
    const [activeRole, setActiveRoleState] = useState<StaffRole>('waiter');

    // Shift state
    const [shiftState, setShiftState] = useState<ShiftState>('offline');
    const [shiftStart, setShiftStart] = useState<number | null>(null);
    const [shiftId, setShiftId] = useState<string | null>(null);
    const [currentShift, setCurrentShift] = useState<any>(null);

    // Financial State (Phase 35)
    const [financialState, setFinancialState] = useState<FinancialState>('drawer_closed');
    const [financialSessionId, setFinancialSessionId] = useState<string | null>(null);

    // Tasks
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // KDS Smart Routing (Phase 2.2)
    const [stations, setStations] = useState<Station[]>([]);
    const [categoryLinks, setCategoryLinks] = useState<MenuCategoryLink[]>([]);


    // Role config - derived from role
    const roleConfig = useMemo(() => ROLE_PERMISSIONS_MAP[activeRole], [activeRole]);

    // --- Persistence Logic ---

    // User Identity
    const [userName, setUserName] = useState<string>('Staff');

    // --- Cloud Sync Logic ---
    // Bug #9 Fix: Função de retry
    const retryLoad = () => {
        setAppState('loading');
        setErrorMessage(null);
        // Recarregar será feito pelo useEffect
    };

    // Declarar fetchTasks antes do useEffect que o usa
    const fetchTasks = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('gm_tasks')
                .select('*')
                .neq('status', 'done') // Only active tasks? Or last 24h?
                .order('created_at', { ascending: false });

            if (data) {
                const formatted: Task[] = data.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    priority: t.priority as any,
                    status: t.status as any,
                    assignedRoles: t.assigned_roles || [],
                    category: t.category,
                    createdAt: new Date(t.created_at).getTime()
                }));
                setTasks(formatted);
            }
        } catch (e) {
            console.error("Fetch tasks error", e);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                setAppState('loading');
                setErrorMessage(null);

                // 0. Load User Identity
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.user_metadata?.full_name) {
                    setUserName(user.user_metadata.full_name);
                }
                // SECURITY FIX: Derive role from Auth Metadata
                if (user?.user_metadata?.role) {
                    setActiveRoleState(user.user_metadata.role);
                }

                // 1. Load Local Persistence
                const data = await PersistenceService.loadAppStaff();

                if (data) {
                    // if (data.activeRole) setActiveRoleState(data.activeRole); // SECURITY FIX: Do not trust local storage for role
                    if (data.shiftState) setShiftState(data.shiftState);
                    if (data.shiftStart) setShiftStart(data.shiftStart);
                    if (data.financialState) setFinancialState(data.financialState);
                    if (data.financialSessionId) setFinancialSessionId(data.financialSessionId);
                    if (data.operationalContext) setOperationalContextState(data.operationalContext);
                }

                // 2. Load Cloud Identity (Restaurant) - CRÍTICO
                try {
                    // Fetch first restaurant available (Single Tenant assumption for now)
                    const { data: restData, error: restError } = await supabase
                        .from('gm_restaurants')
                        .select('id, name')
                        .limit(1)
                        .single();

                    if (restError) throw restError;

                    if (restData) {
                        setOperationalContextState(prev => ({
                            ...prev,
                            businessName: restData.name,
                            businessId: restData.id // Real UUID
                        }));
                    } else {
                        // FALLBACK: Usar dados locais
                        console.warn('[AppStaff] No restaurant found, using fallback');
                        setOperationalContextState(prev => ({
                            ...prev,
                            businessId: prev.businessId || 'fallback-restaurant-id',
                            businessName: prev.businessName || 'Restaurante'
                        }));
                    }
                } catch (e) {
                    console.error('[AppStaff] Error loading restaurant:', e);
                    // FALLBACK: Usar dados locais
                    setOperationalContextState(prev => ({
                        ...prev,
                        businessId: prev.businessId || 'fallback-restaurant-id',
                        businessName: prev.businessName || 'Restaurante'
                    }));
                }

                // 3. Load Cloud Tasks
                await fetchTasks();

                // 4. Load Stations & Categories (Phase 2.2)
                try {
                    // Fetch Stations
                    const { data: stationsData } = await supabase
                        .from('gm_stations')
                        .select('id, name');
                    if (stationsData) setStations(stationsData);

                    // Fetch Categories (with station_id)
                    // Note: We might be using hardcoded categories like 'drink' in older code.
                    // We should fetch from actual table. If category is 'drink' string, we might map it.
                    const { data: catData } = await supabase
                        .from('gm_menu_categories')
                        .select('id, station_id'); // Assuming 'id' matches the category string used in OrderItem

                    if (catData) {
                        setCategoryLinks(catData.map(c => ({ id: c.id, station_id: c.station_id })));
                    } else {
                        // Fallback if no DB categories yet?
                        // We rely on migration.
                    }

                } catch (e) {
                    console.warn("Failed to load KDS routing data", e);
                }

                // Bug #9 Fix: Só marca como ready se businessId existe e é válido
                // Verificar businessId após todas as operações
                const finalBusinessId = operationalContext.businessId;
                const isValidBusinessId = finalBusinessId &&
                    (finalBusinessId !== 'fallback-restaurant-id') &&
                    (finalBusinessId.length > 10); // UUID ou ID válido

                if (isValidBusinessId) {
                    setAppState('ready');
                } else {
                    // Se não conseguiu carregar businessId real, fica em error
                    setAppState('error');
                    setErrorMessage('Não foi possível carregar dados do restaurante. Tente novamente.');
                }
                setIsLoaded(true);
            } catch (error) {
                console.error('[AppStaff] Critical error loading context:', error);
                // Bug #9 Fix: Estado de erro explícito
                setAppState('error');
                setErrorMessage('Erro ao carregar contexto. Tente recarregar o app.');
                // Garantir que sempre temos um estado válido (fallback)
                setOperationalContextState(prev => ({
                    ...prev,
                    businessId: prev.businessId || 'fallback-restaurant-id',
                    businessName: prev.businessName || 'Restaurante'
                }));
                setIsLoaded(true);
            }
        };
        load();

        // Realtime Subscription
        const channel = supabase.channel('public:gm_tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gm_tasks' }, () => {
                fetchTasks();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchTasks]);

    useEffect(() => {
        if (isLoaded) {
            PersistenceService.saveAppStaff({
                // activeRole, // SECURITY FIX: Do not persist role. Always reset.
                shiftState,
                shiftStart,
                financialState,
                financialSessionId,
                operationalContext
            });
            PersistenceService.saveTasks(tasks);
        }
    }, [activeRole, shiftState, shiftStart, financialState, financialSessionId, operationalContext, tasks, isLoaded]);

    // Setters with side effects
    const setOperationalContext = useCallback((partial: Partial<OperationalContext>) => {
        if (shiftState === 'active') {
            console.warn('[AppStaff] Cannot change operational context during active shift');
            return;
        }
        setOperationalContextState(prev => ({ ...prev, ...partial }));
    }, [shiftState]);

    const setActiveRole = useCallback((role: StaffRole) => {
        // SECURITY FIX: Disable manual role switching in Production
        if (!__DEV__) {
            console.warn('[AppStaff] Role switching is disabled in production');
            return;
        }

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

    const startShift = useCallback(async () => {
        // Phase 35: startShift is now START OPERATIONAL SHIFT (Attendance only)
        // openingFloat arg is deprecated/ignored here. Use openFinancialSession for that.
        try {
            // 1. Get User & Restaurant
            const { data: { user } } = await supabase.auth.getUser();
            const restaurantId = operationalContext.businessId;
            const validRestaurantId = /^[0-9a-fA-F-]{36}$/.test(restaurantId) ? restaurantId : null;

            if (!user) {
                console.warn('[AppStaff] Cannot start real shift without Auth');
                setShiftState('active');
                setShiftStart(Date.now());
                return;
            }

            // 2. Insert into DB (gm_shifts)
            const { data, error } = await supabase
                .from('gm_shifts')
                .insert({
                    user_id: user.id,
                    restaurant_id: validRestaurantId,
                    status: 'open',
                    started_at: new Date().toISOString(),
                    opening_float: 0, // No longer responsible for cash
                })
                .select()
                .single();

            if (error) throw error;

            console.log(`[AppStaff] Operational Shift started: ${data.id}`);
            setShiftId(data.id);
            setShiftState('active');
            setShiftStart(Date.now());

        } catch (e) {
            console.error('[AppStaff] Failed to start shift', e);
            if (__DEV__) {
                setShiftState('active');
                setShiftStart(Date.now());
            }
        }
    }, [operationalContext.businessId]);

    // Bug #12 Fix: Wrapper com permissão para ações críticas
    const openFinancialSession = useCallback(async (openingFloat: number) => {
        // Bug #12 Fix: Validação de permissão SEMPRE antes de executar
        if (!canAccess('cash:handle')) {
            Alert.alert('Sem Permissão', 'Você não tem permissão para abrir o caixa.');
            return;
        }

        try {
            // 1. Validation
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const restaurantId = operationalContext.businessId;
            const validRestaurantId = /^[0-9a-fA-F-]{36}$/.test(restaurantId) ? restaurantId : null;

            // 2. Insert into gm_financial_sessions
            const { data, error } = await supabase
                .from('gm_financial_sessions')
                .insert({
                    user_id: user.id,
                    restaurant_id: validRestaurantId,
                    started_at: new Date().toISOString(),
                    starting_float: Math.round(openingFloat * 100),
                    status: 'open'
                })
                .select()
                .single();

            if (error) throw error;

            console.log(`[AppStaff] Financial Session Opened: ${data.id}`);
            setFinancialSessionId(data.id);
            setFinancialState('drawer_open');

            // Bug #13 Fix: Log de auditoria para abertura de caixa
            if (user?.id && validRestaurantId) {
                await AuditLogService.logOpenCashDrawer(
                    user.id,
                    validRestaurantId,
                    openingFloat,
                    shiftId || undefined
                );
            }

        } catch (e) {
            console.error('[AppStaff] Failed to open financial session', e);
            // Fallback for dev?
            setFinancialState('drawer_open');
        }
    }, [operationalContext.businessId]);

    const closeFinancialSession = useCallback(async (closingCash: number, notes?: string) => {
        // Bug #12 Fix: Validação de permissão SEMPRE antes de executar
        if (!canAccess('cash:handle')) {
            Alert.alert('Sem Permissão', 'Você não tem permissão para fechar o caixa.');
            return;
        }

        if (!financialSessionId) return;

        try {
            const updatePayload = {
                closed_at: new Date().toISOString(),
                closing_cash_actual: Math.round(closingCash * 100),
                status: 'closed',
                notes
            };

            const { error } = await supabase
                .from('gm_financial_sessions')
                .update(updatePayload)
                .eq('id', financialSessionId);

            if (error) throw error;

            console.log(`[AppStaff] Financial Session Closed`);

            // Bug #13 Fix: Log de auditoria para fechamento de caixa
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
                // Calcular diferença (simplificado - idealmente buscar valor esperado)
                const expectedCash = 0; // TODO: Calcular baseado em vendas + fundo inicial
                const difference = closingCash - expectedCash;

                await AuditLogService.logCloseCashDrawer(
                    user.id,
                    operationalContext.businessId,
                    closingCash,
                    expectedCash,
                    difference,
                    shiftId || undefined
                );
            }

            setFinancialSessionId(null);
            setFinancialState('drawer_closed');

        } catch (e) {
            console.error('[AppStaff] Failed to close financial session', e);
            setFinancialSessionId(null);
            setFinancialState('drawer_closed');
        }
    }, [financialSessionId]);

    const endShift = useCallback(async (totalRevenue: number, closingCash: number = 0) => {
        // Bug #12 Fix: Validação de permissão SEMPRE antes de executar
        if (!canAccess('shift:end')) {
            Alert.alert('Sem Permissão', 'Você não tem permissão para encerrar o turno.');
            return;
        }

        try {
            if (shiftId) {
                const updatePayload: any = {
                    status: 'closed',
                    ended_at: new Date().toISOString(),
                    xp_gained: 0, // Legacy field, keeping for revenue tracking
                    cash_end: Math.round(totalRevenue * 100), // Legacy field, keeping for revenue tracking
                    closing_cash_actual: Math.round(closingCash * 100) // New field for actual cash at close
                };

                await supabase
                    .from('gm_shifts')
                    .update(updatePayload)
                    .eq('id', shiftId);
                console.log(`[AppStaff] Shift closed in DB: ${shiftId}`);

                // IQO: Check Variance
                const declaredCents = Math.round(closingCash * 100);
                const expectedCents = Math.round(totalRevenue * 100); // Assuming totalRevenue is what system expects?
                // Actually endShift argument `totalRevenue` usually means "Sales recorded".
                // If closingCash matches Sales, it's perfect.
                // NOTE: We need to know 'Opening Float' to do this right? 
                // Currently simplified: Closing Cash should equal Opening + Sales.
                // I don't have Opening Float in scope here easily unless I store it in state, which I do (shiftStart... wait, I don't have opening amount in state).
                // Assuming `closingCash` is compared to `totalRevenue` for now or just logged.

                const variance = declaredCents - expectedCents;

                if (Math.abs(variance) < 5) { // 5 cents tolerance
                    recordQualityEvent('SHIFT_PERFECT', 10, { variance });
                } else if (Math.abs(variance) > 500) { // 5 euros off
                    recordQualityEvent('SHIFT_VARIANCE', -50, { variance });
                }

            }
        } catch (e) {
            console.error('[AppStaff] Failed to close shift', e);
        } finally {
            // Always close locally
            setShiftState('closed');
            setShiftStart(null);
            setShiftId(null);
            console.log('[AppStaff] Shift ended locally');
        }
    }, [shiftId]);

    const resetShift = useCallback(() => {
        setShiftState('offline');
        setShiftStart(null);
        setShiftId(null);
        console.log('[AppStaff] Shift reset');
    }, []);

    // --- Quality Engine (Silent) ---
    const recordQualityEvent = useCallback(async (type: string, scoreImpact: number, metadata: any = {}) => {
        if (!shiftId) {
            console.log("Cannot record quality event: No active shift");
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('gm_quality_events')
                .insert({
                    restaurant_id: operationalContext.businessId, // Ideally obtained from auth/db, currently context
                    shift_id: shiftId,
                    user_id: user.id,
                    event_type: type,
                    score_impact: scoreImpact,
                    metadata
                });

            if (error) {
                console.error("Failed to record quality event:", error);
            } else {
                console.log(`[IQO] Event recorded: ${type}`);
            }
        } catch (e) {
            console.error("Error in recordQualityEvent", e);
        }
    }, [shiftId, operationalContext.businessId]);

    // --- Access Control (Moved to below) ---

    const completeTask = useCallback(async (taskId: string) => {
        // Optimistic UI
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: 'done' as const } : t
        ));

        try {
            await supabase
                .from('gm_tasks')
                .update({ status: 'done' })
                .eq('id', taskId);
        } catch (e) {
            console.error("Complete task error", e);
        }
    }, []);

    const createTask = useCallback(async (title: string, role: StaffRole, priority: Task['priority'] = 'attention') => {
        try {
            const businessId = operationalContext.businessId;
            // robust check for UUID (approximate)
            const restaurantId = /^[0-9a-fA-F-]{36}$/.test(businessId) ? businessId : null;

            await supabase.from('gm_tasks').insert({
                title,
                priority,
                status: 'pending',
                assigned_roles: [role],
                category: 'adhoc',
                restaurant_id: restaurantId,
            });
            // Realtime will update list
        } catch (e) {
            console.error("Create task error", e);
        }
    }, [operationalContext.businessId]);

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

    // KDS Helper
    const getStationForCategory = useCallback((categoryId: string): Station | null => {
        // 1. Find link
        const link = categoryLinks.find(c => c.id === categoryId);
        if (!link || !link.station_id) return null; // Or default?

        // 2. Find station
        return stations.find(s => s.id === link.station_id) || null;
    }, [categoryLinks, stations]);




    const contextValue: AppStaffContextType = {
        // Bug #9 Fix: Estados explícitos
        appState,
        errorMessage,
        retryLoad,
        operationalContext,
        setOperationalContext,
        activeRole,
        setActiveRole,
        roleConfig,
        userName,
        shiftState,
        shiftStart,
        shiftId,
        currentShift,
        startShift,
        endShift,
        resetShift,
        financialState,
        financialSessionId,
        openFinancialSession,
        closeFinancialSession,
        tasks: roleTasks,
        completeTask,
        updateTaskStatus: async () => { },
        addTask: async () => { },
        createTask,
        canAccess,
        recordQualityEvent,
        allRoles: ALL_ROLES,
        allOperationTypes: ALL_OPERATION_TYPES,
        allMaturities: ALL_MATURITIES,
        stations,
        getStationForCategory,
    };

    // Bug #9 Fix: Renderizar fallback UI se estado não está ready
    if (appState === 'loading') {
        return (
            <AppStaffContext.Provider value={contextValue}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>Carregando...</Text>
                </View>
            </AppStaffContext.Provider>
        );
    }

    if (appState === 'error') {
        return (
            <AppStaffContext.Provider value={contextValue}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
                    <Text style={{ color: '#ff3b30', fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
                        Erro ao Carregar
                    </Text>
                    <Text style={{ color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
                        {errorMessage || 'Não foi possível carregar o contexto do app.'}
                    </Text>
                    <TouchableOpacity
                        onPress={retryLoad}
                        style={{ backgroundColor: '#32d74b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
                    >
                        <Text style={{ color: '#000', fontWeight: 'bold' }}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            </AppStaffContext.Provider>
        );
    }

    // Bug #9 Fix: Só renderiza conteúdo operacional se state === 'ready'
    return (
        <AppStaffContext.Provider value={contextValue}>
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
