// @ts-nocheck
import React from 'react';
import { usePlan } from '../../core/auth/PlanContext';
import { type Capability } from '../../core/auth/CapabilityMatrix';
import './UpgradeLock.css';

interface UpgradeLockProps {
    capability: Capability;
    title?: string;
    description?: string;
    children?: React.ReactNode;
}

export const UpgradeLock: React.FC<UpgradeLockProps> = ({
    capability,
    title = "Feature Locked",
    description = "Upgrade your plan to unlock this advanced capability.",
    children
}) => {
    const { can, requiredPlan, upgradeTo } = usePlan();

    // If user has capability, render content normally
    if (can(capability)) {
        return <>{children}</>;
    }

    const neededPlan = requiredPlan(capability);

    return (
        <div className="upgrade-lock-container">
            {/* Blurred Content (Optional: render children with blur if passed) */}
            <div className="upgrade-lock-content blurred">
                {children}
            </div>

            {/* Access Denied Overlay */}
            <div className="upgrade-lock-overlay">
                <div className="upgrade-lock-card">
                    <div className="upgrade-lock-icon">🔒</div>
                    <h3 className="upgrade-lock-title">{title}</h3>
                    <p className="upgrade-lock-desc">{description}</p>

                    <div className="upgrade-lock-badge">
                        Available in <strong>{neededPlan}</strong>
                    </div>

                    <button
                        className="upgrade-lock-btn"
                        onClick={() => upgradeTo(neededPlan)}
                    >
                        Upgrade to {neededPlan}
                    </button>
                </div>
            </div>
        </div>
    );
};
