import React from 'react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineQueue } from '../../core/queue/useOfflineQueue';
import { GlobalEventStore } from '../../core/events/EventStore';
import type { EventEnvelope } from '../../core/events/SystemEvents';
import { SealGenerator } from '../../core/events/SealGenerator';

export const CartDrawer: React.FC = () => {
    const { items, total, isCartOpen, setIsCartOpen, updateQuantity, clearCart } = useCart();
    const { enqueue } = useOfflineQueue();
    // const enqueue = async (item: any) => { console.log('Mock Enqueue:', item); };

    const handleCheckout = async () => {
        if (items.length === 0) return;

        // Core 5 -> Core 2 Injection 💉
        // Core 5 -> Core 2 Injection 💉
        // 🏗️ IRON CORE: The Customer is an Actor.
        const orderId = `ord-${Date.now()}`;
        const rawPayload = {
            id: orderId,
            tableNumber: 0, // 0 = Web/Takeaway
            status: 'new', // Explicit status
            items: items.map(i => ({
                id: i.productId,
                name: i.name,
                quantity: i.qty,
                price: i.price,
                notes: i.notes
            })),
            total,
            origin: 'web',
            customerName: 'Cliente Web'
        };

        // 1. Construct Fact
        const event: EventEnvelope = {
            eventId: crypto.randomUUID(),
            type: 'ORDER_CREATED',
            payload: rawPayload,
            meta: {
                timestamp: Date.now(),
                actorId: 'public_user',
                sessionId: 'web_session',
                version: 1
            }
        };

        // 2. Seal It
        event.seal = await SealGenerator.seal(event);

        // 3. Commit to Local History (Kiosk/User Device)
        await GlobalEventStore.append(event);

        // 4. Emit to Sovereign Queue (Transport)
        await enqueue({
            id: event.eventId,
            type: 'ORDER_CREATE',
            payload: rawPayload, // Legacy Protocol (Server expects raw)
            createdAt: event.meta.timestamp,
            attempts: 0,
            status: 'queued'
        });

        // alert(`Pedido enviado para o balcão! ID: ${orderId}`);
        console.log(`Pedido enviado para o balcão! ID: ${orderId}`);
        clearCart();
        setIsCartOpen(false);
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[70] bg-[#111] rounded-t-3xl border-t border-white/10 max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white">Seu Pedido</h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {items.length === 0 ? (
                                <div className="text-center py-10 text-white/30">
                                    O carrinho está vazio.
                                </div>
                            ) : (
                                items.map(item => (
                                    <div key={item.id} className="flex justify-between items-start group">
                                        <div className="flex gap-3">
                                            <div className="bg-white/5 w-8 h-8 rounded flex items-center justify-center text-white text-sm font-mono">
                                                {item.qty}x
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium">{item.name}</h3>
                                                {item.notes && <p className="text-xs text-secondary-400">{item.notes}</p>}
                                                <p className="text-gold-500 text-sm mt-1">{(item.price * item.qty).toFixed(2)}€</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-7 h-7 rounded border border-white/10 text-white/50 flex items-center justify-center"
                                            >
                                                -
                                            </button>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-7 h-7 rounded border border-white/10 text-white flex items-center justify-center"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white/5 border-t border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-white/60">Total</span>
                                <span className="text-2xl font-bold text-gold-500">{total.toFixed(2)}€</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={items.length === 0}
                                className="w-full py-4 bg-gold-500 text-black font-bold rounded-xl shadow-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Pedido
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
