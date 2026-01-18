import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

/**
 * HEADLESS HEALTH CHECK
 * Designed for UptimeRobot / Pingdom
 * Renders minimalistic JSON/Text to save bandwidth.
 */
export const HealthCheck: React.FC = () => {
    const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
    const [latency, setLatency] = useState<number>(0);

    useEffect(() => {
        const check = async () => {
            const start = Date.now();
            try {
                // Check DB Connection
                const { error } = await supabase.from('kernel_registry').select('count').limit(1).single();

                if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows", which implies connection is OK active

                const duration = Date.now() - start;
                setLatency(duration);
                setStatus('ok');
            } catch (err) {
                console.error('Health Check Failed:', err);
                setStatus('error');
            }
        };

        check();
    }, []);

    // Render plain text/json for robots
    if (status === 'error') {
        return <div style={{ color: 'red', fontFamily: 'monospace' }}>500 SYSTEM_FAILURE</div>;
    }

    if (status === 'checking') {
        return <div style={{ color: 'orange', fontFamily: 'monospace' }}>CHECKING...</div>;
    }

    return (
        <div style={{ fontFamily: 'monospace', padding: 20 }}>
            {`{ "status": "ok", "latency": ${latency}, "timestamp": "${new Date().toISOString()}" }`}
        </div>
    );
};
