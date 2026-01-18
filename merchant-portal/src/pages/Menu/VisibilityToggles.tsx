import React from 'react';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { spacing } from '../../ui/design-system/tokens/spacing';
import { colors } from '../../ui/design-system/tokens/colors';

export interface SurfaceVisibility {
    tpv: boolean;
    web: boolean;
    delivery: boolean;
}

export const DEFAULT_VISIBILITY: SurfaceVisibility = { tpv: true, web: true, delivery: true };

interface VisibilityTogglesProps {
    value: SurfaceVisibility;
    onChange: (value: SurfaceVisibility) => void;
}

export const VisibilityToggles: React.FC<VisibilityTogglesProps> = ({ value, onChange }) => {

    const toggle = (key: keyof SurfaceVisibility) => {
        onChange({ ...value, [key]: !value[key] });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            <Text size="sm" weight="bold" color="secondary">Disponibilidade (Superfícies)</Text>
            <div style={{ display: 'flex', gap: spacing[2] }}>
                <ToggleButton
                    active={value.tpv}
                    onClick={() => toggle('tpv')}
                    icon="📠"
                    label="TPV / Caixa"
                />
                <ToggleButton
                    active={value.web}
                    onClick={() => toggle('web')}
                    icon="🖥️"
                    label="Web / QR"
                />
                <ToggleButton
                    active={value.delivery}
                    onClick={() => toggle('delivery')}
                    icon="🛵"
                    label="Apps Delivery"
                />
            </div>
        </div>
    );
};

const ToggleButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
    <div
        onClick={onClick}
        style={{
            flex: 1,
            padding: spacing[3],
            borderRadius: 8,
            border: `1px solid ${active ? colors.modes.dashboard.primary.base : colors.modes.dashboard.border.subtle}`,
            backgroundColor: active ? `${colors.modes.dashboard.primary.base}10` : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s',
            opacity: active ? 1 : 0.6
        }}
    >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: active ? colors.modes.dashboard.primary.base : colors.modes.dashboard.text.tertiary }}>
            {label}
        </span>
    </div>
);
