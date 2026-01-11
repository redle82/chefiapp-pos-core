import React from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';

import { OSFrame } from '../sovereign/OSFrame';
import { FireSystem } from '../sovereign/FireSystem';

interface AdminLayoutProps {
    sidebar: React.ReactNode;
    content: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ sidebar, content }) => {
    // Explicitly using Dashboard Mode Tokens
    const theme = colors.modes.dashboard;

    // SOVEREIGN STATE: Ember
    const thermalState = FireSystem.ember;

    return (
        <OSFrame context="dashboard">
            <div
                style={{
                    color: theme.text.primary,
                    height: '100vh',
                    width: '100%',
                    display: 'flex',
                    overflow: 'hidden'
                }}
            >
                {/* 1. SIDEBAR ZONE */}
                <aside style={{
                    width: '280px',
                    borderRight: `1px solid ${theme.border.subtle}`,
                    backgroundColor: theme.surface.layer1,
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 20
                }}>
                    {sidebar}
                </aside>

                {/* 2. MAIN CONTENT ZONE */}
                <main style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                    position: 'relative'
                }}>
                    <div style={{ padding: spacing[8], maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                        {content}
                    </div>
                </main>
            </div>
        </OSFrame>
    );
};
