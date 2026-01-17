import React, { useState } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { supabase } from '../../../core/supabase';
import { useTenant } from '../../../core/tenant/TenantContext';

export const SubscriptionWidget: React.FC = () => {
    const { restaurant } = useTenant();
    const [loading, setLoading] = useState(false);

    // Derive status relative to billing
    // Note: restaurant object might not be updated immediately after webhook.
    // Ideally we subscribe to realtime updates on gm_restaurants or just reload.

    // Fallback if 'plan' is missing in Typescript definition of restaurant,
    // we might need to cast or update the type.
    const plan = (restaurant as any)?.plan || 'FREE';
    const billingStatus = (restaurant as any)?.billing_status || 'inactive';

    const isSovereign = plan === 'SOVEREIGN' && (billingStatus === 'active' || billingStatus === 'trialing');

    // Verificação preventiva: Price ID configurado?
    const hasPriceId = !!import.meta.env.VITE_STRIPE_SOVEREIGN_PRICE_ID;

    const handleAction = async (e?: React.MouseEvent) => {
        // Prevenir comportamento padrão e propagação
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (loading) return; // Prevenir múltiplos cliques

        setLoading(true);
        try {
            const action = isSovereign ? 'create-portal-session' : 'create-checkout-session';

            // Hardcoded Price ID for Sovereign Plan (Replace with real ENV/CONST)
            // Ideally should be fetched or configured. Using a placeholder for now.
            // USER MUST CONFIGURE THIS.
            const PRICE_ID = import.meta.env.VITE_STRIPE_SOVEREIGN_PRICE_ID;

            // Fallback: verificação adicional de segurança
            if (!isSovereign && !PRICE_ID) {
                console.error('[SubscriptionWidget] Configuration Error: VITE_STRIPE_SOVEREIGN_PRICE_ID is missing.');
                alert('Erro de configuração: VITE_STRIPE_SOVEREIGN_PRICE_ID não está definida. Por favor, configure esta variável de ambiente.');
                setLoading(false);
                return;
            }

            console.log('[SubscriptionWidget] Initiating billing action:', { action, hasPriceId: !!PRICE_ID });

            const { data, error } = await supabase.functions.invoke('stripe-billing', {
                body: {
                    action,
                    priceId: PRICE_ID,
                    successUrl: window.location.href, // Reload current page
                    cancelUrl: window.location.href,
                    returnUrl: window.location.href
                }
            });

            if (error) {
                console.error('[SubscriptionWidget] Supabase function error:', error);
                throw error;
            }

            if (data?.url) {
                console.log('[SubscriptionWidget] Redirecting to:', data.url);
                window.location.href = data.url;
            } else {
                console.error('[SubscriptionWidget] No URL returned from function', data);
                alert('Erro: Nenhuma URL de checkout retornada. Verifique a configuração do Stripe.');
            }
        } catch (err: any) {
            console.error('[SubscriptionWidget] Billing Action Failed:', err);
            const errorMessage = err?.message || 'Falha ao iniciar ação de billing. Verifique o console para mais detalhes.';
            alert(`Erro: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card surface="layer1" padding="lg" style={{ border: isSovereign ? '1px solid #d4af37' : '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <Text size="lg" weight="bold" color={isSovereign ? 'primary' : 'secondary'}>
                            {isSovereign ? 'Sovereign Plan 👑' : 'Starter Plan'}
                        </Text>
                        {isSovereign && <Badge status="ready" label="ACTIVE" />}
                    </div>
                    <Text size="sm" color="tertiary">
                        {isSovereign
                            ? 'You have full control over your restaurant infrastructure.'
                            : 'Upgrade to Sovereign to unlock full power and remove branding.'}
                    </Text>
                    {!isSovereign && !hasPriceId && (
                        <Text 
                            size="xs" 
                            style={{ 
                                color: '#ff9500', 
                                marginTop: 8,
                                display: 'block'
                            }}
                        >
                            ⚠️ Configuração necessária: VITE_STRIPE_SOVEREIGN_PRICE_ID não está definida
                        </Text>
                    )}
                </div>
                <Button
                    tone={isSovereign ? 'neutral' : 'accent'}
                    variant={isSovereign ? 'outline' : 'solid'}
                    onClick={handleAction}
                    disabled={loading || (!isSovereign && !hasPriceId)}
                    title={!isSovereign && !hasPriceId ? 'Configure VITE_STRIPE_SOVEREIGN_PRICE_ID para habilitar upgrade' : undefined}
                    style={{
                        opacity: (!isSovereign && !hasPriceId) ? 0.5 : undefined,
                        cursor: (!isSovereign && !hasPriceId) ? 'not-allowed' : undefined
                    }}
                >
                    {loading ? 'Processing...' : (isSovereign ? 'Manage Subscription' : 'Upgrade Now')}
                </Button>
            </div>
        </Card>
    );
};
