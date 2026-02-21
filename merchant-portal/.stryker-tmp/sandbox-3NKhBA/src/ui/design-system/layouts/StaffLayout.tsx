// @ts-nocheck
import React from 'react';
import { colors } from '../tokens/colors';
import { Text } from '../primitives/Text';
import { Badge } from '../primitives/Badge';

interface StaffLayoutProps {
    children: React.ReactNode;
    title: string;
    userName?: string;
    role?: string;
    status?: 'active' | 'break' | 'offline';
    actions?: React.ReactNode;
    bottomNav?: React.ReactNode;
    onBack?: () => void;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({
    children,
    title,
    userName = 'Staff',
    role = 'Operador',
    status = 'active',
    actions,
    bottomNav,
    onBack
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            backgroundColor: colors.surface.base,
            color: colors.text.primary,
            overflow: 'hidden' // Prevent body scroll
        }}>
            {/* HEADER */}
            <header style={{
                height: 64,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                backgroundColor: colors.surface.layer1,
                borderBottom: `1px solid ${colors.border.subtle}`,
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: colors.text.secondary,
                                fontSize: 20,
                                cursor: 'pointer',
                                padding: 4
                            }}
                        >
                            ←
                        </button>
                    )}
                    <div>
                        <Text size="base" weight="bold" color="primary">{title}</Text>
                        <Text size="xs" color="tertiary">{role} • {userName}</Text>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge
                        status={status === 'active' ? 'ready' : status === 'break' ? 'new' : 'delivered'}
                        label={status.toUpperCase()}
                    />
                </div>
            </header>

            {/* CONTENT */}
            <main style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                paddingBottom: bottomNav ? 16 : 16 // Maintain padding
            }}>
                {children}
            </main>

            {/* BOTTOM ACTIONS (Standard Desktop/Tablet Footer) */}
            {actions && !bottomNav && (
                <footer style={{
                    padding: 16,
                    backgroundColor: colors.surface.layer1,
                    borderTop: `1px solid ${colors.border.subtle}`,
                    display: 'flex',
                    gap: 12,
                    flexShrink: 0
                }}>
                    {actions}
                </footer>
            )}

            {/* MOBILE BOTTOM NAV (Edge-to-Edge) */}
            {bottomNav && (
                <div style={{ flexShrink: 0 }}>
                    {bottomNav}
                </div>
            )}
        </div>
    );
};
