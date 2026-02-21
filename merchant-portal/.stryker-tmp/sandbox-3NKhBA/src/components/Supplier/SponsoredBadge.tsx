// @ts-nocheck
import React from 'react';
import type { Placement } from '../../types/supplier';

interface SponsoredBadgeProps {
    placement?: Placement;
}

export const SponsoredBadge: React.FC<SponsoredBadgeProps> = ({ placement }) => {
    if (!placement || !placement.supplier) return null;

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            color: '#666',
            backgroundColor: '#f0f0f0',
            padding: '2px 8px',
            borderRadius: '12px',
            marginLeft: '8px',
            verticalAlign: 'middle'
        }}>
            <span style={{ fontSize: '0.7em', textTransform: 'uppercase', opacity: 0.8 }}>Oferecido por</span>
            <strong style={{ color: placement.supplier.brand_color || '#333' }}>
                {placement.supplier.name}
            </strong>
        </span>
    );
};
