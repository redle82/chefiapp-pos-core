/**
 * THE SYSTEM BLUEPRINT
 * 
 * This is the SINGLE SOURCE OF TRUTH for the application instance.
 * It is generated once by the GenesisKernel and is effectively immutable
 * during the session (unless a major reconfiguration event occurs).
 * 
 * The System Guardian enforces that no UI is loaded without a valid Blueprint.
 */

export interface SystemBlueprint {
    meta: {
        blueprintVersion: string; // e.g., '2.0.0-SOVEREIGN'
        createdAt: string;        // ISO Date
        tenantId: string;         // The unique ID of the restaurant
        environment: 'dev' | 'staging' | 'production';
    };

    identity: {
        userName: string;
        userRole: 'Owner' | 'Manager' | 'Technical';
        userId: string;           // Link to Auth Store
    };

    organization: {
        restaurantName: string;
        city: string;
        businessType: 'Restaurant' | 'Bar' | 'Cafe' | 'FastFood' | 'Other';
        logoUrl?: string;         // Optional, user might not upload

        /**
         * Reality Status:
         * - 'draft': Blueprint created, but physical existence not verified. Menu creation blocked.
         * - 'verified': Light verification passed (Location/Doc/Payment). Menu Enabled.
         * - 'active': Fully operational.
         */
        realityStatus: 'draft' | 'verified' | 'active';

        verification?: {
            method: 'places' | 'doc' | 'ip' | 'payment' | 'qr_local';
            verifiedAt: string;
            evidenceId?: string;
        };
    };

    operation: {
        teamSize: '1-5' | '6-15' | '15+';
        mode: 'Gamified' | 'Executive';
    };

    product: {
        menuStrategy: 'Quick' | 'Manual';
    };

    systemProfiles: {
        uiProfile: {
            theme: 'vibrant' | 'minimal';
            density: 'comfortable' | 'compact';
        };
        layoutProfile: {
            showOnboardingTasks: boolean;
            sidebarMode: 'expanded' | 'collapsed';
        };
        permissionProfile: {
            canManageTeam: boolean;
            canEditMenu: boolean;
            isOwner: boolean;
        };
        workflowProfile: {
            requireKitchenConfirmation: boolean;
            enableTableService: boolean;
        };
    };

    boot: {
        status: 'pending' | 'booting' | 'ready';
        bootLog: Array<{
            timestamp: number;
            message: string;
            status: 'ok' | 'error';
        }>;
    };
}
