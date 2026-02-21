// @ts-nocheck
import React from 'react';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

export const CartFloatingButton: React.FC = () => {
    const { items, total, setIsCartOpen } = useCart();
    const count = items.reduce((acc, i) => acc + i.qty, 0);

    if (count === 0) return null;

    return (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <motion.button
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartOpen(true)}
                className="pointer-events-auto bg-gold-500 text-black font-bold py-3 px-6 rounded-full shadow-[0_4px_20px_rgba(234,179,8,0.4)] flex items-center gap-3 border border-yellow-400"
            >
                <div className="bg-black/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono">
                    {count}
                </div>
                <span>Ver Pedido</span>
                <span className="opacity-60">|</span>
                <span>{total.toFixed(2)}€</span>
            </motion.button>
        </div>
    );
};
