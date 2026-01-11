/**
 * Health Check Page
 * 
 * Página para verificar a saúde do sistema.
 * Acessível em /health
 */

import React, { useEffect, useState } from 'react';
import { checkHealth, type HealthStatus } from '../core/monitoring/healthCheck';
import { Card } from '../ui/design-system/Card';
import { Text } from '../ui/design-system/primitives/Text';
import { Badge } from '../ui/design-system/primitives/Badge';

export const HealthCheckPage: React.FC = () => {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const status = await checkHealth();
                setHealth(status);
            } catch (error) {
                console.error('[HealthCheckPage] Error:', error);
                setHealth({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    checks: {
                        database: { status: 'error', message: 'Health check failed' },
                        supabase: { status: 'error', message: 'Health check failed' },
                        storage: { status: 'error', message: 'Health check failed' },
                    },
                    version: '1.0.0',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchHealth();
        // Auto-refresh a cada 30 segundos
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div style={{ padding: 32, textAlign: 'center' }}>
                <Text size="lg">Verificando saúde do sistema...</Text>
            </div>
        );
    }

    if (!health) {
        return (
            <div style={{ padding: 32, textAlign: 'center' }}>
                <Text size="lg" color="error">Erro ao verificar saúde do sistema</Text>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return '#32d74b';
            case 'degraded':
                return '#ff9500';
            case 'unhealthy':
                return '#ff3b30';
            default:
                return '#666';
        }
    };

    const getCheckStatusColor = (status: string) => {
        return status === 'ok' ? '#32d74b' : '#ff3b30';
    };

    return (
        <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <Text size="2xl" weight="bold" style={{ marginBottom: 8 }}>
                    Health Check
                </Text>
                <Text size="sm" color="tertiary">
                    Status do sistema em tempo real
                </Text>
            </div>

            <Card padding="lg" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Text size="lg" weight="bold">Status Geral</Text>
                        <Text size="sm" color="tertiary" style={{ marginTop: 4 }}>
                            {new Date(health.timestamp).toLocaleString()}
                        </Text>
                    </div>
                    <Badge
                        status={health.status === 'healthy' ? 'ready' : health.status === 'degraded' ? 'preparing' : 'delivered'}
                        label={health.status.toUpperCase()}
                        style={{
                            backgroundColor: getStatusColor(health.status),
                            color: '#fff',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Database Check */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                        <div>
                            <Text size="base" weight="bold">Database</Text>
                            {health.checks.database.message && (
                                <Text size="xs" color="tertiary" style={{ marginTop: 4 }}>
                                    {health.checks.database.message}
                                </Text>
                            )}
                        </div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: getCheckStatusColor(health.checks.database.status) }} />
                    </div>

                    {/* Supabase Check */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                        <div>
                            <Text size="base" weight="bold">Supabase</Text>
                            {health.checks.supabase.message && (
                                <Text size="xs" color="tertiary" style={{ marginTop: 4 }}>
                                    {health.checks.supabase.message}
                                </Text>
                            )}
                        </div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: getCheckStatusColor(health.checks.supabase.status) }} />
                    </div>

                    {/* Storage Check */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                        <div>
                            <Text size="base" weight="bold">Storage</Text>
                            {health.checks.storage.message && (
                                <Text size="xs" color="tertiary" style={{ marginTop: 4 }}>
                                    {health.checks.storage.message}
                                </Text>
                            )}
                        </div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: getCheckStatusColor(health.checks.storage.status) }} />
                    </div>
                </div>

                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Text size="xs" color="tertiary">
                        Versão: {health.version}
                    </Text>
                </div>
            </Card>
        </div>
    );
};
