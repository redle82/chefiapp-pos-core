import React from 'react';
import { Colors } from '../../../ui/design-system/tokens';

interface KDSLayoutProps {
    children: React.ReactNode;
}

export const KDSLayout: React.FC<KDSLayoutProps> = ({ children }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: Colors.kds.background, // Maintain KDS Dark Theme
            color: Colors.kds.text.primary,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999 // Force top layer
        }}>
            {/* 
               Layer of isolation 
               We could add global "Flash Messages" specific to kitchen here later.
            */}
            {children}
        </div>
    );
};
