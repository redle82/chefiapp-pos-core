
// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

interface PulseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
}

export const PulseButton: React.FC<PulseButtonProps> = ({ children, variant = 'primary', ...props }) => {
    const isPrimary = variant === 'primary';

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{
                opacity: 1,
                y: 0,
                boxShadow: isPrimary ? ["0 0 0 rgba(201, 162, 39, 0)", "0 0 20px rgba(201, 162, 39, 0.5)", "0 0 0 rgba(201, 162, 39, 0)"] : "none"
            }}
            transition={{
                boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            }}
            className={`
        relative w-full py-4 px-6 rounded-xl font-bold text-lg tracking-wide
        flex items-center justify-center gap-2
        ${isPrimary
                    ? 'bg-gradient-to-r from-[#C9A227] to-[#E8C547] text-black shadow-lg'
                    : 'bg-white/10 text-white backdrop-blur-md border border-white/10 hover:bg-white/20'
                }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
            {...props}
        >
            {children}
        </motion.button>
    );
};
