import React from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import type { TurnSession } from '../../../core/context/ContextTypes';

interface OperationalModeIndicatorProps {
    session: TurnSession;
    onLock: () => void;
}

export const OperationalModeIndicator: React.FC<OperationalModeIndicatorProps> = ({ session, onLock }) => {
    const isTower = session.operational_mode === 'tower';
    const isRush = session.operational_mode === 'rush';
    const isTraining = session.operational_mode === 'training';

    let modeColor = colors.info.base; // Default Blue
    let modeLabel = 'Modo Padrão';
    let modeIcon = '🟢';

    if (isTower) {
        modeColor = colors.info.base; // Indigo/Blue for Intelligence/Control
        modeLabel = 'Torre de Controle';
        modeIcon = '🧠';
    } else if (isRush) {
        modeColor = colors.warning.base; // Amber for Alert/Speed
        modeLabel = 'Modo Rush';
        modeIcon = '⚡';
    } else if (isTraining) {
        modeColor = colors.success.base; // Green for Safety
        modeLabel = 'Modo Treino';
        modeIcon = '🛡️';
    }

    return (
        <Card
            surface="layer2"
            padding="sm"
            style={{
                borderLeft: `4px solid ${modeColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing[4]
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <span style={{ fontSize: '20px' }}>{modeIcon}</span>
                <div>
                    <Text size="sm" weight="bold" style={{ color: modeColor }}>{modeLabel.toUpperCase()}</Text>
                    <Text size="xs" color="tertiary">
                        {session.role_at_turn.toUpperCase()} • {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </div>
            </div>

            {/* Optional Actions specific to mode could go here */}
        </Card>
    );
};
