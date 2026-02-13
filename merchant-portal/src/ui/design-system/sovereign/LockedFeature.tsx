import React from 'react';
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Button } from '../Button';
import { colors } from '../tokens/colors';

interface LockedFeatureProps {
    title: string;
    reason: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const LockedFeature: React.FC<LockedFeatureProps> = ({ title, reason, actionLabel, onAction }) => {
    return (
        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <Card surface="layer1" padding="xl" style={{ maxWidth: 400, textAlign: 'center', border: `1px solid ${colors.border.subtle}` }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
                <Text size="xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>{title}</Text>
                <Text size="md" color="secondary" style={{ marginBottom: 24 }}>{reason}</Text>

                {actionLabel && (
                    <Button tone="action" fullWidth onClick={onAction}>
                        {actionLabel}
                    </Button>
                )}
            </Card>
        </div>
    );
};
