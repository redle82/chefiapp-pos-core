
import React from 'react';
import { motion } from 'framer-motion';

interface ToggleCardProps {
    label: string;
    sublabel?: string;
    icon?: string;
    isSelected?: boolean;
    isLocked?: boolean;
    onClick?: () => void;
}

export const ToggleCard: React.FC<ToggleCardProps> = ({
    label,
    sublabel,
    icon,
    isSelected = false,
    isLocked = false,
    onClick
}) => {
    return (
        <motion.div
            onClick={!isLocked ? onClick : undefined}
            whileTap={!isLocked ? { scale: 0.98 } : undefined}
            className={`
        relative flex flex-col p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
        ${isLocked ? 'bg-neutral-800/50 border-neutral-700/50 cursor-default opacity-80' : ''}
        ${!isLocked && isSelected ? 'bg-neutral-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}
        ${!isLocked && !isSelected ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-600' : ''}
      `}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon || '📦'}</span>
                {/* Checkmark or Lock */}
                <div className={`
            w-6 h-6 rounded-full flex items-center justify-center border
            ${isLocked ? 'bg-neutral-700 border-neutral-600' : ''}
            ${!isLocked && isSelected ? 'bg-green-500 border-green-500' : ''}
            ${!isLocked && !isSelected ? 'border-neutral-600 bg-transparent' : ''}
         `}>
                    {isLocked && <span className="text-neutral-400 text-xs">🔒</span>}
                    {!isLocked && isSelected && <span className="text-black text-xs font-bold">✓</span>}
                </div>
            </div>

            <h3 className={`font-bold text-sm ${isSelected || isLocked ? 'text-white' : 'text-neutral-400'}`}>
                {label}
            </h3>

            {sublabel && (
                <p className="text-xs text-neutral-500 mt-1">{sublabel}</p>
            )}
        </motion.div>
    );
};
