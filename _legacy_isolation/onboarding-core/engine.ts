import { v4 as uuidv4 } from 'uuid';
import type { InitialOperationalContract, OnboardingSession, StaffRole } from './contracts';
import type { Scene1Input, Scene1Output } from './contracts';
import type { Scene2Input, Scene2Output } from './contracts';
import type { Scene3Input, Scene3Output } from './contracts';
import type { Scene4Input, Scene4Output } from './contracts';
import type { Scene5Input, Scene5Output } from './contracts';
import type { Scene6Input, Scene6Output } from './contracts';

/**
 * ONBOARDING ENGINE
 */
export class OnboardingEngine {
    private session: OnboardingSession;
    private static STORAGE_KEY = 'chefiapp_onboarding_session';

    constructor(existingSession?: OnboardingSession) {
        this.session = existingSession || {
            id: uuidv4(),
            step: 0,
            businessType: null,
            brandGroup: null,
            country: 'PT', // Default for MVP
            createdAt: new Date(),
            updatedAt: new Date(),
            data: {}
        };
    }

    public getSession(): OnboardingSession {
        return this.session;
    }

    // --- Persistence ---
    public static load(): OnboardingEngine | null {
        try {
            const saved = localStorage.getItem(OnboardingEngine.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Restore dates
                parsed.createdAt = new Date(parsed.createdAt);
                parsed.updatedAt = new Date(parsed.updatedAt);
                return new OnboardingEngine(parsed);
            }
        } catch (e) {
            console.error('Failed to load session', e);
        }
        return null;
    }

    public save(): void {
        try {
            localStorage.setItem(OnboardingEngine.STORAGE_KEY, JSON.stringify(this.session));
        } catch (e) {
            console.error('Failed to save session', e);
        }
    }

    public updateSession(updater: (session: OnboardingSession) => void): void {
        updater(this.session);
        this.session.updatedAt = new Date();
        this.save();
    }

    // --- CONTRACT GENERATION ---
    private generateContract(merchantId: string): InitialOperationalContract {
        const s = this.session;
        const d = s.data;
        const country = s.country || 'PT';
        const businessType = s.businessType || 'other';

        // Infer Roles
        const roles: StaffRole[] = [];
        if (d.staff?.kitchen > 0) roles.push('KITCHEN');
        if (d.staff?.bar > 0) roles.push('BAR');
        if (d.staff?.floor > 0) roles.push('FLOOR');
        roles.push('MANAGER', 'OWNER'); // Always present

        // Infer Alcohol (Heuristic)
        const hasAlcohol = businessType === 'bar' || businessType === 'club' || businessType === 'restaurant';

        return {
            contractVersion: 'v1',
            merchantId: merchantId,
            country: country,
            currency: 'EUR', // Helper: Map country to currency
            timezone: 'Europe/Lisbon', // Helper: Map country to timezone

            businessType: businessType,
            name: d.identity?.name || 'Unnamed Place',
            slug: d.identity?.slug || 'unnamed',

            size: {
                staffCount: d.staff?.totalCount || 1,
                areaEstimate: undefined // Not collected yet
            },

            menuProfile: {
                hasDrinks: (d.menu?.items || []).some((i: any) => i.type === 'drink'),
                hasAlcohol: hasAlcohol,
                hasKitchen: (d.menu?.items || []).some((i: any) => i.type === 'food'),
                baseTemplates: d.menu?.drinkTemplates || [],
                importedFrom: 'NONE',
                items: d.menu?.items || []
            },

            staffProfile: {
                roles: roles,
                autopilotEnabled: d.tasks?.enabled || false,
                distribution: {
                    kitchen: d.staff?.kitchen || 0,
                    floor: d.staff?.floor || 1,
                    bar: d.staff?.bar || 0
                }
            },

            complianceContext: {
                country: country,
                fiscalRequired: true, // Default safe assumption
                verifactuRequired: country === 'ES' // Spain Requirement
            },

            detectedSources: {
                googleBusiness: false,
                instagram: false,
                facebook: false,
                menuPdf: false
            },

            session: {
                token: s.id,
                createdAt: s.createdAt.getTime()
            }
        };
    }

    // --- SCENE 1: HOOK ---
    public submitScene1(input: Scene1Input): Scene1Output {
        if (!input.readyToStart) {
            throw new Error("User must be ready to start.");
        }
        this.session.step = 1;
        this.session.updatedAt = new Date();
        this.save();
        return { success: true, nextScene: 'identity' };
    }

    // --- SCENE 2: IDENTITY ---
    public submitScene2(input: Scene2Input): Scene2Output {
        this.session.businessType = input.businessType;
        this.session.brandGroup = input.brandGroup;
        this.session.data.identity = {
            name: input.name,
            slug: input.slug
        };
        this.session.step = 2;
        this.session.updatedAt = new Date();
        this.save();

        return {
            success: true,
            nextScene: 'skeleton',
            sessionToken: this.session.id
        };
    }

    // --- SCENE 3: SKELETON ---
    public submitScene3(input: Scene3Input): Scene3Output {
        this.session.data.skeleton = input.categories;
        this.session.step = 3;
        this.session.updatedAt = new Date();
        this.save();
        return { success: true, nextScene: 'beverages' };
    }

    // --- SCENE 4: BEVERAGES ---
    public submitScene4(input: Scene4Input): Scene4Output {
        this.session.data.beverages = input.items;
        this.session.step = 4;
        this.session.updatedAt = new Date();

        const isBarOnly = this.session.businessType === 'bar' || this.session.businessType === 'club';
        this.save();
        return {
            success: true,
            nextScene: isBarOnly ? 'summary' : 'cuisine'
        };
    }

    // --- SCENE 5: CUISINE ---
    public submitScene5(input: Scene5Input): Scene5Output {
        this.session.data.cuisine = input.items;
        this.session.step = 5;
        this.session.updatedAt = new Date();
        this.save();
        return { success: true, nextScene: 'summary' };
    }

    // --- SCENE 6: SUMMARY ---
    public async submitScene6(input: Scene6Input): Promise<Scene6Output> {
        if (!input.acceptedTerms) {
            throw new Error("Terms must be accepted.");
        }

        const merchantId = `m_${this.session.id.substring(0, 8)}`;

        // GENERATE THE CONTRACT
        const contract = this.generateContract(merchantId);

        this.session.step = 6;
        this.session.updatedAt = new Date();
        // this.session.merchantId = merchantId; // Deprecated
        // this.session.sessionToken = this.session.id; // Deprecated
        this.session.contract = contract;

        this.save();

        return {
            success: true,
            redirectUrl: '/app/tpv',
            contract: contract
        };
    }
}
