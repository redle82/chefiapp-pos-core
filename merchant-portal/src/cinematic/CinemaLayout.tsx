
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CinemaLayoutProps {
    children: React.ReactNode;
}

export const CinemaLayout: React.FC<CinemaLayoutProps> = ({ children }) => {
    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col z-50">
            {/* Cinematic Background (Global Fallback) */}
            <div className="absolute inset-0 bg-neutral-950 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800/30 via-black to-black opacity-80" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 w-full h-full flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={window.location.pathname} // Simple keying by route
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex-1 flex flex-col w-full h-full"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
