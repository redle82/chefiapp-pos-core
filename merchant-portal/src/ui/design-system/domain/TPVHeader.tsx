import React from 'react';
import { Text } from '../primitives/Text';
import { colors } from '../tokens/colors';

interface TPVHeaderProps {
    operatorName: string;
    terminalId: string;
    isOnline: boolean;
}

export const TPVHeader: React.FC<TPVHeaderProps> = ({
    operatorName,
    terminalId,
    isOnline
}) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text size="3xl" weight="black" color="primary">TPV | Principal</Text>
                <Text size="sm" color="tertiary" weight="bold">{terminalId} • OPERADOR: {operatorName}</Text>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
                {/* Connection Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isOnline ? colors.success.base : colors.destructive.base
                    }} />
                    <Text size="xs" color="secondary" weight="bold">
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                </div>
            </div>
        </div>
    );
};
