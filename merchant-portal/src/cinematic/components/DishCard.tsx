
import React from 'react';
import { motion } from 'framer-motion';

interface DishCardProps {
    name: string;
    price: string;
}

export const DishCard: React.FC<DishCardProps> = ({ name, price }) => {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className="bg-neutral-800 rounded-2xl p-6 w-64 shadow-2xl border border-white/5 relative overflow-hidden"
        >
            <div className="w-full h-32 bg-neutral-700/50 rounded-lg mb-4 flex items-center justify-center animate-pulse">
                <span className="text-4xl">🍔</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1 truncate">{name || "Nome do Prato"}</h3>
            <p className="text-gold-400 font-bold text-lg">€ {price || "0.00"}</p>

            {/* Shine effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
        </motion.div>
    );
};
