export type StaffRole = 'manager' | 'waiter' | 'kitchen' | 'cleaning' | 'worker' | 'owner';

// Logical apps por papel (OperatorApp)
export type OperatorAppId = 'owner' | 'manager' | 'waiter' | 'kitchen' | 'cleaning';

export type ScreenMode = 'single' | 'wall' | 'split';

/** Representa uma sessão viva de um operador em um dispositivo concreto. */
export interface OperatorSession {
    operatorId: string | null;
    role: StaffRole;
    deviceId?: string | null;
    activeApp: OperatorAppId;
    screenMode: ScreenMode;
    lastSeenAt: number;
}

export type DominantTool = 'none' | 'order' | 'production' | 'check' | 'hands' | 'tablet' | 'knife' | 'tray';

export type BusinessType = 'restaurant' | 'bar' | 'cafe' | 'retail';

export type TaskStatus = 'pending' | 'focused' | 'done';

export interface SubTask {
    id: string;
    text: string;
    completed: boolean;
}

export interface Task {
    id: string;
    type: 'order' | 'maintenance' | 'preventive' | 'reactive' | 'foundational' | 'delivery' | 'alert' | 'mission_critical';
    title: string;
    description: string;
    // Core 5 Synapse: "Why are we doing this?"
    reason?: string;
    status: TaskStatus;
    assigneeRole?: StaffRole;
    assigneeId?: string; // Optional specific assignment
    priority: 'critical' | 'attention' | 'background' | 'urgent';
    riskLevel?: number; // 0-100 (Stress Level)

    // UI Visuals (Core 4 Layer 3)
    uiMode?: 'toast' | 'card' | 'check' | 'production' | 'counter' | 'confirm' | 'order';
    context?: 'kitchen' | 'floor' | 'bar' | 'storage';

    // Temporal
    createdAt: number;
    completedAt?: number;
    expiresAt?: number;

    subtasks?: SubTask[];

    // Integration metadata (for delivery/external orders)
    metadata?: {
        orderId?: string;
        source?: string;
        channel?: string;
        alertType?: string;
        [key: string]: unknown;
    };

    // Metadata for Nervous System
    meta?: {
        source: 'human' | 'system-reflex' | 'inventory-synapse' | 'inventory-reflex' | 'integration' | 'kds-sync' | 'manual-assignment';
        mode?: 'idle' | 'pressure';
        generatedAt?: number;
        recipeId?: string; // For Anti-SOP Rituals

        // Inventory Reflex Specifics
        hungerKey?: string;
        organId?: string;
        organName?: string;
        itemId?: string;
        signalId?: string;
        autoResolved?: boolean;
        resolvedAt?: number;
        orderId?: string;
        action?: 'advance' | 'retrograde' | 'pause';
        createdBy?: string;
    }
}

export type StaffMode = 'setup' | 'operational';

export interface OperationalContract {
    id: string;
    workerId?: string; // Optional in context state (null if not logged in)
    role?: StaffRole; // Optional
    storeName?: string;
    name?: string; // Added
    type?: BusinessType; // Added
    mode: 'local' | 'connected'; // Added (Required)
    permissions: string[];
}

export interface StaffState {
    mode: StaffMode;
    contract: OperationalContract | null;
    tasks: Task[];
    notifications: string[];
    // Core 4: Nervous State
    stressLevel: number; // 0-100 (Global or Local?) -> Local perception
    lastActivityAt: number; // For Idle Reflex
    obligations: LatentObligation[]; // The Stomach Input
}

// --- METABOLIC TYPES (Core 5) ---

export interface LatentObligation {
    id: string; // 'clean-fridge-week-42'
    sourceId: string; // 'fridge-01'
    sourceType: 'inventory' | 'compliance';
    type: 'cleaning' | 'maintenance' | 'audit';
    title: string;
    description: string;
    validFrom: number; // Start of window
    validUntil: number; // Deadline
    criticality: 'low' | 'medium' | 'high';
    status: 'latent' | 'active' | 'fulfilled' | 'expired';
    recurrence?: string; // Metadata for calendar
    recipeId?: string; // Link to SOP
}

export interface EquipmentOrgan {
    id: string;
    name: string;
    type: 'fridge' | 'oven' | 'coffee_machine' | 'hvac' | 'pump_station' | 'sous_vide' | 'freezer' | 'dry_storage';
    status: 'healthy' | 'warning' | 'critical';
    metabolism: {
        cleaningCycle: 'daily' | 'weekly';
        maintenanceCycle: 'monthly' | 'yearly';
        lastCleanedAt: number;
        lastMaintainedAt: number;
    };
    // Core 5 / Law 8: Capability Constraints (Ritual Detector)
    capabilities?: {
        requiresDecanting?: boolean;
        requiresPolishing?: boolean;
        requiresDescaling?: boolean;
        requiresRefill?: boolean;
        [key: string]: boolean | undefined;
    };
}

// --- ANTI-SOP ENGINE (Recipe Types) ---

export interface TaskRecipe {
    id: string;
    title: string; // "Transferir Ketchup"
    action: 'cleaning' | 'maintenance' | 'preventive';
    reason: string; // "Evita oxidação"

    // The "Soul" of the recipe (Why we do it)
    preconditions: {
        targetOrganType: string; // 'condiments'
        requiredCapability?: string; // 'requiresDecanting'
        interval: number; // ms
        gracePeriod: number; // ms
    };

    status: 'active' | 'deprecated' | 'suspected';
}

export interface SpecDriftAlert {
    id: string;
    recipeId: string;
    organId: string;
    detectedAt: number;
    reason: string; // "Organ 'ketchup-dispenser' lost capability 'requiresDecanting'"
    status: 'new' | 'acknowledged' | 'resolved';
}

export interface Employee {
    id: string;
    role: StaffRole;
    position: 'kitchen' | 'waiter' | 'cleaning' | 'cashier' | 'manager';
    name: string;
    user_id?: string | null;
    email?: string | null;
    pin?: string;
    active: boolean;
    restaurant_id: string;
}
