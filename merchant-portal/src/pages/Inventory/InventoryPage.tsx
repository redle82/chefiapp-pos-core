import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../ui/design-system/EmptyState';
import { Colors, Spacing } from '../../ui/design-system/tokens';

// ------------------------------------------------------------------
// 📦 STOCK (FUTURE MODULE)
// ------------------------------------------------------------------
// Currently disabled for Phase K Pilot.
// Acts as a placeholder for future inventory management features.
// ------------------------------------------------------------------

export const InventoryPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: Spacing['2xl'], minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: Colors.surface.base }}>
            <EmptyState
                icon={<div style={{ fontSize: '64px' }}>📦</div>}
                title="Stock"
                description="Ative a gestão de stock para acompanhar consumos, alertas e reposição automática."
                action={{
                    label: "Voltar ao TPV",
                    onClick: () => navigate('/app/tpv')
                }}
                secondaryAction={{
                    label: "Falar com suporte",
                    onClick: () => window.location.href = 'mailto:support@chefiapp.com'
                }}
            />
        </div>
    );
};
