import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { OnboardingCore } from '../onboarding/OnboardingCore';
import { getTabIsolated } from '../storage/TabIsolatedStorage';

// --- TYPES ---

export interface SystemStatus {
    auth: 'ok' | 'missing' | 'expired' | 'unknown';
    tenant: 'none' | 'ready' | 'error';
    onboarding: 'not_started' | 'in_progress' | 'done';
    realityStatus: 'draft' | 'verified' | 'active' | 'unknown'; // <-- Added Reality Status
    health: 'ok' | 'degraded' | 'blocked';
    lastCheckedAt: number;
}

export interface SystemError {
    code: string;
    message?: string;
    stage: string;
    source: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    can_retry: boolean;
}

const DEFAULT_STATUS: SystemStatus = {
    auth: 'unknown',
    tenant: 'none',
    onboarding: 'not_started',
    realityStatus: 'unknown',
    health: 'ok',
    lastCheckedAt: 0
};

interface SystemGuardianContextType {
    status: SystemStatus;
    errors: SystemError[];
    isRecovering: boolean;
    reportError: (error: Omit<SystemError, 'timestamp'>) => void;
    checkPulse: () => Promise<void>;
}

const SystemGuardianContext = createContext<SystemGuardianContextType | undefined>(undefined);

export const useSystemGuardian = () => {
    const context = useContext(SystemGuardianContext);
    if (!context) throw new Error('useSystemGuardian must be used within SystemGuardianProvider');
    return context;
};

// --- PROVIDER ---

export const SystemGuardianProvider = ({ children }: { children: React.ReactNode }) => {
    const [status, setStatus] = useState<SystemStatus>(DEFAULT_STATUS);
    const [errors, setErrors] = useState<SystemError[]>([]);
    const [isRecovering, setIsRecovering] = useState(false);

    // --- REPORT ERROR ---
    const reportError = useCallback((err: Omit<SystemError, 'timestamp'>) => {
        console.error(`[SystemGuardian] Error:`, err);
        setErrors(prev => [...prev, { ...err, timestamp: Date.now() }]);
    }, []);

    // --- CLEAR OLD ERRORS ---
    useEffect(() => {
        const interval = setInterval(() => {
            setErrors(prev => prev.filter(e => Date.now() - e.timestamp < 60000)); // Clear > 1min
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // --- PULSE CHECK (The Heartbeat) ---
    const checkPulse = useCallback(async () => {
        const now = Date.now();
        console.log('[SystemGuardian] Checking Pulse...');

        // 1. Check Auth
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        let authStatus: SystemStatus['auth'] = 'unknown';

        if (authError) {
            authStatus = 'expired';
            reportError({ code: 'AUTH_CHECK_FAIL', stage: 'identity', source: 'supabase', severity: 'medium', can_retry: true });
        } else if (!session) {
            authStatus = 'missing';
        } else {
            authStatus = 'ok';
        }

        // 2. CHECK SYSTEM BLUEPRINT (The Sovereign Authority)
        let tenantStatus: SystemStatus['tenant'] = 'none';
        let onboardingStatus: SystemStatus['onboarding'] = 'not_started';
        let realityStatus: SystemStatus['realityStatus'] = 'unknown';

        // The Blueprint IS the system. If it's missing, the system is missing.
        // Note: getBlueprint is now async, but this function is sync
        // We'll use a fallback approach - check storage directly
        const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
        const blueprintRaw = getTabIsolated('chefiapp_system_blueprint_v2');
        const blueprint = blueprintRaw ? JSON.parse(blueprintRaw) : null;

        if (blueprint && blueprint.meta?.tenantId) {
            // We trust the Blueprint implicitly.
            tenantStatus = 'ready';
            onboardingStatus = 'done';

            // Extract Reality Status
            // Default to 'draft' if not present (backward compatibility or fresh creation)
            realityStatus = blueprint.organization.realityStatus || 'draft';

        } else {
            // No Blueprint? Then we fall back to Draft check or "Not Started"
            const draft = getTabIsolated('chefiapp_onboarding_draft');
            if (draft) {
                onboardingStatus = 'in_progress';
                realityStatus = 'draft';
            }
        }

        // 3. Determine Overall Health
        let health: SystemStatus['health'] = 'ok';
        const activeErrors = errors.filter(e => Date.now() - e.timestamp < 60000);

        if (authStatus === 'expired') health = 'blocked';
        else if (activeErrors.length > 0) health = 'degraded';

        setStatus({
            auth: authStatus,
            tenant: tenantStatus,
            onboarding: onboardingStatus,
            realityStatus,
            health,
            lastCheckedAt: now
        });

        // 4. Trigger Auto-Recovery
        if (health !== 'ok' && !isRecovering && authStatus === 'expired') {
            setIsRecovering(true);
            setTimeout(() => setIsRecovering(false), 2000); // Mock recovery for now
        }

    }, [errors, isRecovering, reportError]);

    // Initial Pulse
    useEffect(() => {
        checkPulse();
        // Optional: periodic pulse
        // const i = setInterval(checkPulse, 60000);
        // return () => clearInterval(i);
    }, [checkPulse]);

    return (
        <SystemGuardianContext.Provider value={{ status, errors, isRecovering, reportError, checkPulse }}>
            {children}
            {/* Debug Overlay */}
            {import.meta.env.DEV && new URLSearchParams(window.location.search).get("debug") === "1" && (
                <div style={{ position: 'fixed', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', padding: 10, borderRadius: 8, fontSize: 10, zIndex: 9999, pointerEvents: 'none' }}>
                    <div style={{ color: 'white' }}>H: {status.health} | BP: {status.tenant} | R: {status.realityStatus}</div>
                </div>
            )}
        </SystemGuardianContext.Provider>
    );
};
