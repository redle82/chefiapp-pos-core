import React, { useState, useEffect } from 'react';
import { Colors } from '../../../ui/design-system/tokens';

interface OrderTimerProps {
    createdAt: string;
}

export const OrderTimer: React.FC<OrderTimerProps> = ({ createdAt }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = new Date(createdAt).getTime();

        const update = () => {
            const now = Date.now();
            setElapsed(Math.floor((now - start) / 1000));
        };

        update(); // Initial
        const timer = setInterval(update, 1000);

        return () => clearInterval(timer);
    }, [createdAt]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Color logic
    // < 5 min: Green (Normal)
    // 5-15 min: Yellow (Warning)
    // > 15 min: Red (Critical)
    let color = Colors.info; // Default Blue/Green equivalent
    if (elapsed > 15 * 60) {
        color = Colors.risk.high; // Red
    } else if (elapsed > 5 * 60) {
        color = Colors.risk.medium; // Yellow
    } else {
        color = Colors.risk.low; // Green
    }

    return (
        <span style={{
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: color,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.3)',
            minWidth: '60px',
            textAlign: 'center',
            display: 'inline-block'
        }}>
            {formatTime(elapsed)}
        </span>
    );
};
