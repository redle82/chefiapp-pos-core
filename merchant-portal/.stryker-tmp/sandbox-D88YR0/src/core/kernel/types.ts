/**
 * 🧬 BOOTSTRAP KERNEL — Type Definitions
 * 
 * Core types for system self-awareness.
 */

// ========================================
// SURFACE TYPES
// ========================================

export type SurfaceId = 'panel' | 'tpv' | 'kds' | 'staff' | 'web';

export type SurfaceStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';

export interface SurfaceDefinition {
    id: SurfaceId;
    name: string;
    route: string;
    description: string;
    requiredSystems: SystemId[];
    isLauncher: boolean; // Opens in new window
    healthCheck: () => Promise<SurfaceStatus>;
}

// ========================================
// SYSTEM TYPES
// ========================================

export type SystemId = 'orders' | 'tables' | 'cashRegister' | 'fiscal' | 'menu' | 'staff';

export type SystemStatus = 'OK' | 'CONFIGURED' | 'PARTIAL' | 'MISSING';

export interface SystemDefinition {
    id: SystemId;
    name: string;
    description: string;
    evidenceFiles: string[]; // Files that prove system exists
    runtimeGuards: string[]; // Guards that must be active
    healthCheck: () => Promise<SystemStatus>;
}

// ========================================
// GUARD TYPES
// ========================================

export interface GuardStatus {
    assertNoMock: boolean;
    dbWriteGate: boolean;
    runtimeContext: boolean;
}

// ========================================
// OBSERVABILITY TYPES
// ========================================

export interface ObservabilityStatus {
    logs: boolean;
    monitoring: boolean;
    alerts: boolean;
}

// ========================================
// SYSTEM STATE (Main Output)
// ========================================

export type Environment = 'dev' | 'staging' | 'prod';
export type KernelHealth = 'OK' | 'DEGRADED' | 'FAILED';

export interface SystemState {
    environment: Environment;
    kernel: KernelHealth;

    surfaces: Record<SurfaceId, SurfaceStatus>;
    systems: Record<SystemId, SystemStatus>;
    guards: GuardStatus;
    observability: ObservabilityStatus;

    timestamp: string;
    version: string;
}

// ========================================
// INITIALIZATION TYPES
// ========================================

export interface BootstrapOptions {
    skipHealthChecks?: boolean;
    forceEnvironment?: Environment;
}

export interface BootstrapResult {
    success: boolean;
    state: SystemState;
    errors: string[];
    warnings: string[];
}
