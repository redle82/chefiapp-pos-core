
export type SystemHealth = 'ok' | 'degraded' | 'blocked';
export type AuthStatus = 'unknown' | 'ok' | 'expired' | 'missing';
export type TenantStatus = 'none' | 'creating' | 'ready' | 'corrupt'; // 'corrupt' -> id missing but state says yes
export type OnboardingStatus = 'not_started' | 'in_progress' | 'done';

export interface SystemStatus {
    auth: AuthStatus;
    tenant: TenantStatus;
    onboarding: OnboardingStatus;
    health: SystemHealth;
    lastCheckedAt: number;
}

export type GuardianAction =
    | { type: 'CHECK_PULSE' }
    | { type: 'REPORT_ERROR'; payload: SystemError }
    | { type: 'AUTO_RECOVER'; target: 'session' | 'tenant' }
    | { type: 'OVERRIDE_STATE'; payload: Partial<SystemStatus> };

export interface SystemError {
    code: string; // e.g., 'TENANT_SYNC_FAILED'
    stage: 'identity' | 'restaurant' | 'team' | 'ready' | 'operation';
    source: 'supabase' | 'local_storage' | 'network';
    severity: 'low' | 'medium' | 'critical';
    can_retry: boolean;
    suggested_fix?: string;
    timestamp: number;
}

export interface GuardianContextType {
    status: SystemStatus;
    errors: SystemError[];
    isRecovering: boolean;
    reportError: (error: Omit<SystemError, 'timestamp'>) => void;
    checkPulse: () => Promise<void>;
}
