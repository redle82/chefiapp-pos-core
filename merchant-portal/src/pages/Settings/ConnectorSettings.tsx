import React, { useEffect, useState } from 'react';
import { AppShell } from '../../ui/design-system/AppShell';
import { Card } from '../../ui/design-system/Card';
import { Button } from '../../ui/design-system/Button';
import { Input } from '../../ui/design-system/primitives/Input';
import { Text } from '../../ui/design-system/primitives/Text';
import { useToast } from '../../ui/design-system';
import { Colors, Spacing } from '../../ui/design-system/tokens';
import { supabase } from '../../core/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

export const ConnectorSettings: React.FC = () => {
    const { success, error, info } = useToast();
    const restaurantId = getTabIsolated('chefiapp_restaurant_id');
    const [connectors, setConnectors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [connectorType, setConnectorType] = useState<'generic_webhook' | 'whatsapp_webhook'>('generic_webhook');

    useEffect(() => {
        if (!restaurantId) return;

        const fetchConnectors = async () => {
            const { data } = await supabase
                .from('external_connectors')
                .select('*')
                .eq('restaurant_id', restaurantId);

            setConnectors(data || []);
            setLoading(false);
        };

        fetchConnectors();
    }, [restaurantId]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId) return;

        const { data, error: err } = await supabase
            .from('external_connectors')
            .insert({
                restaurant_id: restaurantId,
                name,
                webhook_url: url,
                webhook_secret: secret,
                connector_type: connectorType,
                active: true
            })
            .select()
            .single();

        if (err) {
            error('Erro ao criar: ' + err.message);
        } else {
            setConnectors([...connectors, data]);
            setShowAdd(false);
            setName(''); setUrl(''); setSecret('');
            success('Canal conectado com sucesso!');
        }
    };

    const toggleStatus = async (connector: any) => {
        const { error: err } = await supabase
            .from('external_connectors')
            .update({ active: !connector.active })
            .eq('id', connector.id);

        if (!err) {
            setConnectors(connectors.map(c => c.id === connector.id ? { ...c, active: !c.active } : c));
            success(`Canal ${!connector.active ? 'ativado' : 'pausado'}`);
        } else {
            error('Erro ao atualizar status');
        }
    };

    const runTest = async (connector: any) => {
        info('Enviando sinal de teste...');
        const { error: err } = await supabase.functions.invoke('satellite_connector', {
            body: {
                connector_id: connector.id,
                payload: {
                    message: "🔔 TESTE: Momentum de Estabilidade Detectado (Simulação)",
                    metadata: {
                        source: 'user_test',
                        confidence: 1.0,
                        count: 25,
                        window_minutes: 10
                    }
                }
            }
        });

        if (err) {
            error('Falha no teste: ' + err.message);
        } else {
            const msg = connector.connector_type === 'whatsapp_webhook'
                ? 'Sinal enviado via WhatsApp (Make). Verifique seu telefone!'
                : 'Sinal enviado! Verifique seu canal externo.';
            success(msg);
        }
    };

    return (
        <AppShell>
            <div style={{ padding: Spacing.xl, maxWidth: '900px', margin: '0 auto' }}>
                <header style={{ marginBottom: Spacing.xl }}>
                    <Text size="3xl" weight="black" color="primary">🔌 Canais de Crescimento</Text>
                    <Text size="md" color="secondary" style={{ marginTop: 8 }}>O ChefIApp converte sua estabilidade em valor externo.</Text>
                </header>

                {/* 🟢 QUICK CHANNELS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.lg, marginBottom: Spacing.xl }}>
                    <Card padding="lg" style={{ border: `1px solid ${Colors.success}40`, background: `${Colors.success}05` }}>
                        <div style={{ fontSize: '24px', marginBottom: Spacing.sm }}>💬</div>
                        <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 8 }}>WhatsApp (via Make/Webhook)</Text>
                        <Text size="sm" color="secondary" style={{ marginBottom: Spacing.lg }}>
                            Receba alertas de momentum diretamente no celular. Recomendamos Make.com para v0.
                        </Text>
                        <Button variant="secondary" size="sm" onClick={() => {
                            setName('WhatsApp Dono (Make)');
                            setUrl('');
                            setConnectorType('whatsapp_webhook');
                            setShowAdd(true);
                        }}>
                            Configurar WhatsApp
                        </Button>
                    </Card>

                    <Card padding="lg" style={{ border: `1px solid ${Colors.surface.border}` }}>
                        <div style={{ fontSize: '24px', marginBottom: Spacing.sm }}>🌐</div>
                        <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 8 }}>Webhook Genérico</Text>
                        <Text size="sm" color="secondary" style={{ marginBottom: Spacing.lg }}>
                            Conecte o ChefIApp a qualquer sistema externo via JSON/HMAC.
                        </Text>
                        <Button variant="ghost" size="sm" onClick={() => {
                            setName('');
                            setUrl('');
                            setConnectorType('generic_webhook');
                            setShowAdd(true);
                        }}>
                            Configurar Webhook
                        </Button>
                    </Card>
                </div>

                <AnimatePresence>
                    {showAdd && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden', marginBottom: Spacing.xl }}
                        >
                            <Card padding="lg">
                                <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <Text size="xs" weight="bold" color="secondary">NOME DO CANAL</Text>
                                            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                {connectorType.toUpperCase()}
                                            </span>
                                        </div>
                                        <Input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Ex: WhatsApp do Dono"
                                            required
                                            fullWidth
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <Input
                                            label="ENDPOINT (WEBHOOK URL)"
                                            type="url"
                                            value={url}
                                            onChange={e => setUrl(e.target.value)}
                                            placeholder="https://hook.make.com/..."
                                            required
                                            fullWidth
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            label="WEBHOOK SECRET (HMAC)"
                                            type="password"
                                            value={secret}
                                            onChange={e => setSecret(e.target.value)}
                                            placeholder="Segredo para assinatura"
                                            fullWidth
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: Spacing.sm, paddingBottom: 16 }}>
                                        <Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancelar</Button>
                                        <Button variant="primary" type="submit" style={{ flex: 1 }}>Ativar Canal</Button>
                                    </div>
                                </form>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.md }}>
                    {loading ? (
                        <Text>Carregando canais...</Text>
                    ) : connectors.length === 0 ? (
                        <Card padding="lg" style={{ textAlign: 'center', opacity: 0.3, border: `1px dashed ${Colors.surface.border}` }}>
                            <Text>Nenhum canal ativo. O ChefIApp está rodando em "Silêncio".</Text>
                        </Card>
                    ) : (
                        connectors.map(conn => (
                            <Card key={conn.id} padding="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: Spacing.md, alignItems: 'center' }}>
                                    <div style={{ fontSize: '24px' }}>{conn.connector_type === 'whatsapp_webhook' ? '💬' : '🔌'}</div>
                                    <div>
                                        <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 4 }}>{conn.name}</Text>
                                        <Text size="xs" color="tertiary" style={{ fontFamily: 'monospace' }}>
                                            {(conn.webhook_url || '').slice(0, 45)}...
                                        </Text>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: Spacing.md, alignItems: 'center' }}>
                                    <Button variant="ghost" size="sm" onClick={() => runTest(conn)}>Testar</Button>
                                    <div style={{
                                        padding: '4px 12px', borderRadius: '100px',
                                        background: conn.active ? `${Colors.success}20` : `${Colors.neutral[500]}10`,
                                        color: conn.active ? Colors.success : Colors.text.tertiary,
                                        fontSize: '11px', fontWeight: 600
                                    }}>
                                        {conn.active ? 'ATIVO' : 'DESATIVADO'}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(conn)}>
                                        <span style={{ fontSize: '18px' }}>{conn.active ? '🚫' : '✅'}</span>
                                    </Button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppShell>
    );
};
