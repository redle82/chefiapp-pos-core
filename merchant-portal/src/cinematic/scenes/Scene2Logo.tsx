import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { PulseButton } from '../components/PulseButton';
import { motion, AnimatePresence } from 'framer-motion';

export const Scene2Logo: React.FC = () => {
    const navigate = useNavigate();
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            // Ideally save to Context here
        }
    };

    const handleNext = () => {
        navigate('/start/cinematic/type');
    };

    const handleSkip = () => {
        navigate('/start/cinematic/type');
    };

    return (
        <CinemaLayout>
            <div className="absolute inset-0 bg-neutral-900 pointer-events-none" />

            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-20 w-full max-w-4xl mx-auto h-full">

                {/* Question */}
                <motion.label
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-neutral-400 text-lg md:text-xl font-medium mb-8"
                >
                    Tens um logotipo?
                </motion.label>

                {/* Upload Zone */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className={`
                        w-64 h-64 md:w-80 md:h-80 rounded-full 
                        border-4 border-dashed transition-all duration-300
                        flex items-center justify-center overflow-hidden
                        ${preview ? 'border-gold-500 bg-black/50' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
                    `}>
                        {preview ? (
                            <img src={preview} alt="Logo Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-6">
                                <span className="text-4xl mb-2 block">📷</span>
                                <span className="text-white/60 text-sm font-medium">Toque para enviar</span>
                            </div>
                        )}
                    </div>

                    {/* Hidden Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </motion.div>

                {/* Actions */}
                <div className="fixed bottom-12 left-0 right-0 px-6 flex justify-center z-50 flex-col items-center gap-4">
                    <AnimatePresence>
                        {preview && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full max-w-xs"
                            >
                                <PulseButton onClick={handleNext}>
                                    Ficou ótimo 👉
                                </PulseButton>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!preview && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            onClick={handleSkip}
                            className="text-white/40 hover:text-white text-sm transition-colors"
                        >
                            Pular por enquanto
                        </motion.button>
                    )}
                </div>

            </div>
        </CinemaLayout>
    );
};
