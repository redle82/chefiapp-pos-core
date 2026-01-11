import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { SystemBlueprint } from '../../core/blueprint/SystemBlueprint';
import { supabase } from '../../core/supabase';
import { OnboardingCore } from '../../core/onboarding/OnboardingCore';

export type OnboardingEntryContext = 'external_marketing' | 'internal_app' | 'invite_manager';

// --- DRAFT STATE (Partial Blueprint) ---
// This represents the "Work In Progress" state before it becomes a Law.
export interface OnboardingDraft {
    // 1. IDENTITY & AUTHORITY (Google-First)
    restaurantName?: string;
    city?: string;
    address?: string;
    countryCode?: string;
    lat?: number;
    lng?: number;
    placeId?: string;
    businessType?: 'Restaurant' | 'Cafe' | 'Bar' | 'FastFood' | 'Other';

    // Auth Info
    userName?: string;
    userRole?: 'Owner' | 'Manager' | 'Staff';
    userId?: string;

    // 2. PROOF OF EXISTENCE (Health Check)
    evidence?: {
        evidence_type: 'google_business' | 'real_menu' | 'external_service' | 'founder_mode';
        status: string;
        source: string;
        data: any;
        healthScore?: number;
        alerts?: string[];
    };

    // 3. SOVEREIGN STATUS
    onboardingLevel?: 'founder' | 'verified_bronze' | 'verified_silver' | 'verified_gold';
    modulesUnlocked?: string[];

    // 4. PHYSICAL REALITY
    topology?: {
        dineIn: boolean;
        delivery: boolean;
        takeaway: boolean;
    };

    // 5. ORGANIZATIONAL STRUCTURE (The Skeleton)
    teamStructure?: {
        expectedWaiters: number;
        expectedCooks: number;
        hasManager: boolean;
        hasCashier: boolean;
    };

    flowType?: 'a_la_carte' | 'fast_casual';
    finance?: {
        currency: string;
        methods: string[];
    };

    // Metadata
    tenantId?: string;
    entryContext?: OnboardingEntryContext;
}

interface OnboardingContextType {
    draft: OnboardingDraft;
    loading: boolean;
    updateDraft: (updates: Partial<OnboardingDraft>) => void;
    entryContext: OnboardingEntryContext;

    // --- SOVEREIGN ACTIONS ---
    initializeSovereign: () => Promise<SystemBlueprint>;
    advanceState: (step: 'authority' | 'existence' | 'topology' | 'flow' | 'cash' | 'team', updates?: Partial<OnboardingDraft>) => Promise<void>;
    consecrateSystem: () => Promise<SystemBlueprint>;

    /** @deprecated Use consecrateSystem */
    sealBlueprint: () => Promise<SystemBlueprint>;
    resetDraft: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = 'chefiapp_sovereign_draft_v1';

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
    const [draft, setDraft] = useState<OnboardingDraft>({});
    const [loading, setLoading] = useState(true);
    const [entryContext, setEntryContext] = useState<OnboardingEntryContext>('external_marketing');

    // 1. HYDRATE (Local + Auth)
    useEffect(() => {
        const hydrate = async () => {
            // A. Load Local Draft
            const { getTabIsolated } = await import('../../core/storage/TabIsolatedStorage');
            const local = getTabIsolated(STORAGE_KEY);
            const initialDraft: OnboardingDraft = local ? JSON.parse(local) : {};

            // B. Check Auth for ID & Name (Google Source)
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                initialDraft.userId = session.user.id;
                // Auto-fill Name from Google if not already set locally
                if (!initialDraft.userName) {
                    initialDraft.userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
                }
            }

            // C. Context Detection Logic
            // Priority: Invited > Internal > External
            let detectedContext: OnboardingEntryContext = 'external_marketing';

            const hasInvite = window.location.pathname.includes('invite-code');
            // getTabIsolated is already defined above

            const isInternalDevice = getTabIsolated('chefiapp_device_role') !== null;

            if (hasInvite) {
                detectedContext = 'invite_manager';
            } else if (isInternalDevice && session?.user) {
                detectedContext = 'internal_app';
            }

            setEntryContext(detectedContext);
            console.log(`[Onboarding] 🕵️ Context Detected: ${detectedContext}`);

            setDraft(initialDraft);
            setLoading(false);
        };
        hydrate();
    }, []);

    // 2. AUTO-PERSIST LOCAL
    const updateDraft = (updates: Partial<OnboardingDraft>) => {
        setDraft(prev => {
            const next = { ...prev, ...updates };
            // Async import to avoid blocking
            import('../../core/storage/TabIsolatedStorage').then(({ setTabIsolated }) => {
                setTabIsolated(STORAGE_KEY, JSON.stringify(next));
            });
            return next;
        });
    };

    // 3. SOVEREIGN ACTIONS - The Real Persistence

    const initializeSovereign = async () => {
        // Step 1: Genesis (Creates Tenant)
        // INJECTION: We ensure entryContext is locked into the draft during Genesis
        const payload = { ...draft, entryContext };
        const blueprint = await OnboardingCore.initializeSovereign(payload);
        updateDraft({ tenantId: blueprint.meta.tenantId, entryContext });
        return blueprint;
    };

    const advanceState = async (step: 'authority' | 'existence' | 'topology' | 'flow' | 'cash' | 'team', updates?: Partial<OnboardingDraft>) => {
        // Step 2-6: Incremental Updates
        if (updates) updateDraft(updates);

        // Use current draft state + updates for the DB call
        const currentData = { ...draft, ...updates };

        if (!currentData.tenantId) throw new Error('Cannot advance state: Tenant ID missing (Genesis failed?)');

        await OnboardingCore.advanceSovereignState(currentData.tenantId, step, currentData);
    };

    const consecrateSystem = async () => {
        // Step 7: Final Seal
        if (!draft.tenantId) throw new Error('Cannot consecrate: Tenant ID missing');
        const blueprint = await OnboardingCore.consecrateSovereign(draft.tenantId, draft);
        resetDraft(); // Mission Complete
        return blueprint;
    };

    const resetDraft = async () => {
        setDraft({});
        const { removeTabIsolated } = await import('../../core/storage/TabIsolatedStorage');
        removeTabIsolated(STORAGE_KEY);
    };

    const sealBlueprint = async (): Promise<SystemBlueprint> => {
        return await consecrateSystem();
    };

    return (
        <OnboardingContext.Provider value={{
            draft,
            loading,
            entryContext,
            updateDraft,
            initializeSovereign,
            advanceState,
            consecrateSystem,
            sealBlueprint,
            resetDraft
        }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
    return context;
};
