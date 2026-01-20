import React, { useEffect, useState } from 'react';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { Text } from '../../../ui/design-system/primitives/Text';
import type { OperationalInsight } from '../../../intelligence/nervous-system/OperationalCortex';

interface InsightTickerProps {
    insight: OperationalInsight | null;
    isListening?: boolean;
    onToggleListening?: () => void;
}

export const InsightTicker: React.FC<InsightTickerProps> = ({ insight, isListening, onToggleListening }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (insight || isListening) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [insight, isListening]);

    // Always render if listening (to show mic), even if no insight (or use a placeholder insight)
    // Actually, TPV always renders it, but returns NULL if !insight.
    // We should allow it to render if isListening is true.
    if (!insight && !isListening) return null;

    const currentMessage = isListening ? "Ouvindo..." : (insight?.message || "");
    const currentSeverity = isListening ? 'listening_mode' : (insight?.severity || 'info');

    const getColors = (severity: string) => {
        switch (severity) {
            case 'critical': return { bg: colors.critical.base, text: '#FFFFFF', icon: '🚨' };
            case 'warning': return { bg: colors.warning.base, text: colors.text.primary, icon: '⚠️' };
            case 'positive': return { bg: colors.success.base, text: '#FFFFFF', icon: '✨' };
            case 'listening_mode': return { bg: colors.action.base, text: '#FFFFFF', icon: '🎤' };
            default: return { bg: colors.surface.layer3, text: colors.text.secondary, icon: '🧠' };
        }
    };

    const style = getColors(currentSeverity);

    return (
        <div style={{
            width: '100%',
            backgroundColor: style.bg,
            color: style.text,
            padding: `${spacing[2]} ${spacing[4]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center', // Centered for "Command" feel
            gap: spacing[3],
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.3s ease-in-out',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            // Animate entry
            animation: 'slideDown 0.4s ease-out forwards',
            borderRadius: '0 0 8px 8px' // Rounded bottom corners
        }}>
            <span style={{ fontSize: '18px' }}>{style.icon}</span>
            <span style={{ letterSpacing: '0.02em', flex: 1, textAlign: 'center' }}>
                {currentMessage}
            </span>
            {(!isListening && insight?.actionLabel) && (
                <button style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    color: 'inherit',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '12px'
                }}>
                    {insight.actionLabel} →
                </button>
            )}
            {isListening && (
                <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    animation: 'pulse 1s infinite'
                }} />
            )}

            {onToggleListening && (
                <button
                    onClick={onToggleListening}
                    style={{
                        backgroundColor: isListening ? 'rgba(255,255,255,0.3)' : 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'inherit',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    title="Controle de Voz"
                >
                    🎤
                </button>
            )}

            <style>{`
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.7; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.7; }
                }
            `}</style>
        </div>
    );
};
