
import React from 'react';
import { motion } from 'framer-motion';

interface EstimateSelectorProps {
    label?: string;
    value?: string;
    options: string[];
    onChange: (val: string) => void;
}

export const EstimateSelector: React.FC<EstimateSelectorProps> = ({
    label = "Quantos, mais ou menos?",
    value,
    options,
    onChange
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
        >
            <p className="text-xs text-neutral-400 mb-2 pl-1">{label}</p>
            <div className="flex gap-2">
                {options.map((opt) => {
                    const isSelected = value === opt;
                    return (
                        <button
                            key={opt}
                            onClick={(e) => { e.stopPropagation(); onChange(opt); }}
                            className={`
                            px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                            ${isSelected
                                    ? 'bg-gold-500 border-gold-500 text-black shadow-lg shadow-gold-500/20'
                                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                                }
                        `}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
};
