import React, { useState } from 'react';
import { CinemaLayout } from '../CinemaLayout';
import { PulseButton } from '../components/PulseButton';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useOnboardingEngine } from '../context/OnboardingEngineProvider';
import { useProducts } from '../context/ProductContext';
import { useStaff } from '../context/StaffContext';
import { ContractItem } from '../components/ContractItem';

export const Scene6Summary: React.FC = () => {
    const navigate = useNavigate();
    const { engine } = useOnboardingEngine();
    const { getMenu, initializeFromContract: initProduct } = useProducts();
    const { initializeFromContract: initStaff } = useStaff(); // Import new hook
    const [isCreating, setIsCreating] = useState(false);

    // Dynamic Stats from Memory 🧠
    const products = getMenu();
    // Debug
    console.log('Scene6Summary: Products in context:', products);

    // Fix: categoryId -> category
    const drinksCount = products.filter(p => p.category !== 'kitchen').length;
    const foodCount = products.filter(p => p.category === 'kitchen').length;

    const handleOpenShop = async () => {
        setIsCreating(true);

        try {
            // ---------------------------------------------------------
            // THE AUTH CONTRACT (Formalized in Core)
            // ---------------------------------------------------------

            // SIMULATION: Wait a bit for dramatic effect
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Execute Final Contract
            const output = await engine.submitScene6({ acceptedTerms: true });

            console.log('✅ Onboarding Complete. Token:', output.contract.session.token);
            console.log('📜 Initial Operational Contract:', output.contract);
            console.log('🔎 Menu Profile in Contract:', output.contract.menuProfile);

            // --- BOOTSTRAP CORES ---
            // This is the "Big Bang" moment where cores wake up
            initProduct(output.contract);
            initStaff(output.contract);

            // Persist for TPV access
            const { setTabIsolated } = await import('../../core/storage/TabIsolatedStorage');
            setTabIsolated('x-chefiapp-token', output.contract.session.token);
            if (output.contract.merchantId) {
                setTabIsolated('chefiapp_merchant_id', output.contract.merchantId);
            }

            // Navigate to TPV
            navigate('/app/tpv-ready');

        } catch (error) {
            console.error("Failed to start shop session", error);
            setIsCreating(false);
        }
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-white relative z-20">

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-[0_0_50px_rgba(34,197,94,0.4)]">
                        <span className="text-4xl">🚀</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4">O Palco está Montado.</h1>
                    <p className="text-xl text-neutral-300">O sistema aprendeu a tua operação.</p>
                </motion.div>

                {/* Sovereign Contract Visualization */}
                <motion.div
                    className="w-full max-w-md glass-panel rounded-2xl p-6 mb-12 text-left"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                        <span className="text-xs uppercase tracking-widest text-neutral-500">InitialOperationalContract</span>
                        <span className="text-xs text-green-400 font-mono">READY</span>
                    </div>

                    <div className="space-y-3 font-mono text-sm text-neutral-300">
                        <ContractItem delay={0.3} label="Identidade" value="DEFINIDA" />
                        <ContractItem delay={0.4} label="Menu Context" value={`${drinksCount} Drinks, ${foodCount} Food`} />
                        <ContractItem delay={0.5} label="Staff Protocol" value="MAESTRO MODE" />
                        <ContractItem delay={0.6} label="Compliance" value="ACTIVE" />
                    </div>
                </motion.div>

                <div className="w-full max-w-sm space-y-4">
                    <PulseButton onClick={handleOpenShop} disabled={isCreating}>
                        {isCreating ? 'A sincronizar satélites...' : 'Abrir as Portas 🏪'}
                    </PulseButton>
                    {!isCreating && (
                        <p className="text-xs text-neutral-600">
                            Ao continuar, aceitas os Termos de Serviço.
                        </p>
                    )}
                </div>

            </div>
        </CinemaLayout>
    );
};
