/**
 * CheckoutStep - Configurar Pagamento (Stripe)
 * 
 * FASE 1 - Billing Integration
 * 
 * Funcionalidades:
 * - Integração Stripe Elements (card input)
 * - Confirmação de pagamento
 * - Feedback visual
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../../ui/design-system/Button';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { supabase } from '../../core/supabase';
import { FireSystem } from '../../ui/design-system/sovereign/FireSystem';
import { OSSignature } from '../../ui/design-system/sovereign/OSSignature';
import { DEFAULT_PLANS } from '../../../../billing-core/types';

// Inicializar Stripe (usar variável de ambiente)
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const isStripeConfigured = stripeKey.startsWith('pk_');
const stripePromise = isStripeConfigured ? loadStripe(stripeKey) : null;

// Log warning in dev mode if Stripe is not configured
if (!isStripeConfigured && import.meta.env.DEV) {
    console.warn('[CheckoutStep] ⚠️ Stripe not configured. Set VITE_STRIPE_PUBLIC_KEY in .env to enable payments.');
}

interface CheckoutStepProps {
    restaurantId?: string;
    planId?: string;
    clientSecret?: string;
    subscription?: any;
    onComplete?: () => void;
}

const CheckoutForm: React.FC<{
    restaurantId: string;
    planId: string;
    clientSecret: string;
    onSuccess: () => void;
    onError: (error: string) => void;
}> = ({ restaurantId, planId, clientSecret, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            setError('Stripe não está carregado. Aguarde...');
            return;
        }

        setLoading(true);
        setError(null);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError('Elemento de cartão não encontrado');
            setLoading(false);
            return;
        }

        try {
            // Confirmar pagamento
            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                }
            });

            if (confirmError) {
                throw new Error(confirmError.message || 'Erro ao processar pagamento');
            }

            if (paymentIntent?.status === 'succeeded') {
                // FASE 1: Atualizar subscription no backend
                const { data: updateData, error: updateError } = await supabase.functions.invoke('update-subscription-status', {
                    body: {
                        restaurant_id: restaurantId,
                        subscription_id: subscription?.subscription_id,
                        status: 'ACTIVE',
                        payment_intent_id: paymentIntent.id,
                    }
                });

                if (updateError) throw updateError;
                if (updateData?.error) throw new Error(updateData.error);

                onSuccess();
            } else {
                throw new Error('Pagamento não foi processado corretamente');
            }
        } catch (err: any) {
            console.error('[CheckoutForm] Error:', err);
            setError(err.message || 'Erro ao processar pagamento. Tente novamente.');
            onError(err.message || 'Erro ao processar pagamento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
                <Text size="sm" color="secondary" style={{ marginBottom: '8px' }}>
                    Informações do Cartão
                </Text>
                <div style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#fff',
                                    '::placeholder': {
                                        color: '#888',
                                    },
                                },
                                invalid: {
                                    color: '#ff3b30',
                                },
                            },
                        }}
                    />
                </div>
            </div>

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

            <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={!stripe || loading}
            >
                Confirmar Pagamento
            </Button>
        </form>
    );
};

export const CheckoutStep: React.FC<CheckoutStepProps> = ({
    restaurantId: propRestaurantId,
    planId: propPlanId,
    clientSecret: propClientSecret,
    subscription: propSubscription,
    onComplete
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [plan, setPlan] = useState<any>(null);

    const restaurantId = propRestaurantId || location.state?.restaurantId;
    const planId = propPlanId || location.state?.planId;
    const clientSecret = propClientSecret || location.state?.clientSecret;
    const subscription = propSubscription || location.state?.subscription;

    useEffect(() => {
        if (!planId) {
            navigate('/onboarding/billing');
            return;
        }

        // Buscar informações do plano
        const foundPlan = DEFAULT_PLANS.find(p => p.plan_id === planId);
        if (foundPlan) {
            setPlan(foundPlan);
        }
    }, [planId, navigate]);

    if (!restaurantId || !planId || !clientSecret) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Text>Dados incompletos. Redirecionando...</Text>
            </div>
        );
    }

    const handleSuccess = () => {
        if (onComplete) {
            onComplete();
        } else {
            navigate('/app/dashboard', {
                state: { billingSuccess: true }
            });
        }
    };

    const handleError = (error: string) => {
        console.error('[CheckoutStep] Error:', error);
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
                        Configurar Pagamento
                    </h1>
                    <Text size="md" color="secondary">
                        Configure seu método de pagamento para ativar o plano {plan?.name || ''}
                    </Text>
                </div>

                {/* Plan Summary */}
                {plan && (
                    <Card surface="layer2" padding="lg" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Text size="lg" weight="bold" style={{ color: '#fff', marginBottom: '4px' }}>
                                    {plan.name}
                                </Text>
                                <Text size="sm" color="secondary">
                                    €{(plan.price_cents / 100).toFixed(0)}/mês
                                </Text>
                            </div>
                            <Text size="lg" weight="bold" style={{ color: '#32d74b' }}>
                                €{(plan.price_cents / 100).toFixed(0)}
                            </Text>
                        </div>
                    </Card>
                )}

                {/* Stripe Elements */}
                <Card surface="layer2" padding="lg">
                    <Elements stripe={stripePromise}>
                        <CheckoutForm
                            restaurantId={restaurantId}
                            planId={planId}
                            clientSecret={clientSecret}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />
                    </Elements>
                </Card>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/onboarding/billing')}
                    >
                        Voltar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutStep;
