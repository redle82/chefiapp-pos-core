import React from 'react';
import { Text } from './Text';
import { Button } from './Button';
import { spacing } from '../tokens/spacing';

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    secondaryAction
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing[16],
            textAlign: 'center',
            maxWidth: '480px',
            margin: '0 auto',
            gap: spacing[4]
        }}>
            {icon && (
                <div style={{ marginBottom: spacing[2], opacity: 0.8 }}>
                    {icon}
                </div>
            )}

            <div>
                <Text size="2xl" weight="bold" color="primary">{title}</Text>
                <Text size="base" color="secondary" style={{ marginTop: spacing[2] }}>
                    {description}
                </Text>
            </div>

            {(action || secondaryAction) && (
                <div style={{
                    display: 'flex',
                    gap: spacing[4],
                    marginTop: spacing[6],
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    {action && (
                        <Button tone="action" onClick={action.onClick}>
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button tone="neutral" variant="ghost" onClick={secondaryAction.onClick}>
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
