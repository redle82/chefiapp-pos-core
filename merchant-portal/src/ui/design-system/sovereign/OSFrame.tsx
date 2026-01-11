import React from 'react';
import { FireSystem, getFireStateForContext, type FireState } from './FireSystem';
import { OSSignature } from './OSSignature';
import { cn } from '../tokens';

interface OSFrameProps {
    /**
     * The Operational Context.
     * The Frame determines the correct visual state (FireState) automatically.
     */
    context: 'landing' | 'onboarding' | 'dashboard' | 'auth' | 'public';

    children: React.ReactNode;
    className?: string;

    /**
     * Explicit override if absolutely needed (e.g. specialized error page).
     * Prefer using `context`.
     */
    forcedState?: FireState;
}

/**
 * OSFrame — The Sovereign Container
 * 
 * Enforces Law 1 of the Constitution: Identity is State.
 * Wraps content in the correct Thermal State and renders the Sovereign Signature 
 * where mandated.
 */
export const OSFrame: React.FC<OSFrameProps> = ({
    context,
    forcedState,
    children,
    className
}) => {
    // 1. Resolve State
    // User Feedback: 'public' should be territory of the restaurant (Void), not the OS (Ignition).
    // 'landing' remains Ignition.
    const fireState = forcedState || getFireStateForContext(context === 'public' ? 'void' : context);

    const thermalRules = FireSystem[fireState];

    // 2. Resolve Background
    const backgroundStyle = {
        background: thermalRules.background,
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'relative' as const,
        overflow: 'hidden'
    };

    // 3. Resolve Signature Visibility
    // Law 3: Signature appears in Admin/Auth/Onboarding (Sovereign Territory).
    // It does NOT appear in 'public' (Tenant Territory).
    const showSignature = context !== 'public';

    // Signature positioning rules
    const isDashboard = context === 'dashboard';

    // Landing pages usually have their own Navbar with the logo embedded.
    // We shouldn't force a floating logo on top of a semantic header.
    const isLanding = context === 'landing';

    return (
        <div style={backgroundStyle} className={className}>
            {/* 
               Layer 1: The Signature (Flag)
               - Dashboard: Handled by AdminSidebar
               - Landing: Handled by Hero/Navbar
               - Public: Hidden (Tenant Territory)
               - Auth/Onboarding: PROMOTED (Floating Sovereign Mark)
            */}
            {showSignature && !isDashboard && !isLanding && (
                <div style={{
                    position: 'absolute',
                    top: 24,
                    left: 24,
                    zIndex: 50
                }}>
                    <OSSignature state={fireState} size="md" />
                </div>
            )}

            {/* Layer 2: The Content */}
            <div style={{ flex: 1, position: 'relative', zIndex: 10 }}>
                {children}
            </div>

            {/* Layer 3: Noise/Texture (Optional Future) */}
        </div>
    );
};
