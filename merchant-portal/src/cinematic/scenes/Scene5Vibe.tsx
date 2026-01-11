
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { ThemeCard } from '../components/ThemeCard';
import { PulseButton } from '../components/PulseButton';
import { motion } from 'framer-motion';

const THEMES = [
    { id: 'dark_gold', name: 'Premium Dark', colors: ['#1A1A1A', '#000000'] },
    { id: 'clean_light', name: 'Modern Brunch', colors: ['#F3F4F6', '#FFFFFF'] },
    { id: 'neon_night', name: 'Neon Night', colors: ['#280546', '#0F011B'] },
];

export const Scene5Vibe: React.FC = () => {
    const navigate = useNavigate();
    const [selectedTheme, setSelectedTheme] = useState<string>('dark_gold');

    const handleNext = () => {
        // Save theme logic
        navigate('/start/cinematic/6');
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-20 w-full max-w-5xl mx-auto h-full gap-12">

                <div className="text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Qual é a tua vibe?</h1>
                    <p className="text-neutral-400 text-lg">Define a alma do teu restaurante.</p>
                </div>

                {/* Theme Grid */}
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
                    {THEMES.map((theme, index) => (
                        <motion.div
                            key={theme.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <ThemeCard
                                {...theme}
                                isSelected={selectedTheme === theme.id}
                                onClick={() => setSelectedTheme(theme.id)}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Action */}
                <motion.div
                    className="mt-8 w-full max-w-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <PulseButton onClick={handleNext}>
                        Aplicar Estilo ✨
                    </PulseButton>
                </motion.div>

            </div>
        </CinemaLayout>
    );
};
