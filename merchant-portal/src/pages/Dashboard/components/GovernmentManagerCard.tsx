import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { supabase } from '../../../core/supabase';

interface GovernmentManagerCardProps {
    restaurantId: string | null;
}

interface ComplianceStatus {
    haccp: 'compliant' | 'warning' | 'critical';
    legal: 'compliant' | 'pending';
    alerts: number;
}

export const GovernmentManagerCard: React.FC<GovernmentManagerCardProps> = ({ restaurantId }) => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<ComplianceStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) {
            setLoading(false);
            return;
        }

        const loadComplianceStatus = async () => {
            try {
                // TODO: Fetch real compliance data from database
                // For now, using mock data structure
                setStatus({
                    haccp: 'compliant',
                    legal: 'compliant',
                    alerts: 0
                });
            } catch (err) {
                console.warn('[GovernmentManagerCard] Error loading:', err);
            } finally {
                setLoading(false);
            }
        };

        loadComplianceStatus();
    }, [restaurantId]);

    const getRiskLevel = (): 'low' | 'medium' | 'high' => {
        if (!status) return 'low';
        if (status.haccp === 'critical' || status.alerts > 3) return 'high';
        if (status.haccp === 'warning' || status.alerts > 0) return 'medium';
        return 'low';
    };

    const riskLevel = getRiskLevel();
    const riskColor = riskLevel === 'high' ? colors.destructive.base : 
                     riskLevel === 'medium' ? colors.warning.base : 
                     colors.success.base;

    return (
        <Card surface="layer2" padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing[4] }}>
                <div>
                    <Text size="lg" weight="bold" color="primary">🛡️ Governo & Compliance</Text>
                    <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                        Legal, HACCP e responsabilidades
                    </Text>
                </div>
                <Badge 
                    status={riskLevel === 'high' ? 'new' : riskLevel === 'medium' ? 'preparing' : 'ready'} 
                    variant="outline" 
                    label={riskLevel === 'high' ? 'Atenção' : riskLevel === 'medium' ? 'Monitorar' : 'Conforme'} 
                />
            </div>

            {loading ? (
                <Text size="sm" color="tertiary">Carregando...</Text>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3], marginBottom: spacing[4] }}>
                        <div>
                            <Text size="xs" color="tertiary" style={{ marginBottom: 4 }}>📜 Legal & Compliance</Text>
                            <Text size="sm" weight="medium" color="primary">
                                {status?.legal === 'compliant' ? 'Conforme' : 'Pendente'}
                            </Text>
                        </div>
                        <div>
                            <Text size="xs" color="tertiary" style={{ marginBottom: 4 }}>🍽️ HACCP</Text>
                            <Text size="sm" weight="medium" color="primary">
                                {status?.haccp === 'compliant' ? 'Conforme' : 
                                 status?.haccp === 'warning' ? 'Atenção' : 'Crítico'}
                            </Text>
                        </div>
                    </div>

                    {status && status.alerts > 0 && (
                        <div style={{ 
                            padding: spacing[3], 
                            backgroundColor: `${colors.warning.base}15`, 
                            borderRadius: 8,
                            marginBottom: spacing[4]
                        }}>
                            <Text size="sm" weight="medium" color="warning">
                                ⚠️ {status.alerts} alerta{status.alerts > 1 ? 's' : ''} de vencimento
                            </Text>
                        </div>
                    )}

                    <Button variant="outline" size="sm" onClick={() => navigate('/app/settings')} fullWidth>
                        Ver detalhes completos
                    </Button>
                </>
            )}
        </Card>
    );
};

