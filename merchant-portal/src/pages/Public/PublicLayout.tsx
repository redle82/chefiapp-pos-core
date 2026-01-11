import React from 'react';
import { Colors, Spacing, Typography } from '../../ui/design-system/tokens';

interface PublicLayoutProps {
    children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: Colors.surface.base,
            color: Colors.text.primary,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Content Area */}
            <main style={{
                flex: 1,
                width: '100%',
                maxWidth: '1200px',
                margin: '0 auto',
                padding: Spacing['2xl'],
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center' // Center content vertically by default for landing
            }}>
                {children}
            </main>

            {/* Trust Footer */}
            <footer style={{
                borderTop: `1px solid ${Colors.surface.border}`,
                padding: Spacing.xl,
                textAlign: 'center',
                backgroundColor: Colors.neutral[900]
            }}>
                <p style={{ ...Typography.uiSmall, color: Colors.text.tertiary }}>
                    Powered by TechChef • Privacy • Terms
                </p>
            </footer>
        </div>
    );
};

export default PublicLayout;
