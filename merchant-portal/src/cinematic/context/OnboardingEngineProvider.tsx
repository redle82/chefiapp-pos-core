import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { OnboardingEngine } from '../../onboarding-core';
import type { OnboardingSession } from '../../onboarding-core/contracts';

// We just expose the engine instance directly, or we can expose methods.
// Using the engine instance allows components to call engine.submitSceneX() directly.
// But we need to trigger re-renders when state changes.
// The Engine itself is not an Observable (yet).

interface OnboardingContextValue {
    engine: OnboardingEngine;
    session: OnboardingSession;
    refresh: () => void; // Force update
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export const OnboardingEngineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize Engine. Logic to load from persistence could go here or inside Engine.load()
    const [engine] = useState(() => OnboardingEngine.load() || new OnboardingEngine());
    const [session, setSession] = useState<OnboardingSession>(engine.getSession());

    // Helper to force React to update when Engine logic runs
    const refresh = () => {
        engine.save(); // Persist on every update
        setSession({ ...engine.getSession() }); // New object ref to trigger render
    };

    // We might want to proxy the engine methods to auto-refresh, but for now explicit refresh is safer.
    // Actually, let's wrap the engine methods in a proxy or just expect calls to use helper?
    // Let's rely on components calling refresh() or returns.
    // Better: The hook "useOnboarding" should provide wrappers.

    return (
        <OnboardingContext.Provider value={{ engine, session, refresh }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboardingEngine = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboardingEngine must be used within OnboardingEngineProvider');
    }
    return context;
};
