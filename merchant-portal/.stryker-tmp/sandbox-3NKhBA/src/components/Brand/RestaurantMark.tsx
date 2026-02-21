// @ts-nocheck
import React from 'react';
import { getInitials, BRAND_COLORS } from '../../core/brand/brand';

interface RestaurantMarkProps {
    name?: string;
    logoUrl?: string | null;
    size?: number; // default 96 large, 40 small
    className?: string; // for extra positioning
}

export const RestaurantMark: React.FC<RestaurantMarkProps> = ({ name, logoUrl, size = 96, className }) => {
    const initials = getInitials(name);
    const fontSize = Math.floor(size * 0.4);

    return (
        <div className={className} style={{
            width: size, height: size,
            position: 'relative',
            borderRadius: '50%',
            background: logoUrl ? 'transparent' : '#fff',
            color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: fontSize, fontWeight: 800, letterSpacing: '-1px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            border: `1px solid ${BRAND_COLORS.gold}`,
            overflow: 'hidden'
        }}>
            {/* Ambient Ring */}
            <div style={{
                position: 'absolute', inset: -2, borderRadius: '50%',
                border: `2px solid rgba(252, 211, 77, 0.3)`,
                pointerEvents: 'none'
            }} />

            {logoUrl ? (
                <img src={logoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <span style={{ fontFamily: 'Inter, sans-serif' }}>{initials}</span>
            )}
        </div>
    );
};
