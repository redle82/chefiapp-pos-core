import React from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import type { AICopilotSuggestion } from '../../../core/loyalty/LoyaltyUtils';
import { Sparkles } from 'lucide-react';

interface CopilotWidgetProps {
    suggestion: AICopilotSuggestion;
    onDismiss: () => void;
    onAction?: () => void;
}

export const CopilotWidget: React.FC<CopilotWidgetProps> = ({ suggestion, onDismiss, onAction }) => {
    const bgColor = suggestion.type === 'upsell' ? colors.primary.base : colors.secondary.base;

    return (
        <div style={{ position: 'relative', animation: 'fadeIn 0.5s ease-out' }}>
            <Card surface="layer2" padding="sm" style={{
                border: `1px solid ${bgColor}`,
                background: `linear-gradient(90deg, ${bgColor}10 0%, transparent 100%)`,
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3]
            }}>
                <div style={{
                    width: 32, height: 32,
                    borderRadius: '50%',
                    backgroundColor: `${bgColor}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Sparkles size={18} color={bgColor} />
                </div>

                <div style={{ flex: 1 }}>
                    <Text size="xs" weight="bold" color="primary">AI Copilot</Text>
                    <Text size="sm" color="primary">{suggestion.message}</Text>
                </div>

                {suggestion.actionLabel && (
                    <button
                        onClick={onAction}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: bgColor,
                            color: 'white',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        {suggestion.actionLabel}
                    </button>
                )}

                <button
                    onClick={onDismiss}
                    style={{
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: colors.text.tertiary,
                        fontSize: '16px'
                    }}
                >
                    &times;
                </button>
            </Card>
        </div>
    );
};
