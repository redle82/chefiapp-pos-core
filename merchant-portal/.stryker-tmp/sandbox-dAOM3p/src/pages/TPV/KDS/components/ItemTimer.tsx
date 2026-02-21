// @ts-nocheck
import React, { useState, useEffect } from 'react';

interface ItemTimerProps {
    createdAt: Date;
    status: 'pending' | 'preparing' | 'ready' | 'voided';
    startedAt?: Date;
    completedAt?: Date;
    thresholds?: {
        warning: number; // Minutes for Yellow (e.g., 5)
        critical: number; // Minutes for Red (e.g., 15)
    };
    className?: string;
}

export function ItemTimer({
    createdAt,
    status,
    startedAt,
    completedAt,
    thresholds = { warning: 5, critical: 15 },
    className = ''
}: ItemTimerProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        // If completed, show final duration static
        if (status === 'ready' || status === 'voided') {
            const end = completedAt || new Date();
            const start = startedAt || createdAt;
            setElapsed(Math.floor((end.getTime() - start.getTime()) / 1000));
            return;
        }

        // Active timer
        const calculateElapsed = () => {
            const start = startedAt || createdAt;
            const now = new Date();
            setElapsed(Math.floor((now.getTime() - start.getTime()) / 1000));
        };

        calculateElapsed(); // Initial calc
        const interval = setInterval(calculateElapsed, 1000);

        return () => clearInterval(interval);
    }, [createdAt, startedAt, completedAt, status]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getStatusColor = () => {
        if (status === 'ready') return '#32D74B'; // Green
        if (status === 'voided') return '#999';   // Gray

        const minutes = elapsed / 60;
        if (minutes >= thresholds.critical) return '#FF453A'; // Red
        if (minutes >= thresholds.warning) return '#FFD60A';  // Yellow
        return '#32D74B'; // Green (Initial)
    };

    const isCritical = (elapsed / 60) >= thresholds.critical && status !== 'ready' && status !== 'voided';

    const style: React.CSSProperties = {
        backgroundColor: getStatusColor(),
        padding: '4px 8px',
        borderRadius: '4px',
        minWidth: '60px',
        textAlign: 'center',
        color: '#000',
        fontWeight: 'bold',
        fontSize: '12px',
        fontFamily: 'Menlo, monospace',
        display: 'inline-block',
        opacity: (status === 'ready' || status === 'voided') ? 0.8 : 1,
        animation: isCritical ? 'flicker 1s infinite' : 'none'
    };

    return (
        <div style={style} className={className}>
            {formatTime(elapsed)}
        </div>
    );
}
