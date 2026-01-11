import React from 'react';
import { APP_NAME } from '../../core/brand/brand';

interface OnboardingHeaderProps {
    currentStep: number;
    totalSteps: number;
    // Optional: Allow tap handler for debug/panic
    onLogoTap?: () => void;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ currentStep, totalSteps, onLogoTap }) => {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px',
            width: '100%', maxWidth: '480px', height: 'auto', flexShrink: 0
        }}>
            {/* Internal Brand Header */}
            <div
                onClick={onLogoTap}
                style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    opacity: 0.9, cursor: 'default', userSelect: 'none',
                    marginBottom: '16px', marginTop: '8px'
                }}
            >
                <img
                    src={`${window.location.origin}/logo.png`}
                    alt={APP_NAME}
                    style={{ height: '28px', width: 'auto', display: 'block' }}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        // Fallback text if needed, but let's try to enforce image first
                    }}
                />
                <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.5px', color: '#fff' }}>
                    {APP_NAME}
                </span>
            </div>

            {/* Progress Dots */}
            {currentStep >= 0 && currentStep < totalSteps - 1 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {Array.from({ length: 5 }).map((_, idx) => ( // Show first 5 main steps usually
                        <div key={idx} style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: idx <= currentStep ? '#fff' : 'rgba(255,255,255,0.2)',
                            transition: 'background 0.3s ease'
                        }} />
                    ))}
                </div>
            )}
        </div>
    );
};
