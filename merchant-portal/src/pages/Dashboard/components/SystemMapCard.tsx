import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

interface Feature {
    id: string;
    label: string;
    status: 'active' | 'coming_soon' | 'locked';
    description?: string;
}

const FEATURES: Feature[] = [
    { id: 'operation', label: 'Operação & TPV', status: 'active', description: 'Caixa, pedidos, cozinha' },
    { id: 'menu', label: 'Menu & Equipe', status: 'active', description: 'Gestão completa' },
    { id: 'public_site', label: 'Site Público', status: 'active', description: 'Menu online para clientes' },
    { id: 'automation', label: 'Automação Avançada', status: 'coming_soon', description: 'Regras inteligentes' },
    { id: 'reports', label: 'Relatórios Financeiros', status: 'coming_soon', description: 'Análise detalhada' },
    { id: 'marketing', label: 'Marketing & Reputação', status: 'coming_soon', description: 'Google Reviews, campanhas' },
];

export const SystemMapCard: React.FC = () => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = React.useState(false);

    const activeFeatures = FEATURES.filter(f => f.status === 'active');
    const comingSoonFeatures = FEATURES.filter(f => f.status === 'coming_soon');

    return (
        <Card surface="layer2" padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing[4] }}>
                <div>
                    <Text size="lg" weight="bold" color="primary">🚀 Funcionalidades do ChefIApp</Text>
                    <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                        Este é o mapa completo do ChefIApp. Algumas partes já estão ativas, outras estão a caminho.
                    </Text>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                    {expanded ? 'Ver menos' : 'Ver tudo'}
                </Button>
            </div>

            {/* Active Features */}
            <div style={{ marginBottom: spacing[4] }}>
                <Text size="xs" color="tertiary" style={{ marginBottom: spacing[2], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ✅ Ativas
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                    {activeFeatures.map(feature => (
                        <div key={feature.id} style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                            <span style={{ color: colors.success.base }}>✅</span>
                            <div style={{ flex: 1 }}>
                                <Text size="sm" weight="medium" color="primary">{feature.label}</Text>
                                {feature.description && (
                                    <Text size="xs" color="secondary">{feature.description}</Text>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Coming Soon Features */}
            {(expanded || comingSoonFeatures.length <= 2) && (
                <div style={{ marginTop: spacing[4], paddingTop: spacing[4], borderTop: `1px solid ${colors.border.subtle}` }}>
                    <Text size="xs" color="tertiary" style={{ marginBottom: spacing[2], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🔒 Em breve
                    </Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                        {comingSoonFeatures.map(feature => (
                            <div key={feature.id} style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                                <span style={{ color: colors.warning.base }}>🔒</span>
                                <div style={{ flex: 1 }}>
                                    <Text size="sm" weight="medium" color="secondary">{feature.label}</Text>
                                    {feature.description && (
                                        <Text size="xs" color="tertiary">{feature.description}</Text>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate('/app/settings')}
                        style={{ marginTop: spacing[3] }}
                    >
                        Entrar na lista de early access →
                    </Button>
                </div>
            )}
        </Card>
    );
};

