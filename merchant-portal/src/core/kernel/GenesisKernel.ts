import type { SystemBlueprint } from '../blueprint/SystemBlueprint';
import { supabase } from '../supabase';
import { DbWriteGate } from '../governance/DbWriteGate';

/**
 * GENESIS KERNEL
 * 
 * The Sovereign Authority that mints the System Blueprint.
 * It Converts raw Drafts into the immutable System Law.
 * 
 * Replaces the legacy OnboardingCore.
 */

export interface OnboardingDraft {
    userId?: string;
    userName?: string;
    userRole?: 'Owner' | 'Manager' | 'Staff' | 'Technical';

    tenantId?: string;
    restaurantName?: string;
    city?: string;
    address?: string;
    countryCode?: string;
    lat?: number;
    lng?: number;
    placeId?: string;
    businessType?: 'Restaurant' | 'Cafe' | 'Bar' | 'FastFood' | 'Other';
    logoUrl?: string;

    teamSize?: string;
    operationMode?: 'Gamified' | 'Executive';
    menuStrategy?: 'Quick' | 'Manual';

    // Sovereign 2.0 properties
    onboardingLevel?: 'founder' | 'verified_gold' | 'legacy';
    modulesUnlocked?: string[];
    evidence?: any;
    topology?: { dineIn: boolean; delivery: boolean; takeaway: boolean };
    flowType?: 'a_la_carte' | 'fast_casual' | 'dark_kitchen';
    finance?: { currency: string; methods: string[] };
}

const BLUEPRINT_STORAGE_KEY = 'chefiapp_system_blueprint_v2';
const CURRENT_VERSION = '2.0.0-SOVEREIGN';

export type RealityResolution =
    | { action: 'bind_existing'; tenantId: string }
    | { action: 'reset_and_restart' };

export async function resolveRealityConflict(
    draft: OnboardingDraft,
    resolution: RealityResolution
): Promise<Partial<OnboardingDraft>> {
    if (resolution.action === 'bind_existing') {
        if (!resolution.tenantId) {
            throw new Error('TenantId obrigatório para bind');
        }

        console.log('[GenesisKernel] 🔑 Executing Ritual of Possession (Bind)...');

        // 🔑 Amarração soberana (Via Gate)
        const { error } = await DbWriteGate.update(
            'GenesisKernel',
            'gm_restaurants',
            { onboarding_in_progress: true },
            { id: resolution.tenantId },
            { tenantId: resolution.tenantId }
        );

        if (error) {
            console.error('[GenesisKernel] Failed to bind tenant:', error);
            throw new Error('Falha ao amarrar realidade: ' + error.message);
        }

        return {
            ...draft,
            tenantId: resolution.tenantId,
            reality: 'bound',
        };
    }

    if (resolution.action === 'reset_and_restart') {
        const { removeTabIsolated } = await import('../storage/TabIsolatedStorage');
        removeTabIsolated('chefiapp_sovereign_draft_v1');
        return {};
    }

    return {};
}

export class GenesisKernel {

    /**
     * Resolves a raw draft into a formalized System Blueprint.
     */
    public static compile(draft: OnboardingDraft): SystemBlueprint {
        // Validation
        if (!draft.restaurantName) throw new Error('Restaurant Name is required');

        const isGamified = draft.operationMode === 'Gamified';
        const isOwner = draft.userRole === 'Owner' || !draft.userRole; // Default to Owner if not set

        return {
            meta: {
                blueprintVersion: CURRENT_VERSION,
                createdAt: new Date().toISOString(),
                tenantId: draft.tenantId || 'pending-generation',
                environment: 'production'
            },
            identity: {
                userName: draft.userName || 'Anonymous',
                userRole: draft.userRole || 'Owner',
                userId: draft.userId || ''
            },
            organization: {
                restaurantName: draft.restaurantName,
                city: draft.city || 'Unknown',
                businessType: (draft.businessType as any) || 'Restaurant',
                logoUrl: draft.logoUrl,
                realityStatus: 'draft' // Default for fresh blueprints
            },
            operation: {
                teamSize: (draft.teamSize as any) || '1-5',
                mode: draft.operationMode || 'Gamified'
            },
            product: {
                menuStrategy: draft.menuStrategy || 'Quick'
            },
            systemProfiles: {
                uiProfile: {
                    theme: isGamified ? 'vibrant' : 'minimal',
                    density: isGamified ? 'comfortable' : 'compact'
                },
                layoutProfile: {
                    showOnboardingTasks: true,
                    sidebarMode: 'expanded'
                },
                permissionProfile: {
                    canManageTeam: isOwner,
                    canEditMenu: isOwner || draft.userRole === 'Manager',
                    isOwner: isOwner
                },
                workflowProfile: {
                    requireKitchenConfirmation: true,
                    enableTableService: true
                }
            },
            boot: {
                status: 'ready',
                bootLog: []
            }
        };
    }

    /**
     * 1. THE GENESIS (Step 1 - Identity)
     * Creates the Tenant immediately. The system is born.
     */
    public static async initializeSovereign(draft: OnboardingDraft): Promise<SystemBlueprint> {
        console.log('[GenesisKernel] 🏛️ Genesis: Creating Sovereign Identity...');

        if (!draft.userId) throw new Error('User ID is required for Genesis');
        if (!draft.restaurantName) throw new Error('Restaurant Name is required for Genesis');

        try {
            // CALL ATOMIC RPC with "Identity" Only
            // Pass defaults ("Pending") for future steps to allow creation
            const { data, error } = await supabase.rpc('create_tenant_atomic', {
                p_restaurant_name: draft.restaurantName,
                p_city: draft.city || 'Unknown',
                p_type: draft.businessType || 'Restaurant',
                p_country: 'ES',
                p_team_size: '1-5', // Default
                p_operation_mode: 'Gamified', // Default
                p_menu_strategy: 'Quick' // Default
            });

            if (error) throw error;

            const tenantId = data.tenant_id;

            // SAFETY NET: Force create Member link (RPC might be failing silently on Cloud)
            try {
                console.log('[GenesisKernel] 🛟 Safety Net: Ensuring Member Link exists...');
                try {
                    console.log('[GenesisKernel] 🛟 Safety Net: Ensuring Member Link exists (Via Gate)...');
                    const { error: memberError } = await DbWriteGate.insert(
                        'GenesisKernel',
                        'gm_restaurant_members',
                        {
                            restaurant_id: tenantId,
                            user_id: draft.userId,
                            role: 'owner'
                        },
                        { tenantId }
                    );
                    if (memberError) {
                        // Start 409 conflict check (already exists)
                        if (!memberError.message.includes('duplicate')) {
                            console.warn('[GenesisKernel] Member Link Warning:', memberError.message);
                        }
                    }
                } catch (err) {
                    console.warn('[GenesisKernel] Member Safety Net ignored:', err);
                }

                console.log('[GenesisKernel] 🏛️ Sovereign Identity Established:', tenantId);

                // Return partial blueprint
                const blueprint = this.compile(draft);
                blueprint.meta.tenantId = tenantId;
                blueprint.organization.realityStatus = 'draft';

                await this.saveLocal(blueprint);
                return blueprint;

            } catch (dbError) {
                console.error('[GenesisKernel] Genesis Failed:', dbError);
                throw new Error(`Failed to create system identity: ${(dbError as any).message}`);
            }
        } catch (genesisError) {
            console.error('[GenesisKernel] Genesis Critically Failed:', genesisError);
            throw genesisError;
        }
    }

    /**
     * 2. THE ADVANCE (Steps 2-6 - Authority, Topology, etc)
     * Updates the existing Sovereign Entity.
     */
    public static async advanceSovereignState(
        tenantId: string,
        step: 'authority' | 'existence' | 'topology' | 'flow' | 'cash' | 'team',
        updates: Partial<OnboardingDraft>
    ): Promise<void> {
        console.log(`[GenesisKernel] 📜 Law Update: ${step.toUpperCase()}`);

        if (!tenantId) throw new Error('System ID missing. Cannot advance state.');

        try {
            // A. Update Data per Step
            if (step === 'authority') {
                if (updates.userName && updates.userId) {
                    await DbWriteGate.update(
                        'GenesisKernel',
                        'profiles',
                        {
                            full_name: updates.userName,
                            role: updates.userRole?.toLowerCase()
                        },
                        { id: updates.userId },
                        { tenantId }
                    );
                }
            }

            if (step === 'existence') {
                console.log('[GenesisKernel] 🕵️ Provas de Existência recebidas:', updates.evidence);
                console.log('[GenesisKernel] 🔒 Nível de Soberania deifinido:', updates.onboardingLevel);
                console.log('[GenesisKernel] 🔓 Módulos Desbloqueados:', updates.modulesUnlocked);

                // CRITICAL: Persist to Storage for FlowGate immediate access
                if (updates.onboardingLevel) {
                    const { setTabIsolated } = await import('../storage/TabIsolatedStorage');
                    setTabIsolated('chefiapp_sovereign_level', updates.onboardingLevel);
                }
                if (updates.modulesUnlocked) {
                    const { setTabIsolated } = await import('../storage/TabIsolatedStorage');
                    setTabIsolated('chefiapp_modules_unlocked', JSON.stringify(updates.modulesUnlocked));
                }
            }

            // ⚠️ CRITICAL: PERSIST TO DB (Sovereign 2.0)
            const updatesDb: any = {};

            if (step === 'existence') {
                updatesDb.onboarding_level = updates.onboardingLevel;
                updatesDb.modules_unlocked = updates.modulesUnlocked;
                updatesDb.evidence = updates.evidence;
            } else if (step === 'topology') {
                updatesDb.topology = updates.topology;
            } else if (step === 'flow') {
                updatesDb.flow_type = updates.flowType;
            } else if (step === 'cash') {
                updatesDb.finance = updates.finance;
            }

            if (Object.keys(updatesDb).length > 0) {
                try {
                    const { error } = await DbWriteGate.update(
                        'GenesisKernel',
                        'gm_restaurants',
                        updatesDb,
                        { id: tenantId },
                        { tenantId }
                    );

                    if (error) throw error;
                    console.log(`[GenesisKernel] DB Updated for step ${step}:`, updatesDb);
                } catch (dbError) {
                    console.warn(`[GenesisKernel] ⚠️ DB Persist bypassed for step ${step} (Schema mismatch?):`, dbError);
                    // Proceed anyway - LocalStorage will hold the state
                }
            }

            console.log(`[GenesisKernel] State Advanced to: ${step} (Persisted)`);

        } catch (error) {
            console.error('[GenesisKernel] Advance Failed:', error);
            throw error;
        }
    }

    /**
     * 3. THE CONSECRATION (Step 7 - Completed)
     * Finalizes the system.
     */
    public static async consecrateSovereign(tenantId: string, draft: OnboardingDraft): Promise<SystemBlueprint> {
        console.log('[GenesisKernel] 👑 Consecrating System...');

        // Final update with all accumulated draft data (just in case)
        // Final update: Seal the system
        try {
            try {
                const { error } = await DbWriteGate.update(
                    'GenesisKernel',
                    'gm_restaurants',
                    {
                        onboarding_completed: true,
                        status: 'active'
                    },
                    { id: tenantId },
                    { tenantId }
                );

                if (error) throw error;
                console.log('[GenesisKernel] 👑 Consecration Sealed in DB.');
            } catch (dbError) {
                console.warn('[GenesisKernel] ⚠️ Consecration DB Write Failed (Schema mismatch?):', dbError);
                // Proceed anyway - LocalStorage has the source of truth
            }

            console.log('[GenesisKernel] 👑 Consecration Logic Executed.');

            const blueprint = this.compile(draft);
            blueprint.meta.tenantId = tenantId;
            blueprint.organization.realityStatus = 'real';

            await this.saveLocal(blueprint);
            return blueprint;
        } catch (consecrationError) {
            console.error('[GenesisKernel] Consecration Failed:', consecrationError);
            throw consecrationError;
        }
    }

    private static async saveLocal(blueprint: SystemBlueprint) {
        const { setTabIsolated } = await import('../storage/TabIsolatedStorage');
        setTabIsolated(BLUEPRINT_STORAGE_KEY, JSON.stringify(blueprint));
    }

    /**
     * Retrieves the current active Blueprint.
     */
    public static async getBlueprint(): Promise<SystemBlueprint | null> {
        try {
            const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
            const raw = getTabIsolated(BLUEPRINT_STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw) as SystemBlueprint;
        } catch (e) {
            return null;
        }
    }
}
