import React from 'react';
import { Text } from '../primitives/Text';
import { colors } from '../tokens/colors';

interface TPVHeaderProps {
    operatorName: string;
    terminalId: string;
    isOnline: boolean;
    restaurantName?: string;
    voiceControl?: {
        isListening: boolean;
        isAvailable: boolean;
        onToggle: () => void;
    };
}

export const TPVHeader: React.FC<TPVHeaderProps> = ({
    operatorName,
    terminalId,
    isOnline,
    restaurantName = 'ChefIApp',
    voiceControl
}) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Brand Name - Large & Prominent */}
                <Text size="3xl" weight="black" color="primary" style={{ letterSpacing: '-0.02em' }}>
                    {restaurantName.toUpperCase()}
                </Text>

                {/* System Info - Secondary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text size="xs" weight="bold" color="action">TPV PRINCIPAL</Text>
                    <Text size="xs" color="tertiary">•</Text>
                    <Text size="xs" color="tertiary" weight="semibold">{terminalId}</Text>
                    <Text size="xs" color="tertiary">•</Text>
                    <Text size="xs" color="tertiary">OP: {operatorName}</Text>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {/* Voice Control (Innovation) */}
                {voiceControl && voiceControl.isAvailable && (
                    <div
                        onClick={voiceControl.onToggle}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 36, height: 36,
                            borderRadius: '50%',
                            backgroundColor: voiceControl.isListening ? colors.action.base : colors.surface.layer2,
                            cursor: 'pointer',
                            boxShadow: voiceControl.isListening ? `0 0 12px ${colors.action.base}` : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: 18 }}>
                            {voiceControl.isListening ? '🎤' : '🎙️'}
                        </span>
                    </div>
                )}

                {/* Connection Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: colors.surface.layer2, padding: '4px 8px', borderRadius: 100 }}>
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isOnline ? colors.success.base : colors.destructive.base,
                        boxShadow: isOnline ? `0 0 8px ${colors.success.base}` : 'none'
                    }} />
                    <Text size="xs" color="secondary" weight="bold">
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                </div>
            </div>
        </div>
    );
};
