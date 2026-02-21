/**
 * OriginBadge — Badge de Origem do Pedido
 * 
 * OBJETIVO: Sempre mostrar de onde veio o pedido (TPV/Web/Mobile)
 * 
 * PRINCÍPIO: Origem Clara — O cozinheiro precisa saber a origem sem pensar
 */

import React from 'react';

import type { OrderOrigin } from '../../../../core/contracts';

interface OriginBadgeProps {
    origin?: OrderOrigin;
    className?: string;
}

const ORIGIN_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    // TPV / Caixa
    'CAIXA': { label: 'CAIXA', color: '#22C55E', icon: '💰' },
    'TPV': { label: 'CAIXA', color: '#22C55E', icon: '💰' },
    'local': { label: 'CAIXA', color: '#22C55E', icon: '💰' },
    
    // Web
    'WEB': { label: 'WEB', color: '#F59E0B', icon: '🌐' },
    'WEB_PUBLIC': { label: 'WEB', color: '#F59E0B', icon: '🌐' },
    'web': { label: 'WEB', color: '#F59E0B', icon: '🌐' },
    
    // QR Mesa
    'QR_MESA': { label: 'QR MESA', color: '#EC4899', icon: '📱' },
    
    // Mobile / Garçom
    'GARÇOM': { label: 'GARÇOM', color: '#3B82F6', icon: '📱' },
    'MOBILE': { label: 'GARÇOM', color: '#3B82F6', icon: '📱' },
    'APPSTAFF': { label: 'APPSTAFF', color: '#8B5CF6', icon: '👤' },
    'external': { label: 'EXTERNO', color: '#8B5CF6', icon: '🔗' },
};

export const OriginBadge: React.FC<OriginBadgeProps> = ({ origin, className = '' }) => {
    if (!origin) {
        // Default: assumir TPV se não especificado
        origin = 'CAIXA';
    }

    const config = ORIGIN_CONFIG[origin] || ORIGIN_CONFIG['CAIXA'];
    
    return (
        <span
            className={className}
            style={{
                background: config.color,
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: `0 2px 4px rgba(0, 0, 0, 0.2)`,
            }}
        >
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
};
