import React, { useEffect, useState } from 'react';
import { Colors, Spacing, Typography } from '../../ui/design-system/tokens';
import { Card } from '../../ui/design-system/Card';
import { Badge } from '../../ui/design-system/Badge';
import { supabase } from '../../core/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface SentimentReflectorProps {
    restaurantId: string | null;
}

export const SentimentReflector: React.FC<SentimentReflectorProps> = ({ restaurantId }) => {
    const [loops, setLoops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        const fetchLoops = async () => {
            const { data } = await supabase
                .from('empire_pulses')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('type', 'EXTERNAL_LOOP_TRIGGERED')
                .order('created_at', { ascending: false })
                .limit(5);

            setLoops(data || []);
            setLoading(false);
        };

        fetchLoops();

        // Realtime subscription
        const channel = supabase
            .channel(`external_loops_${restaurantId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'empire_pulses',
                filter: `restaurant_id=eq.${restaurantId}`
            }, (payload) => {
                if (payload.new.type === 'EXTERNAL_LOOP_TRIGGERED') {
                    setLoops(prev => [payload.new, ...prev].slice(0, 5));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    const momentumScore = loops.length > 0 ? Math.min(loops.length * 20, 100) : 0;

    return (
        <Card padding="lg" style={{ background: 'rgba(50, 215, 75, 0.05)', border: '1px solid rgba(50, 215, 75, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>↗️</span> Momentum de Reputação
                </h3>
                <Badge variant={momentumScore > 50 ? 'success' : 'secondary'}>
                    {momentumScore}% Estabilidade
                </Badge>
            </div>

            <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: Spacing.lg }}>
                O sistema está convertendo sua estabilidade operacional em valor externo.
            </p>

            <div style={{ marginBottom: Spacing.xl }}>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${momentumScore}%` }}
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #32d74b, #64ffda)',
                            boxShadow: '0 0 10px rgba(50, 215, 75, 0.5)'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px', opacity: 0.5 }}>
                    <span>Inercia</span>
                    <span>Aceleração Máxima</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <AnimatePresence mode="popLayout">
                    {loops.length === 0 && !loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', fontSize: '13px', opacity: 0.4, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                            Aguardando alta performance para disparar loops...
                        </div>
                    ) : (
                        loops.map((loop) => (
                            <motion.div
                                key={loop.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                style={{
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    borderLeft: '3px solid #32d74b',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>{loop.payload.message}</span>
                                <span style={{ fontSize: '11px', opacity: 0.4 }}>
                                    {new Date(loop.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
            <div style={{ marginTop: Spacing.lg, paddingTop: Spacing.md, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                <a href="/app/settings/connectors" style={{ fontSize: '12px', color: '#32d74b', textDecoration: 'none', fontWeight: 600 }}>
                    Configurar Canais →
                </a>
            </div>
        </Card>
    );
};
