import { useState, useRef } from 'react';

// ------------------------------------------------------------------
// 🛡️ PAYMENT GUARD (Financial Immunology)
// ------------------------------------------------------------------
// Ensures payments are verified before committing to "Juridical Reality".
// Prevents "Ghost Orders" (Paid but not recorded) and "Zombie Orders" (Served but not paid).

type PaymentGuardStatus = 'idle' | 'verifying' | 'verified' | 'rejected' | 'timeout';

interface UsePaymentGuardProps {
    apiBase: string;
    onVerified: (paymentIntentId: string) => void;
    onGhost: (paymentIntentId: string) => void;
}

export const usePaymentGuard = ({ apiBase, onVerified, onGhost }: UsePaymentGuardProps) => {
    const [status, setStatus] = useState<PaymentGuardStatus>('idle');
    const verificationAttempts = useRef(0);
    const maxAttempts = 5;

    const verifyPayment = async (paymentIntentId: string) => {
        setStatus('verifying');
        let attempts = 0;

        const check = async () => {
            try {
                const res = await fetch(`${apiBase}/payment/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentIntentId })
                });

                const data = await res.json();

                if (data.status === 'succeeded') {
                    setStatus('verified');
                    onVerified(paymentIntentId);
                    return true;
                }
                return false;

            } catch (error) {
                console.error('Payment Verification Failed:', error);
                return false;
            }
        };

        // Polling loop (Immunological Patrol)
        const interval = setInterval(async () => {
            attempts++;
            verificationAttempts.current = attempts;

            const success = await check();
            if (success) {
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                setStatus('timeout');
                onGhost(paymentIntentId); // Flag as potential ghost
            }
        }, 2000); // Check every 2s
    };

    return {
        status,
        verifyPayment
    };
};
