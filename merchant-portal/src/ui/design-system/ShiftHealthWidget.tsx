import React from 'react';
import type { ShiftMetrics } from '../../../intelligence/nervous-system/ShiftEngine';
import { Card } from './primitives/Card';
import { Text } from './primitives/Text';
import { colors } from './tokens/colors';

interface ShiftHealthWidgetProps {
    metrics: ShiftMetrics;
}

export const ShiftHealthWidget: React.FC<ShiftHealthWidgetProps> = ({ metrics }) => {
    const { status, loadIndex, activeStaff, activeTasks } = metrics;

    let toneColor = colors.success.base;
    let label = 'Turno Saudável';

    if (status === 'yellow') {
        toneColor = colors.warning.base;
        label = 'Atenção';
    } else if (status === 'red') {
        toneColor = colors.error.base;
        label = 'Sobrecarga';
    }

    return (
        <Card surface="layer1" padding="sm" style={{ borderLeft: `4px solid ${toneColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Text size="xs" color="tertiary">CARGA HUMANA</Text>
                    <Text size="lg" weight="bold" style={{ color: toneColor }}>
                        {loadIndex} <span style={{ fontSize: 12, color: colors.text.tertiary }}>({activeTasks}/{activeStaff})</span>
                    </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        width: 12, height: 12, borderRadius: '50%',
                        backgroundColor: toneColor,
                        display: 'inline-block',
                        marginRight: 6
                    }} />
                    <Text size="sm" weight="medium">{label}</Text>
                </div>
            </div>
        </Card>
    );
};
