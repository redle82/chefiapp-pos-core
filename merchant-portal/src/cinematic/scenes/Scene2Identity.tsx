import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { InputGiant } from '../components/InputGiant';
import { PreviewGlass } from '../components/PreviewGlass';
import { PulseButton } from '../components/PulseButton';
import { motion, AnimatePresence } from 'framer-motion';

import { useOnboardingEngine } from '../context/OnboardingEngineProvider';

export const Scene2Identity: React.FC = () => {
    const navigate = useNavigate();
    const { engine } = useOnboardingEngine();
    const [name, setName] = useState('');
    const [city, setCity] = useState('');

    const handleNext = () => {
        try {
            // Update session data without transitioning scene step yet
            engine.updateSession(s => {
                s.data.identity = {
                    name: name,
                    slug: name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                    city: city
                };
            });
            navigate('/start/cinematic/logo');
        } catch (e) {
            console.error("Onboarding Error:", e);
        }
    };

    const isValid = name.length > 2;

    return (
        <CinemaLayout>
            <div className="absolute inset-0 bg-neutral-900 pointer-events-none" />

            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-20 w-full max-w-4xl mx-auto h-full">

                <InputGiant
                    label="Dá um nome à tua operação."
                    placeholder="Digite aqui..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <div className="w-full max-w-lg mt-8">
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Onde a magia acontece?"
                        className="w-full bg-transparent text-center text-xl text-neutral-400 placeholder-neutral-600 border-b border-neutral-800 focus:border-gold-500 focus:text-white outline-none transition-all py-2"
                    />
                </div>

                <PreviewGlass
                    title={name}
                    isActive={name.length > 0}
                />

                <AnimatePresence>
                    {isValid && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed bottom-12 left-0 right-0 px-6 flex justify-center z-50"
                        >
                            <div className="w-full max-w-xs">
                                <PulseButton onClick={handleNext}>
                                    Cimentar Identidade 👉
                                </PulseButton>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </CinemaLayout>
    );
};
