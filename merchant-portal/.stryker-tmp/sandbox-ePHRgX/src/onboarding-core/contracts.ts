/**
 * ONBOARDING CORE - CONTRACTS
 * Updated for Cinematic Flow & Rule of Gold
 */
// @ts-nocheck


// --- Primitives ---
export type CountryCode = 'PT' | 'ES' | 'BR' | 'US';
export type BusinessType = 'restaurant' | 'bar' | 'cafe' | 'bakery' | 'club' | 'other';
export type StaffRole = 'KITCHEN' | 'FLOOR' | 'BAR' | 'MANAGER' | 'OWNER';

// --- Sub-Profiles ---

export interface MenuProfile {
    hasDrinks: boolean; // Computed from Scene 4
    hasAlcohol: boolean; // Inferred from business type or items
    hasKitchen: boolean; // Computed from Scene 5 (Food)
    baseTemplates: string[]; // e.g. ['softdrinks', 'beer_pt']
    importedFrom?: 'GOOGLE' | 'FACEBOOK' | 'NONE';
    items?: any[]; // Raw items from Onboarding
}

export interface StaffProfile {
    roles: StaffRole[]; // Inferred from distribution
    autopilotEnabled: boolean;
    distribution: {
        kitchen: number;
        floor: number;
        bar: number;
    };
}

export interface DetectedSources {
    googleBusiness?: boolean;
    instagram?: boolean;
    facebook?: boolean;
    menuPdf?: boolean;
}

export interface ComplianceContext {
    country: CountryCode;
    fiscalRequired: boolean; // e.g. PT=true (SAFT), BR=true (NFCe)
    verifactuRequired?: boolean; // Specific to Spain
}

// --- ARTEFACT: INITIAL OPERATIONAL CONTRACT (v1) ---
export interface InitialOperationalContract {
    // Identity
    merchantId: string;
    country: CountryCode;
    currency: string;
    timezone: string;

    // Business Profile
    businessType: BusinessType;
    name: string;
    slug: string;
    city?: string;

    // Size & Capacity
    size: {
        staffCount: number;
        areaEstimate?: number; // Potential future input
    };

    // Operational Contexts
    menuProfile: MenuProfile;
    staffProfile: StaffProfile;
    complianceContext: ComplianceContext;
    detectedSources: DetectedSources;

    // Session
    session: {
        token: string;
        createdAt: number; // Timestamp
    };

    contractVersion: 'v1';
}

// --- Session State (Internal to Onboarding) ---
export interface OnboardingSession {
    id: string; // UUID
    // steps 1..6
    step: number;

    // Core Identity
    businessType: BusinessType | null;
    brandGroup: string | null;
    country: CountryCode | null;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Flexible Data Bucket for cinematic scenes
    data: {
        identity?: {
            name: string;
            slug: string;
            city?: string;
        };
        skeleton?: string[]; // Categories
        beverages?: any[];
        cuisine?: any[];
        staff?: any;
        tasks?: any;
        menu?: any;
    };

    // Output
    contract?: InitialOperationalContract;
}

// --- Scene Contracts ---

// Scene 1: Hook (Start)
export interface Scene1Input {
    readyToStart: boolean;
}
export interface Scene1Output {
    success: boolean;
    nextScene: string;
}

// Scene 2: Identity (Name, Slug, Type, Brand)
export interface Scene2Input {
    name: string;
    slug: string;
    city?: string;
    businessType: BusinessType;
    brandGroup: string;
}
export interface Scene2Output {
    success: boolean;
    nextScene: string;
    sessionToken: string;
}

// Scene 3: Skeleton (Categories)
export interface Scene3Input {
    categories: string[];
}
export interface Scene3Output {
    success: boolean;
    nextScene: string;
}

// Scene 4: Beverages (Items)
export interface Scene4Input {
    items: any[];
}
export interface Scene4Output {
    success: boolean;
    nextScene: string;
}

// Scene 5: Cuisine (Items)
export interface Scene5Input {
    items: any[];
}
export interface Scene5Output {
    success: boolean;
    nextScene: string;
}

// Scene 6: Summary (Contract)
export interface Scene6Input {
    acceptedTerms: boolean;
}
export interface Scene6Output {
    success: boolean;
    contract: InitialOperationalContract;
    redirectUrl: string;
}
