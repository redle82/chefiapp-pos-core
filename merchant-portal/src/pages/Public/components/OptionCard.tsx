import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Colors, Spacing, Typography, BorderRadius } from '../../../ui/design-system/tokens';

interface OptionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'info' | 'success' | 'neutral';
    delay?: number;
}

const OptionCard: React.FC<OptionCardProps> = ({
    title,
    description,
    icon: Icon,
    onClick,
    color = 'neutral',
    delay = 0
}) => {
    // Determine color theme
    const getTheme = () => {
        switch (color) {
            case 'primary': return { bg: Colors.status.primary.bg, border: Colors.status.primary.border, icon: Colors.primary };
            case 'secondary': return { bg: 'rgba(26, 77, 122, 0.12)', border: 'rgba(26, 77, 122, 0.25)', icon: Colors.secondary }; // Custom Secondary token gap
            case 'success': return { bg: Colors.status.success.bg, border: Colors.status.success.border, icon: Colors.success };
            case 'info': return { bg: Colors.status.info.bg, border: Colors.status.info.border, icon: Colors.info };
            case 'neutral': default: return { bg: Colors.surface.elevated, border: Colors.surface.border, icon: Colors.text.secondary };
        }
    };

    const theme = getTheme();

    return (
        <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%',
                padding: Spacing.xl,
                background: Colors.surface.elevated,
                border: `1px solid ${Colors.surface.border}`,
                borderRadius: BorderRadius.lg,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '180px', // Touch friendly
            }}
            whileHover={{ scale: 1.02, borderColor: theme.border, backgroundColor: theme.bg }}
            whileTap={{ scale: 0.98 }}
        >
            <div style={{
                padding: Spacing.md,
                borderRadius: BorderRadius.full,
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                marginBottom: Spacing.md,
                color: theme.icon
            }}>
                <Icon size={32} />
            </div>

            <h3 style={{
                ...Typography.h3,
                color: Colors.text.primary,
                marginBottom: Spacing.xs,
            }}>
                {title}
            </h3>

            <p style={{
                ...Typography.uiMedium,
                color: Colors.text.secondary,
                lineHeight: '1.4'
            }}>
                {description}
            </p>

            {/* Decorative Glow */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at 50% 0%, ${theme.border} 0%, transparent 70%)`,
                opacity: 0.1,
                pointerEvents: 'none'
            }} />
        </motion.button>
    );
};

export default OptionCard;
