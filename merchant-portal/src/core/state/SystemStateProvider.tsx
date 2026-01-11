/**
 * SYSTEM STATE PROVIDER (STUB)
 * 
 * Temporary stub for SystemStateProvider until full implementation.
 * This provides the useSystemState hook for activation module compatibility.
 * 
 * TODO: Replace with full SystemState implementation
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { SystemBlueprint } from '../blueprint/SystemBlueprint';
import { getTabIsolated } from '../storage/TabIsolatedStorage';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SystemState {
    blueprint: SystemBlueprint | null;
    restaurant: {
        id: string | null;
        name: string | null;
        setupStatus: string | null;
    };
}

export interface SystemStateContextValue {
    state: SystemState | null;
    isReady: boolean;
    isLoading: boolean;
    error: string | null;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════

const defaultValue: SystemStateContextValue = {
    state: null,
    isReady: false,
    isLoading: false,
    error: null
};

const SystemStateContext = createContext<SystemStateContextValue>(defaultValue);

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

/**
 * useSystemState — Read system state from context
 * 
 * Returns default values if no provider is present (graceful degradation).
 */
export function useSystemState(): SystemStateContextValue {
    const context = useContext(SystemStateContext);
    
    // Graceful degradation: Return defaults if no provider
    if (!context) {
        return defaultValue;
    }
    
    return context;
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER (for future use)
// ═══════════════════════════════════════════════════════════════

export interface SystemStateProviderProps {
    children: ReactNode;
    initialState?: Partial<SystemState>;
}

/**
 * SystemStateProvider — Provides system state to children
 * 
 * Stub implementation - loads minimal state from localStorage
 */
export function SystemStateProvider({ children, initialState }: SystemStateProviderProps) {
    // Stub: Just provide default state for now
    const value: SystemStateContextValue = {
        state: {
            blueprint: null,
            restaurant: {
                id: typeof window !== 'undefined' 
                    ? getTabIsolated('chefiapp_restaurant_id') 
                    : null,
                name: null,
                setupStatus: null
            },
            ...initialState
        },
        isReady: true,
        isLoading: false,
        error: null
    };

    return (
        <SystemStateContext.Provider value={value}>
            {children}
        </SystemStateContext.Provider>
    );
}
