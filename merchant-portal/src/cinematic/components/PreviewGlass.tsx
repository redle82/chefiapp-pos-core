
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreviewGlassProps {
    title: string;
    subtitle?: string;
    isActive?: boolean;
}

export const PreviewGlass: React.FC<PreviewGlassProps> = ({ title, subtitle = "Restaurante & Bar", isActive = false }) => {
    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="relative mt-8 md:mt-12"
                >
                    {/* The Glass Card */}
                    <div className="relative w-64 h-32 md:w-80 md:h-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col items-center justify-center overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 to-transparent opacity-50" />

                        {/* Content */}
                        <motion.h2
                            key={title} // Animate changes
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-xl md:text-2xl font-bold text-white text-center px-4 truncate w-full"
                        >
                            {title || "Nome do Local"}
                        </motion.h2>

                        <p className="text-xs md:text-sm text-gold-300 uppercase tracking-widest mt-2">
                            {subtitle}
                        </p>

                        {/* Status Dot */}
                        <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
