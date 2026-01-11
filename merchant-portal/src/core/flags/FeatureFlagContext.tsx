import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../supabase';
import { DiagnosticEngine } from '../diagnostics/DiagnosticEngine';

interface FeatureFlags {
    disable_monetization: boolean;
    safe_mode: boolean;
    verbose_diagnostics: boolean;
    [key: string]: any;
}

const DEFAULT_FLAGS: FeatureFlags = {
    disable_monetization: false,
    safe_mode: false,
    verbose_diagnostics: false,
};

interface FeatureFlagContextType {
    flags: FeatureFlags;
    isLoading: boolean;
    refreshFlags: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
    flags: DEFAULT_FLAGS,
    isLoading: true,
    refreshFlags: async () => { },
});

export const FeatureFlagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFlags = async () => {
        try {
            // 1. Fetch Global Flags
            const { data: globalData, error: globalError } = await supabase
                .from('system_config')
                .select('key, value')
                .eq('scope', 'global');

            // In development, if table doesn't exist (404), use defaults silently
            if (globalError) {
                if (globalError.code === 'PGRST116' || globalError.message?.includes('404')) {
                    // Table doesn't exist - use defaults (expected in local dev)
                    setFlags(DEFAULT_FLAGS);
                    setIsLoading(false);
                    return;
                }
                throw globalError;
            }

            // 2. Compute Merged Flags
            const merged: FeatureFlags = { ...DEFAULT_FLAGS };

            globalData?.forEach((row: any) => {
                merged[row.key] = row.value;
            });

            // (In future: Fetch Tenant/User flags and overlay)

            setFlags(merged);

            if (merged.verbose_diagnostics) {
                console.log('[GM-FLAGS] Loaded:', merged);
            }

        } catch (err) {
            DiagnosticEngine.emit(
                'GM-0005-FLAG-FAIL',
                'Failed to load feature flags',
                'warning',
                { err }
            );
            // Fallback is already set via initial state
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFlags();

        // Optional: Real-time subscription to flag changes
        const channel = supabase
            .channel('system_config_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'system_config' },
                () => {
                    console.log('[GM-FLAGS] Update detected, refreshing...');
                    fetchFlags();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <FeatureFlagContext.Provider value={{ flags, isLoading, refreshFlags: fetchFlags }}>
            {children}
        </FeatureFlagContext.Provider>
    );
};

export const useFeatureFlags = () => useContext(FeatureFlagContext);
