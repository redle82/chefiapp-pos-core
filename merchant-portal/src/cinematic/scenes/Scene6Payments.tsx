
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { PulseButton } from '../components/PulseButton';
import { motion } from 'framer-motion';
import { useOnboardingEngine } from '../context/OnboardingEngineProvider';

export const Scene6Payments: React.FC = () => {
    const navigate = useNavigate();
    const { engine } = useOnboardingEngine();

    const [mode, setMode] = useState<'stripe' | 'demo' | null>(null);
    const [stripeKey, setStripeKey] = useState('');

    const handleNext = () => {
        if (!mode) return;

        engine.updateSession(s => {
            // Save payment context to session data
            // In a real implementation this would go to ComplianceContext or similar
            if (!s.data.tasks) s.data.tasks = {};
            s.data.tasks.payments = {
                mode,
                stripeKey: mode === 'stripe' ? stripeKey : undefined
            };
        });

        // If Stripe, we could validate here, but for now we trust and proceed to Summary
        navigate('/start/cinematic/summary');
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-20 w-full max-w-4xl mx-auto h-full">

                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 text-center">
                    Como recebes?
                </h1>
                <p className="text-neutral-400 mb-12 text-center max-w-lg">
                    Configura o teu terminal de pagamentos ou inicia em modo de demonstração.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">

                    {/* STRIPE CARD */}
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('stripe')}
                        className={`p-8 rounded-2xl border cursor-pointer transition-all ${mode === 'stripe'
                                ? 'bg-[#635BFF]/10 border-[#635BFF] shadow-[0_0_30px_rgba(99,91,255,0.2)]'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                    >
                        <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center text-xl mb-4 text-white">
                            S
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Stripe</h3>
                        <p className="text-sm text-neutral-400 mb-4">
                            Aceita cartões, Apple Pay e MB Way automaticamente.
                        </p>

                        {mode === 'stripe' && (
                            <motion.input
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                onClick={e => e.stopPropagation()}
                                value={stripeKey}
                                onChange={e => setStripeKey(e.target.value)}
                                placeholder="pk_live_..."
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#635BFF]"
                                autoFocus
                            />
                        )}
                    </motion.div>

                    {/* DEMO CARD */}
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('demo')}
                        className={`p-8 rounded-2xl border cursor-pointer transition-all ${mode === 'demo'
                                ? 'bg-gold-500/10 border-gold-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                    >
                        <div className="w-12 h-12 bg-gold-600 rounded-xl flex items-center justify-center text-xl mb-4 text-white">
                            ★
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Modo Demo</h3>
                        <p className="text-sm text-neutral-400">
                            Simula pagamentos com caixa manual. Sem conexões externas.
                        </p>
                    </motion.div>

                </div>

                {/* Footer */}
                <div className="fixed bottom-12 left-0 right-0 flex justify-center w-full px-6">
                    <div className="w-full max-w-xs">
                        <PulseButton
                            onClick={handleNext}
                            disabled={!mode || (mode === 'stripe' && stripeKey.length < 5)}
                        >
                            Confirmar Configuração 👉
                        </PulseButton>
                    </div>
                </div>

            </div>
        </CinemaLayout>
    );
};
