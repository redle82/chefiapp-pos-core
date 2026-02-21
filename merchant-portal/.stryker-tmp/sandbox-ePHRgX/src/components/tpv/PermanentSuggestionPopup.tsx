// @ts-nocheck
import React from 'react';
import { Button } from '../../ui/design-system/Button';
import { motion, AnimatePresence } from 'framer-motion';

/** Minimal product shape for suggestion popup (name + usage count). */
interface SuggestionProduct {
  name: string;
  usageCount: number;
}

interface PermanentSuggestionPopupProps {
    product: SuggestionProduct;
    onPromote: () => void;
    onDismiss: () => void;
}

export const PermanentSuggestionPopup: React.FC<PermanentSuggestionPopupProps> = ({
    product,
    onPromote,
    onDismiss
}) => {
    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-[200] flex items-end sm:items-center justify-center p-4">
                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="bg-neutral-900 border border-gold-500/30 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_40px_rgba(255,215,0,0.1)] relative overflow-hidden"
                >
                    {/* Background Shine */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50" />

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                            <span className="text-2xl">⚡</span>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-white">Menu Vivo Detectou</h3>
                            <p className="text-neutral-400 text-sm mt-1">
                                Você vendeu <span className="text-white font-medium">"{product.name}"</span> {product.usageCount} vezes hoje.
                            </p>
                        </div>

                        <div className="bg-neutral-800/50 rounded-lg p-3 w-full text-xs text-neutral-500 border border-neutral-800">
                            Produtos frequentes merecem destaque. Quer fixar este item no Menu oficial para relatórios melhores?
                        </div>

                        <div className="flex gap-3 w-full pt-2">
                            <Button variant="ghost" className="flex-1" onClick={onDismiss}>
                                Agora não
                            </Button>
                            <Button variant="primary" className="flex-1" onClick={onPromote}>
                                Sim, Fixar Item
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
