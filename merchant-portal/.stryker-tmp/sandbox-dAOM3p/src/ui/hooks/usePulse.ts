// @ts-nocheck
import { useEffect, useState } from 'react';
import { SystemEvents } from '../../core/events/SystemEvents';

/**
 * usePulse Hook (Part of Cytoplasm Design System)
 * 
 * Connects any React component to the Metabolic Clock.
 * Returns a 'beat' boolean that toggles every time the system pulses (30s).
 * Use this to trigger subtle animations, re-check validities, or "breathe".
 */
export const usePulse = () => {
    const [pulseId, setPulseId] = useState<string | null>(null);
    const [lastPulseAt, setLastPulseAt] = useState<number>(0);

    useEffect(() => {
        const handlePulse = (payload: any) => {
            setPulseId(payload.id);
            setLastPulseAt(payload.timestamp);
        };

        SystemEvents.on('metabolic:pulse', handlePulse);
        return () => SystemEvents.off('metabolic:pulse', handlePulse);
    }, []);

    return {
        pulseId,
        lastPulseAt,
        isAlive: !!pulseId
    };
};
