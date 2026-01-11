
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
// import { InputGiant } from '../components/InputGiant';
// import { MoneyInput } from '../components/MoneyInput';
import { PulseButton } from '../components/PulseButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingEngine } from '../context/OnboardingEngineProvider';

// Reusing types implicitly or we could import contracts
interface MenuItem {
    id: string;
    name: string;
    price: number;
    type: 'food' | 'drink';
}

export const Scene4MenuBuilder: React.FC = () => {
    const navigate = useNavigate();
    const { engine } = useOnboardingEngine();

    // Local state for the builder
    const [items, setItems] = useState<MenuItem[]>([]);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [type, setType] = useState<'food' | 'drink'>('food');
    // const [isAdding, setIsAdding] = useState(true); // Toggle between list and input

    const handleAddItem = () => {
        if (!name || !price) return;
        const newItem: MenuItem = {
            id: crypto.randomUUID(),
            name,
            price: parseFloat(price),
            type
        };
        setItems(prev => [...prev, newItem]);

        // Update Engine
        engine.updateSession(s => {
            if (!s.data.menu) s.data.menu = { items: [] };
            s.data.menu.items.push(newItem);
        });

        // Reset inputs
        setName('');
        setPrice('');
        // Keep adding? Or show list?
        // For cinematic feel, maybe show the list and ask "Another one?"
    };

    const handleNext = () => {
        // Sync Local State to Engine Session (Truth)
        engine.updateSession(s => {
            if (!s.data.menu) s.data.menu = { items: [] };
            s.data.menu.items = items; // Force sync
            console.log('Scene4: Saved items to session', s.data.menu.items);
        });

        navigate('/start/cinematic/6');
        // Note: Skipped explicit Scene 5 (Cuisine/Vibe) for this reconciliation pass 
        // as we are unifying logic. Scene 5 can be added back later or this IS Scene 5 logic.
    };

    const readyToAdd = name.length > 2 && parseFloat(price) > 0;
    const hasItems = items.length > 0;

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center pt-20 px-6 relative z-20 w-full max-w-4xl mx-auto h-full pb-32 overflow-y-auto">

                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 text-center">
                    O Coração do Restaurante
                </h1>
                <p className="text-neutral-400 mb-8 text-center">
                    O que vai fazer o cliente voltar?
                </p>

                {/* BUILDER AREA */}
                <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
                    {/* Item Type Toggles */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setType('food')}
                            className={`flex-1 py-3 rounded-xl border transition-all font-bold text-sm flex items-center justify-center gap-2 ${type === 'food'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                                : 'bg-white/5 border-white/10 text-neutral-500 hover:bg-white/10'
                                }`}
                        >
                            <span>🍽️</span> Prato
                        </button>
                        <button
                            onClick={() => setType('drink')}
                            className={`flex-1 py-3 rounded-xl border transition-all font-bold text-sm flex items-center justify-center gap-2 ${type === 'drink'
                                ? 'bg-purple-500/20 border-purple-500 text-purple-500'
                                : 'bg-white/5 border-white/10 text-neutral-500 hover:bg-white/10'
                                }`}
                        >
                            <span>🍹</span> Bebida
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Nome do Prato"
                            className="w-full bg-black/20 border-b border-white/10 py-3 px-2 text-white placeholder-neutral-600 focus:border-gold-500 outline-none transition-colors"
                        />
                        <input
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            type="number"
                            placeholder="Preço (ex: 12.50)"
                            className="w-full bg-black/20 border-b border-white/10 py-3 px-2 text-white placeholder-neutral-600 focus:border-gold-500 outline-none transition-colors"
                        />
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleAddItem}
                            disabled={!readyToAdd}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${readyToAdd
                                ? 'bg-white text-black hover:scale-[1.02]'
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                                }`}
                        >
                            + Adicionar à Carta
                        </button>
                    </div>
                </div>

                {/* LIST AREA */}
                <div className="w-full max-w-md space-y-3">
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{item.type === 'food' ? '🍽️' : '🍹'}</span>
                                <div>
                                    <div className="font-bold text-white">{item.name}</div>
                                    <div className="text-gold-500 text-sm">{item.price.toFixed(2)}€</div>
                                </div>
                            </div>
                            {/* Deletion could be added here */}
                        </motion.div>
                    ))}
                </div>

                {/* Footer Controls */}
                <AnimatePresence>
                    {hasItems && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none"
                        >
                            <div className="w-full max-w-xs pointer-events-auto">
                                <PulseButton onClick={handleNext}>
                                    Continuar ({items.length} itens) 👉
                                </PulseButton>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </CinemaLayout>
    );
};
