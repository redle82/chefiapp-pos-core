
// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

interface InputGiantProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const InputGiant: React.FC<InputGiantProps> = ({ label, ...props }) => {
    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
            {label && (
                <motion.label
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-neutral-400 text-lg md:text-xl font-medium mb-6"
                >
                    {label}
                </motion.label>
            )}

            <motion.input
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                autoFocus
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-gold-500 
                   text-4xl md:text-6xl lg:text-7xl font-bold text-center text-white 
                   placeholder-white/10 outline-none pb-4 transition-colors duration-300
                   caret-gold-500"
                {...props}
            />
        </div>
    );
};
