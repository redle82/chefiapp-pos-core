import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { PulseButton } from '../components/PulseButton';
import { CUISINE_TEMPLATES } from '../data/cuisineTemplates';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '../context/ProductContext';
import { useOnboardingEngine } from '../context/OnboardingEngineProvider';

export const Scene5Cuisine: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addProduct } = useProducts();
    const { engine, refresh } = useOnboardingEngine();
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    // Get the active template
    const activeTemplate = CUISINE_TEMPLATES.find(c => c.id === selectedCountry);

    const handleNext = () => {
        if (!activeTemplate) return;

        // 1. Persist Food to Product Memory (Brain)
        activeTemplate.dishes.forEach((dish: any) => {
            addProduct({
                id: `dish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: dish.name,
                price: dish.price,
                category: 'starters',
                origin: 'autopilot',
                status: 'permanent'
            });
        });

        // 2. Submit Contract
        const drinkTemplates = location.state?.drinkTemplates || [];

        try {
            // Update Menu Base info
            engine.updateSession(s => {
                if (!s.data.menu) s.data.menu = { hasFood: true, hasDrinks: false };
                s.data.menu.hasFood = true;
                s.data.menu.hasDrinks = drinkTemplates.length > 0;
            });

            // Submit Scene 5 (Cuisine Items)
            engine.submitScene5({
                items: activeTemplate.dishes
            });

            refresh();
            navigate('/start/cinematic/6');
        } catch (e) {
            console.error("Contract Violation Menu:", e);
        }
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-start pt-16 px-6 relative z-20 w-full max-w-5xl mx-auto h-full overflow-y-auto pb-32">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">Qual é a base da cozinha?</h1>
                    <p className="text-neutral-400 text-lg">Escolhe a origem. Nós sugerimos os clássicos.</p>
                </div>

                {/* Country Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl mb-12">
                    {CUISINE_TEMPLATES.map((tmpl) => {
                        const isSelected = selectedCountry === tmpl.id;
                        return (
                            <motion.button
                                key={tmpl.id}
                                onClick={() => setSelectedCountry(tmpl.id)}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300
                                    ${isSelected
                                        ? 'bg-gold-500/10 border-gold-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                                        : 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-500'
                                    }
                                `}
                            >
                                <span className="text-4xl">{tmpl.flag}</span>
                                <span className={`font-bold ${isSelected ? 'text-gold-400' : 'text-neutral-300'}`}>
                                    {tmpl.name}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {selectedCountry && (
                        <motion.div
                            className="fixed bottom-10 left-0 right-0 flex justify-center z-50 px-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <div className="w-full max-w-sm shadow-2xl">
                                <PulseButton onClick={handleNext}>
                                    Usar Menu {activeTemplate?.name} 🔥
                                </PulseButton>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </CinemaLayout>
    );
};
