// @ts-nocheck
import React from 'react';
import { colors } from '../tokens/colors';
import { Text } from '../primitives/Text';
import { Button } from '../Button';
import { Stepper } from '../primitives/Stepper';

interface Step {
    id: string;
    label: string;
    isCompleted: boolean;
    isActive: boolean;
}

interface OnboardingLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    steps?: Step[];
    primaryAction?: {
        label: string;
        onClick: () => void;
        disabled?: boolean;
        loading?: boolean;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
    children,
    title,
    subtitle,
    steps,
    primaryAction,
    secondaryAction
}) => {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundImage: 'radial-gradient(circle at 50% 0%, #1f1f1f 0%, #000000 100%)',
            color: colors.text.primary,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* 1. DISCREET HEADER (Empty for focus) */}
            <header style={{
                height: 32, // Reduced height
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // borderBottom: `1px solid ${colors.border.subtle}` // Removed border
            }} />

            {/* 2. MAIN CONTENT AREA */}
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center', // Centered focus
                padding: '40px 20px',
                overflowY: 'auto'
            }}>
                <div style={{ width: '100%', maxWidth: 500 }}>

                    {/* STEPPER */}
                    {steps && <Stepper steps={steps} />}

                    {/* TITLE BLOCK */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ marginBottom: 12 }}>
                            <Text size="3xl" weight="bold">{title}</Text>
                        </div>
                        {subtitle && (
                            <div style={{ marginTop: 4 }}>
                                <Text size="base" color="secondary">{subtitle}</Text>
                            </div>
                        )}
                    </div>

                    {/* CONTENT SLOT */}
                    <div style={{ marginBottom: 40 }}>
                        {children}
                    </div>

                </div>
            </main>

            {/* 3. ACTION FOOTER */}
            {(primaryAction || secondaryAction) && (
                <footer style={{
                    padding: '24px',
                    borderTop: `1px solid ${colors.border.subtle}`,
                    backgroundColor: colors.surface.layer1,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 16
                }}>
                    <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 500 }}>
                        {secondaryAction && (
                            <div style={{ flex: 1 }}>
                                <Button
                                    tone="neutral"
                                    variant="ghost"
                                    onClick={secondaryAction.onClick}
                                    style={{ width: '100%' }}
                                >
                                    {secondaryAction.label}
                                </Button>
                            </div>
                        )}
                        {primaryAction && (
                            <div style={{ flex: 2 }}>
                                <Button
                                    tone="action"
                                    onClick={primaryAction.onClick}
                                    disabled={primaryAction.disabled || primaryAction.loading}
                                    style={{ width: '100%' }}
                                >
                                    {primaryAction.loading ? 'Processando...' : primaryAction.label}
                                </Button>
                            </div>
                        )}
                    </div>
                </footer>
            )}
        </div>
    );
};
