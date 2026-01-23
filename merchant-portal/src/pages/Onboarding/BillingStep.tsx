/**
 * BillingStep - Escolher Plano no Onboarding
 * 
 * FASE 1 - Billing Integration
 * 
 * Funcionalidades:
 * - Lista 3 planos (STARTER, PROFESSIONAL, ENTERPRISE)
 * - Mostra features por plano
 * - Botão "Começar Trial" / "Pagar Agora"
 * - Integração com RestaurantOnboardingService
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../ui/design-system/Button';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { DEFAULT_PLANS } from '../../../../billing-core/types';
import { FeatureGateService } from '../../../../billing-core/FeatureGateService';
import { supabase } from '../../core/supabase';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { FireSystem } from '../../ui/design-system/sovereign/FireSystem';
import { OSSignature } from '../../ui/design-system/sovereign/OSSignature';

interface BillingStepProps {
    restaurantId?: string;
    onComplete?: (planId: string, startTrial: boolean) => void;
}

export const BillingStep: React.FC<BillingStepProps> = ({
    restaurantId: propRestaurantId,
    onComplete
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const restaurantId = propRestaurantId || getTabIsolated('chefiapp_restaurant_id') || location.state?.restaurantId;

    if (!restaurantId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Text>Restaurant ID não encontrado. Redirecionando...</Text>
            </div>
        );
    }

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId);
        setError(null);
    };

    // TODO: Replace with real Stripe Price IDs for each tier
    const PLAN_TO_STRIPE_PRICE: Record<string, string> = {
        'plan_starter_v1': 'price_1ShJzFEOB1Od9eibaF3j7BG9', // Verified Test Price
        'plan_professional_v1': 'price_1ShJzFEOB1Od9eibaF3j7BG9',
        'plan_enterprise_v1': 'price_1ShJzFEOB1Od9eibaF3j7BG9',
    };

    const handleCheckout = async (planId: string) => {
        setLoading(true);
        setError(null);

        try {
            const priceId = PLAN_TO_STRIPE_PRICE[planId];
            if (!priceId) throw new Error('Price ID not configured for this plan');

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Usuário não autenticado');

            // Use invoke for standard Edge Function calls
            const { data, error: invokeError } = await supabase.functions.invoke('stripe-billing', {
                body: {
                    action: 'create-checkout-session',
                    priceId: priceId,
                    successUrl: window.location.origin + '/app/dashboard?billing_success=true',
                    cancelUrl: window.location.origin + '/onboarding/billing?billing_cancel=true',
                    returnUrl: window.location.origin + '/app/dashboard'
                }
            });

            if (invokeError) {
                console.error('[BillingStep] Invoke Error:', invokeError);
                // Try to extract message if it's a JSON response error formatted by handler
                const msg = invokeError.context?.json?.error || invokeError.message || 'Falha ao conectar com servidor de pagamento';
                throw new Error(msg);
            }

            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('URL de checkout não retornada');
            }

        } catch (err: any) {
            console.error('[BillingStep] Checkout Error:', err);
            setError(err.message || 'Erro ao iniciar checkout.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTrial = () => selectedPlan && handleCheckout(selectedPlan);
    const handlePayNow = () => selectedPlan && handleCheckout(selectedPlan);

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
                maxWidth: '900px',
                width: '100%',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <OSSignature state="ritual" size="xl" />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#fff', margin: 0, marginBottom: '8px' }}>
                        Escolha Seu Plano
                    </h1>
                    <Text size="md" color="secondary">
                        Comece com trial de 14 dias grátis. Cancele a qualquer momento.
                    </Text>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '12px 16px',
                        background: 'rgba(255, 59, 48, 0.1)',
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        borderRadius: '8px',
                        color: '#ff3b30',
                        fontSize: '14px',
                    }}>
                        {error}
                    </div>
                )}

                {/* Plans Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px',
                }}>
                    {DEFAULT_PLANS.map((plan) => {
                        const features = TIER_FEATURES[plan.tier] || [];
                        const isSelected = selectedPlan === plan.plan_id;

                        return (
                            <Card
                                key={plan.plan_id}
                                surface={isSelected ? 'layer3' : 'layer2'}
                                padding="lg"
                                hoverable
                                onClick={() => handleSelectPlan(plan.plan_id)}
                                style={{
                                    border: isSelected ? '2px solid #32d74b' : '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div style={{ marginBottom: '16px' }}>
                                    <Text size="lg" weight="bold" style={{ color: '#fff', marginBottom: '4px' }}>
                                        {plan.name}
                                    </Text>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <Text size="xl" weight="bold" style={{ color: '#fff' }}>
                                            €{(plan.price_cents / 100).toFixed(0)}
                                        </Text>
                                        <Text size="sm" color="secondary">/mês</Text>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <Text size="sm" color="secondary" style={{ marginBottom: '12px' }}>
                                        {plan.tier === 'STARTER' && 'Ideal para começar'}
                                        {plan.tier === 'PROFESSIONAL' && 'Para restaurantes em crescimento'}
                                        {plan.tier === 'ENTERPRISE' && 'Para múltiplas localizações'}
                                    </Text>
                                    <ul style={{
                                        listStyle: 'none',
                                        padding: 0,
                                        margin: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                    }}>
                                        {features.slice(0, 5).map((feature, idx) => (
                                            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#32d74b' }}>✓</span>
                                                <Text size="sm" color="secondary">{feature}</Text>
                                            </li>
                                        ))}
                                        {features.length > 5 && (
                                            <li>
                                                <Text size="sm" color="secondary">+{features.length - 5} mais</Text>
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                {isSelected && (
                                    <div style={{
                                        padding: '8px',
                                        background: 'rgba(50, 215, 75, 0.1)',
                                        borderRadius: '6px',
                                        textAlign: 'center',
                                        marginTop: '16px',
                                    }}>
                                        <Text size="sm" style={{ color: '#32d74b', fontWeight: 600 }}>
                                            Selecionado
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    justifyContent: 'center',
                }}>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/app/dashboard')}
                        disabled={loading}
                    >
                        Pular por Agora
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleStartTrial}
                        disabled={!selectedPlan || loading}
                        loading={loading}
                        style={{ minWidth: '200px' }}
                    >
                        Começar Trial (14 dias grátis)
                    </Button>
                    <Button
                        variant="constructive"
                        onClick={handlePayNow}
                        disabled={!selectedPlan || loading}
                        loading={loading}
                        style={{ minWidth: '200px' }}
                    >
                        Pagar Agora
                    </Button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Text size="xs" color="secondary">
                        Trial de 14 dias. Sem cartão de crédito necessário para trial.
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default BillingStep;
