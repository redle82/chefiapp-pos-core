import { useState, useEffect, useCallback } from 'react';
import { getTabIsolated, setTabIsolated, removeTabIsolated } from '../storage/TabIsolatedStorage';

// ------------------------------------------------------------------
// 🛡️ AUTH STATE MACHINE (The Identity Core)
// ------------------------------------------------------------------
// @deprecated Use useSupabaseAuth instead
// 
// This is a legacy custom token-based auth system that is NO LONGER USED.
// The app now uses Supabase Auth as the single source of truth.
// 
// Migration:
// - Replace useAuthStateMachine() with useSupabaseAuth()
// - Replace AuthBoundary with RequireAuth
// - Remove all references to 'x-chefiapp-token' from localStorage
// 
// This file will be removed in a future version.
// See: docs/AUTH_UNIFICATION_PLAN.md
// ------------------------------------------------------------------

export type AuthState = 'UNAUTH' | 'AUTHING' | 'AUTHED' | 'EXPIRED' | 'DEGRADED';

interface AuthMachine {
    state: AuthState;
    token: string | null;
    reason: string | null;
    login: (token: string) => void;
    logout: () => void;
}

const TOKEN_KEY = 'x-chefiapp-token';
const DEMO_KEY = 'chefiapp_demo_mode';

export function useAuthStateMachine(): AuthMachine {
    const [state, setState] = useState<AuthState>('UNAUTH');
    const [token, setToken] = useState<string | null>(null);
    const [reason, setReason] = useState<string | null>(null);

    // 1. HYDRATION (Boot)
    useEffect(() => {
        setState('AUTHING');

        const storedToken = getTabIsolated(TOKEN_KEY);
        const isDemo = getTabIsolated(DEMO_KEY) === 'true';

        // A) DEMO MODE (Degraded Trust)
        if (isDemo) {
            console.warn('[Auth] Running in DEMO MODE (Degraded).');
            setToken(null);
            setState('DEGRADED');
            setReason('Modo de Demonstração (Sem persistência real)');
            return;
        }

        // B) NO TOKEN (Unauth)
        if (!storedToken) {
            setToken(null);
            setState('UNAUTH');
            setReason('Sessão não iniciada');
            return;
        }

        // C) TOKEN VALIDATION (Basic format check, Verify in backend typically)
        // For now, checks existence. In real jwt, check expiry.
        if (isValidTokenFormat(storedToken)) {
            setToken(storedToken);
            setState('AUTHED');
            setReason(null);
        } else {
            setToken(null);
            setState('EXPIRED');
            setReason('Token inválido ou malformado');
            removeTabIsolated(TOKEN_KEY);
        }

    }, []);

    // 2. ACTIONS
    const login = useCallback((newToken: string) => {
        if (!newToken) return;
        setTabIsolated(TOKEN_KEY, newToken);
        setToken(newToken);
        setState('AUTHED');
        setReason(null);
    }, []);

    const logout = useCallback(() => {
        removeTabIsolated(TOKEN_KEY);
        setToken(null);
        setState('UNAUTH');
        setReason('Logout manual');
    }, []);

    return { state, token, reason, login, logout };
}

// Helper: Basic JWT-like structure check (Forensic Minimum)
function isValidTokenFormat(t: string): boolean {
    if (!t) return false;
    if (t.length < 20) return false; // Too short
    // Could check for dots if JWT
    return true;
}
