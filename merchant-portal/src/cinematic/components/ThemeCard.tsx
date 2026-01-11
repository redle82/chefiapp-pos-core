
import React from 'react';
import { motion } from 'framer-motion';

interface ThemeCardProps {
    id: string;
    name: string;
    colors: string[];
    isSelected: boolean;
    onClick: () => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({ name, colors, isSelected, onClick }) => {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
                scale: isSelected ? 1.1 : 1,
                borderColor: isSelected ? '#E8C547' : 'rgba(255,255,255,0.1)'
            }}
            className={`
        relative w-40 h-64 rounded-2xl cursor-pointer border-2 overflow-hidden transition-colors duration-300
        ${isSelected ? 'shadow-[0_0_30px_rgba(232,197,71,0.3)]' : 'shadow-lg'}
      `}
            style={{
                background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
            }}
        >
            {/* Preview UI Mockup (Abstract) */}
            <div className="absolute inset-4 bg-white/10 backdrop-blur-md rounded-xl flex flex-col gap-2 p-2">
                <div className="w-12 h-2 rounded-full bg-white/40" />
                <div className="w-full h-12 rounded-lg bg-white/20" />
                <div className="flex gap-1 mt-auto">
                    <div className="w-8 h-8 rounded-full bg-white/20" />
                    <div className="w-8 h-8 rounded-full bg-white/20" />
                </div>
            </div>

            {/* Label */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-bold text-center">{name}</h3>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-black text-xs">✓</span>
                </div>
            )}
        </motion.div>
    );
};
