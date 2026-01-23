/**
 * TrialStart - Ativar Trial
 * 
 * FASE 1 - Billing Integration
 * 
 * Funcionalidades:
 * - Mostra data de término do trial
 * - Botão opcional "Configurar Método de Pagamento"
 * - Botão "Continuar para Dashboard"
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../ui/design-system/Button';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { FireSystem } from '../../ui/design-system/sovereign/FireSystem';
import { OSSignature } from '../../ui/design-system/sovereign/OSSignature';

interface TrialStartProps {
    restaurantId?: string;
    subscription?: any;
    planId?: string;
    onComplete?: () => void;
}

export const TrialStart: React.FC<TrialStartProps> = ({
    restaurantId: propRestaurantId,
    subscription: propSubscription,
    planId: propPlanId,
    onComplete
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const restaurantId = propRestaurantId || location.state?.restaurantId;
    const subscription = propSubscription || location.state?.subscription;
    const planId = propPlanId || location.state?.planId;

    if (!restaurantId || !subscription) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Text>Dados incompletos. Redirecionando...</Text>
            </div>
        );
    }

    const trialEndsAt = subscription.trial_ends_at 
        ? new Date(subscription.trial_ends_at)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Fallback: 14 dias

    const handleContinue = () => {
        if (onComplete) {
            onComplete();
        } else {
            // FASE 2: Redirecionar para MenuDemo após trial
            navigate('/onboarding/menu-demo', {
                state: { 
                    restaurantId,
                    trialStarted: true 
                }
            });
        }
    };

    const handleConfigurePayment = () => {
        navigate('/onboarding/checkout', {
            state: {
                restaurantId,
                subscription,
                planId,
            }
        });
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: FireSystem.ritual.background,
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '500px',
                width: '100%',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <OSSignature state="ritual" size="xl" />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#fff', margin: 0, marginBottom: '8px' }}>
                        Trial Ativado! 🎉
                    </h1>
                    <Text size="md" color="secondary">
                        Seu trial de 14 dias começou agora
                    </Text>
                </div>

                {/* Trial Info */}
                <Card surface="layer2" padding="lg" style={{ marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Text size="lg" weight="bold" style={{ color: '#32d74b', marginBottom: '8px' }}>
                            Trial Ativo
                        </Text>
                        <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
                            Você terá acesso completo ao ChefIApp pelos próximos 14 dias
                        </Text>
                        <div style={{
                            padding: '16px',
                            background: 'rgba(50, 215, 75, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(50, 215, 75, 0.3)',
                        }}>
                            <Text size="sm" color="secondary" style={{ marginBottom: '4px' }}>
                                Trial termina em:
                            </Text>
                            <Text size="lg" weight="bold" style={{ color: '#32d74b' }}>
                                {trialEndsAt.toLocaleDateString('pt-BR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </Text>
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}>
                    <Button
                        variant="primary"
                        onClick={handleContinue}
                        disabled={loading}
                        fullWidth
                    >
                        Continuar para Dashboard
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleConfigurePayment}
                        disabled={loading}
                        fullWidth
                    >
                        Configurar Método de Pagamento (Recomendado)
                    </Button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Text size="xs" color="secondary">
                        Você pode configurar o pagamento depois. O trial continua ativo.
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default TrialStart;
