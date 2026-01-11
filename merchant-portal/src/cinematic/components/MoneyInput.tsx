
// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({ value, onChange, ...props }) => {
    return (
        <div className="relative flex items-center justify-center">
            <span className="text-4xl md:text-6xl font-bold text-gold-500 mr-2">€</span>
            <motion.input
                type="number"
                placeholder="0.00"
                className="bg-transparent border-b-2 border-white/20 focus:border-gold-500 
                     text-4xl md:text-6xl font-bold text-white text-center w-48
                     outline-none transition-all duration-300 placeholder-white/10"
                value={value}
                onChange={onChange}
                {...props}
            />
        </div>
    );
};
