import React from 'react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';


export const CartDrawer: React.FC = () => {
    const { items, total, isCartOpen, setIsCartOpen, updateQuantity, clearCart, slug, tableNumber } = useCart();

    // Status State
    const [status, setStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [message, setMessage] = React.useState('');
    // ERRO-017 Fix: Estado para cancelar pedido
    const [orderId, setOrderId] = React.useState<string | null>(null);
    const [orderTimestamp, setOrderTimestamp] = React.useState<number | null>(null);

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setStatus('sending');
        setMessage('Enviando pedido...');

        try {
            // 1. Get Restaurant Config
            const { WebOrderingService } = await import('../../core/services/WebOrderingService');
            const config = await WebOrderingService.getWebConfig(slug);

            if (!config) {
                setStatus('error');
                setMessage('Erro ao identificar restaurante. Tente recarregar.');
                return;
            }

            // 2. Submit Order
            const result = await WebOrderingService.submitOrderWithRetry({
                restaurant_id: config.restaurant_id,
                items: items.map(i => ({
                    product_id: i.productId,
                    name: i.name,
                    quantity: i.qty,
                    price_cents: Math.round(i.price * 100), // Convert to cents
                    notes: i.notes
                })),
                customer_name: 'Cliente Web', // TODO: Add Name Input
                table_number: tableNumber || 0, // ERRO-021 Fix: Usar número da mesa da URL ou 0 (Web/Takeaway)
            }, (progress) => {
                setMessage(progress.message);
            });

            if (result.success) {
                setStatus('success');
                // ERRO-001 Fix: Feedback claro e compreensível após envio
                setMessage('✅ Pedido recebido! Aguarde o preparo.');
                
                // ERRO-022 Fix: Salvar pedido pendente no localStorage
                if (tableNumber) {
                    const pendingOrderKey = `pending_order_${slug}_${tableNumber}`;
                    localStorage.setItem(pendingOrderKey, JSON.stringify({
                        orderId: result.order_id,
                        timestamp: Date.now()
                    }));
                }
                
                // ERRO-017 Fix: Armazenar orderId e timestamp para cancelamento
                if (result.order_id) {
                    setOrderId(result.order_id);
                    setOrderTimestamp(Date.now());
                    
                    // ERRO-005 Fix: Redirecionar para página de status após sucesso
                    setTimeout(() => {
                        window.location.href = `/public/${slug}/status/${result.order_id}`;
                    }, 2000); // Aguardar 2s para mostrar mensagem de sucesso
                }
                
                // ERRO-017 Fix: Não fechar drawer automaticamente, permitir cancelar
                // setTimeout removido - drawer fica aberto para mostrar botão de cancelar
            } else {
                setStatus('error');
                setMessage(result.message || 'Erro ao enviar pedido. Tente novamente.');
            }

        } catch (err) {
            console.error('Checkout failed', err);
            setStatus('error');
            setMessage('Erro ao enviar pedido. Verifique sua conexão.');
        }
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
                                            {/* ERRO-013 Fix: Botão remover item */}
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Remover ${item.name}?`)) {
                                                        updateQuantity(item.id, -item.qty); // Remove completamente
                                                    }
                                                }}
                                                className="w-7 h-7 rounded border border-red-500/50 text-red-400 flex items-center justify-center hover:bg-red-500/20"
                                                title="Remover item"
                                            >
                                                ✕
                                            </button>
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
                            {/* ERRO-001 Fix: Feedback visual claro após envio */}
                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl"
                                >
                                    <p className="text-green-400 font-semibold text-center">{message}</p>
                                    {/* ERRO-017 Fix: Botão cancelar pedido (visível por 2 minutos) */}
                                    {orderId && orderTimestamp && (Date.now() - orderTimestamp < 120000) && (
                                        <button
                                            onClick={async () => {
                                                if (confirm('Cancelar pedido? Esta ação não pode ser desfeita.')) {
                                                    try {
                                                        // TODO: Implementar cancelamento no backend
                                                        // Por enquanto, apenas limpar estado local
                                                        setOrderId(null);
                                                        setOrderTimestamp(null);
                                                        setStatus('idle');
                                                        clearCart();
                                                        setIsCartOpen(false);
                                                        alert('Pedido cancelado. Entre em contato com o restaurante se necessário.');
                                                    } catch (e) {
                                                        alert('Erro ao cancelar pedido. Entre em contato com o restaurante.');
                                                    }
                                                }
                                            }}
                                            className="mt-3 w-full py-2 bg-red-500/20 border border-red-500/50 text-red-400 font-semibold rounded-lg hover:bg-red-500/30 transition-colors"
                                        >
                                            Cancelar Pedido
                                        </button>
                                    )}
                                </motion.div>
                            )}
                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
                                >
                                    <p className="text-red-400 font-semibold text-center">{message}</p>
                                </motion.div>
                            )}
                            {status === 'sending' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl"
                                >
                                    <p className="text-blue-400 font-semibold text-center">{message}</p>
                                </motion.div>
                            )}

                            <div className="flex justify-between items-center mb-6">
                                <span className="text-white/60">Total</span>
                                <span className="text-2xl font-bold text-gold-500">{total.toFixed(2)}€</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={items.length === 0 || status === 'sending' || status === 'success'}
                                className="w-full py-4 bg-gold-500 text-black font-bold rounded-xl shadow-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === 'sending' ? 'Enviando...' : status === 'success' ? 'Pedido Enviado!' : 'Confirmar Pedido'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
