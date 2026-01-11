import { useEffect, useState } from 'react';
import { supabase } from '../../core/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface HealthState {
    status: 'ONLINE' | 'CRITICAL' | 'WARNING' | 'RECOVERED' | 'RECOVERY';
    message: string;
    details?: string;
    metadata?: any;
}

export const SystemHealthCard = ({ restaurantId }: { restaurantId: string }) => {
    const [health, setHealth] = useState<HealthState>({ status: 'ONLINE', message: 'Sistema Operacional' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        const checkHealth = async () => {
            try {
                // 1. Check for Recovery Mode Pulse (Most recent)
                const { data: pulses } = await supabase
                    .from('empire_pulses')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .order('created_at', { ascending: false })
                    .limit(5); // Check recent history

                const isRecovery = pulses?.some(p => p.type === 'SYSTEM_RECOVERY_MODE');

                // 2. Check for Active Alerts
                const { data: alerts } = await supabase
                    .from('alerts')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .is('resolved_at', null) // Only active
                    .order('created_at', { ascending: false });

                if (isRecovery) {
                    const recoveryPulse = pulses?.find(p => p.type === 'SYSTEM_RECOVERY_MODE');
                    setHealth({
                        status: 'RECOVERY',
                        message: 'Modo de Recuperação Ativo',
                        details: `O sistema está mitigando instabilidades detectadas.`,
                        metadata: recoveryPulse?.payload
                    });
                } else if (alerts && alerts.length > 0) {
                    const alert = alerts[0]; // Take most recent/severe

                    let status: HealthState['status'] = 'CRITICAL';
                    if (alert.severity === 'warning') status = 'WARNING';

                    let message = alert.message || 'Alerta de Sistema Ativo';
                    let details = '';
                    const confidenceStr = alert.metadata?.confidence ? ` (Confianca: ${Math.round(alert.metadata.confidence * 100)}%)` : '';

                    // Specific handling for common types
                    if (alert.alert_type === 'ALERT_NO_PULSE') {
                        message = 'Silêncio Operacional';
                        details = `Sem atividade há ${alert.metadata?.silenceMinutes || '?'} min${confidenceStr}`;
                    } else if (alert.alert_type === 'OPERATIONAL_DELAY') {
                        message = 'Atraso em Cadeia';
                        details = `${alert.metadata?.count || '3+'} pedidos atrasados nos últimos 10 min${confidenceStr}`;
                    } else if (alert.alert_type === 'CHAOS_PATTERN') {
                        message = 'Instabilidade Detectada';
                        details = `Padrão de erros anormais detectado${confidenceStr}`;
                    }

                    setHealth({
                        status,
                        message,
                        details,
                        metadata: alert.metadata
                    });
                } else {
                    setHealth({ status: 'ONLINE', message: 'Tudo em Ordem', details: 'Monitoramento ativo e estável.' });
                }
            } catch (e) {
                console.error('Health check failed', e);
            } finally {
                setLoading(false);
            }
        };

        checkHealth();

        const channel = supabase
            .channel('health-widget-v1.1')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `restaurant_id=eq.${restaurantId}` }, () => checkHealth())
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'empire_pulses', filter: `restaurant_id=eq.${restaurantId}` }, () => checkHealth())
            .subscribe();

        return () => { supabase.removeChannel(channel); };

    }, [restaurantId]);

    if (loading) return <div style={{ height: 100, background: 'rgba(255,255,255,0.02)', borderRadius: 16 }} />;

    const colors = {
        CRITICAL: { bg: 'rgba(255, 69, 58, 0.1)', border: 'rgba(255, 69, 58, 0.3)', dot: '#ff453a', glow: 'rgba(255, 69, 58, 0.4)' },
        WARNING: { bg: 'rgba(255, 214, 10, 0.1)', border: 'rgba(255, 214, 10, 0.3)', dot: '#ffd60a', glow: 'rgba(255, 214, 10, 0.4)' },
        ONLINE: { bg: 'rgba(50, 215, 75, 0.1)', border: 'rgba(50, 215, 75, 0.3)', dot: '#32d74b', glow: 'rgba(50, 215, 75, 0.5)' },
        RECOVERED: { bg: 'rgba(50, 215, 75, 0.1)', border: 'rgba(50, 215, 75, 0.3)', dot: '#32d74b', glow: 'none' },
        RECOVERY: { bg: 'rgba(10, 132, 255, 0.1)', border: 'rgba(10, 132, 255, 0.3)', dot: '#0a84ff', glow: 'rgba(10, 132, 255, 0.6)' }
    };

    const config = colors[health.status] || colors.ONLINE;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
                <motion.div
                    animate={health.status === 'RECOVERY' ? { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] } : { opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: health.status === 'RECOVERY' ? 1.5 : 2 }}
                    style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: config.dot,
                        boxShadow: `0 0 12px ${config.glow}`
                    }}
                />

                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                        {health.message}
                    </h3>
                    <p style={{ opacity: 0.7, fontSize: '14px', margin: 0 }}>
                        {health.details}
                    </p>
                </div>
            </div>

            <div style={{ textAlign: 'right', zIndex: 1 }}>
                <span style={{ fontSize: '10px', opacity: 0.5, display: 'block', letterSpacing: 1, fontWeight: 700 }}>ENGINE CORE v1.1</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: config.dot }}>
                    {health.status === 'ONLINE' ? 'ESTÁVEL' : health.status === 'RECOVERY' ? 'RECOVERY' : 'OBSERVANDO'}
                </span>
            </div>

            {/* Subtle progress/scan effect if not online */}
            {health.status !== 'ONLINE' && (
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
                        background: `linear-gradient(90deg, transparent, ${config.dot}, transparent)`
                    }}
                />
            )}
        </motion.div>
    );
};

