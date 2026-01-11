import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { PulseButton } from '../components/PulseButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingEngine } from '../context/OnboardingEngineProvider';

const BUSINESS_TYPES = [
    { id: 'restaurant', label: 'Restaurante', icon: '🍷', sub: 'Foco em Comida' },
    { id: 'burger', label: 'Hamburgueria', icon: '🍔', sub: 'Fast Food' },
    { id: 'cafe', label: 'Café / Pastelaria', icon: '☕', sub: 'Balcão e Snacks' },
    { id: 'bar', label: 'Bar / Club', icon: '🍸', sub: 'Foco em Bebidas' },
    { id: 'pizza', label: 'Pizzaria', icon: '🍕', sub: 'Forno e Massa' },
    { id: 'other', label: 'Outro', icon: '🍱', sub: 'Conceito Único' },
];

export const SceneType: React.FC = () => {
    const navigate = useNavigate();
    const { engine, refresh } = useOnboardingEngine();
    const [selectedType, setSelectedType] = useState<string | null>(null);

    const handleNext = () => {
        if (selectedType) {
            try {
                // Update Business Type via generic update
                engine.updateSession(s => {
                    s.businessType = selectedType as any;
                });
                refresh();
                navigate('/start/cinematic/team');
            } catch (e) {
                console.error("Error saving type", e);
            }
        }
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-start pt-16 px-6 relative z-20 w-full max-w-4xl mx-auto h-full overflow-y-auto pb-32">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">Qual é o teu negócio?</h1>
                    <p className="text-neutral-400 text-lg">Define o palco da tua operação.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mb-12">
                    {BUSINESS_TYPES.map((opt) => {
                        const isSelected = selectedType === opt.id;
                        return (
                            <motion.button
                                key={opt.id}
                                onClick={() => setSelectedType(opt.id)}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    p-6 rounded-xl border flex flex-col items-center gap-3 transition-all duration-300
                                    ${isSelected
                                        ? 'bg-neutral-800 border-gold-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                                        : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-600'
                                    }
                                `}
                            >
                                <span className="text-5xl mb-2">{opt.icon}</span>
                                <div>
                                    <span className={`block font-bold text-base ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                                        {opt.label}
                                    </span>
                                    <span className="text-xs text-neutral-500">{opt.sub}</span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {selectedType && (
                        <motion.div
                            className="fixed bottom-10 left-0 right-0 flex justify-center z-50 px-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <div className="w-full max-w-sm shadow-2xl">
                                <PulseButton onClick={handleNext}>
                                    Continuar 👉
                                </PulseButton>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </CinemaLayout>
    );
};
