import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTabIsolated } from '../storage/TabIsolatedStorage';

type BillingStatus = 'trial' | 'active' | 'past_due' | 'canceled';

interface PaymentGuardProps {
    children: React.ReactNode;
}

export const PaymentGuard: React.FC<PaymentGuardProps> = ({ children }) => {
    // 1. Truth State (From Data Layer usually, but simplified here)
    const [status, setStatus] = useState<BillingStatus | 'loading'>('loading');
    const navigate = useNavigate();
    const location = useLocation();

    const checkBilling = async () => {
        try {
            // Dynamic import
            const { supabase } = await import('../../core/supabase');

            const rId = getTabIsolated('chefiapp_restaurant_id');
            if (!rId) {
                setStatus('active'); // Setup mode
                return;
            }

            const { data, error } = await supabase
                .from('gm_restaurants')
                .select('billing_status')
                .eq('id', rId)
                .single();

            if (error || !data) {
                console.warn('[PaymentGuard] Failed to check status, defaulting to safe (trial).', error);
                setStatus('trial'); // Fail Open / Safe
                return;
            }

            setStatus(data.billing_status as BillingStatus || 'trial');

        } catch (err) {
            console.error('[PaymentGuard] Critical Check Error:', err);
            setStatus('active'); // Fail Open (Economic Law #4)
        }
    };

    useEffect(() => {
        // Initial Check
        checkBilling();

        // Polling (Every 5 minutes)
        const interval = setInterval(checkBilling, 5 * 60 * 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    if (status === 'loading') {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
                <div className="animate-pulse">Verify Subscription...</div>
            </div>
        );
    }

    // 2. The Rules (Law)

    // Safe Harbor (Law #5): Allow Console/Billing even if canceled
    if (location.pathname.startsWith('/app/console') || location.pathname.startsWith('/app/setup')) {
        return <>{children}</>;
    }

    if (status === 'canceled') {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-8 space-y-6">
                <div className="text-red-500 text-6xl">🔒</div>
                <h1 className="text-3xl font-bold">Subscription Required</h1>
                <p className="text-zinc-400 text-center max-w-md">
                    Your subscription has been canceled. To continue using ChefIApp Pro, please reactivate your plan.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.open('https://billing.stripe.com/p/login/test_YOUR_PORTAL_LINK', '_blank')}
                        className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                        Reactivate Plan
                    </button>
                    <button
                        onClick={() => navigate('/app/console/billing')}
                        className="text-zinc-500 hover:text-white underline"
                    >
                        Go to Billing
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'past_due') {
        // Warn but render children
        return (
            <>
                <div className="w-full bg-red-600 text-white text-xs font-bold px-4 py-1 text-center">
                    ⚠️ Payment Past Due. Access will be revoked soon. Please update payment method.
                </div>
                {children}
            </>
        );
    }

    // Active / Trial -> Pass
    return <>{children}</>;
};
