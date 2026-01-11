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

    const handleAction = async () => {
        setLoading(true);
        try {
            const action = isSovereign ? 'create-portal-session' : 'create-checkout-session';

            // Hardcoded Price ID for Sovereign Plan (Replace with real ENV/CONST)
            // Ideally should be fetched or configured. Using a placeholder for now.
            // USER MUST CONFIGURE THIS.
            const PRICE_ID = import.meta.env.VITE_STRIPE_SOVEREIGN_PRICE_ID;

            if (!isSovereign && !PRICE_ID) {
                alert('Configuration Error: VITE_STRIPE_SOVEREIGN_PRICE_ID is missing.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.functions.invoke('stripe-billing', {
                body: {
                    action,
                    priceId: PRICE_ID,
                    successUrl: window.location.href, // Reload current page
                    cancelUrl: window.location.href,
                    returnUrl: window.location.href
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                console.error('No URL returned', data);
            }
        } catch (err) {
            console.error('Billing Action Failed:', err);
            alert('Failed to initiate billing action.');
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
                </div>
                <Button
                    tone={isSovereign ? 'neutral' : 'accent'}
                    variant={isSovereign ? 'outline' : 'solid'}
                    onClick={handleAction}
                    disabled={loading}
                >
                    {loading ? 'Processing...' : (isSovereign ? 'Manage Subscription' : 'Upgrade Now')}
                </Button>
            </div>
        </Card>
    );
};
