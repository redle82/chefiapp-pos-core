import { motion } from 'framer-motion';
import React from 'react';

export const ContractItem: React.FC<{ delay: number; label: string; value: string }> = ({ delay, label, value }) => (
    <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay }}
    >
        <span className="text-neutral-500">{label}</span>
        <span className="text-white">{value}</span>
    </motion.div>
);
