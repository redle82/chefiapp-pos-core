/**
 * Mock for SystemStateProvider
 * 
 * Used in tests to avoid JSX compilation issues.
 */

export interface SystemState {
    blueprint: any | null;
    restaurant: {
        id: string | null;
        name: string | null;
        setupStatus: string | null;
    };
    isOnboardingComplete?: boolean;
    isActivationComplete?: boolean;
    currentPhase?: string;
}

export const mockSystemState: SystemState = {
    blueprint: null,
    restaurant: {
        id: null,
        name: null,
        setupStatus: null,
    },
    isOnboardingComplete: false,
    isActivationComplete: false,
    currentPhase: 'foundation',
};

// Export default for compatibility
export default {
    SystemState,
    mockSystemState,
};
