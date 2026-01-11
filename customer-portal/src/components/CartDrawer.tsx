import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';

export function CartDrawer() {
    const {
        items,
        totalCents,
        updateQuantity,
        removeFromCart,
        isCartOpen,
        setIsCartOpen,
        clearCart
    } = useCart();

    const { profile } = useMenu();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Pegar tableId da URL se disponível (ex: /slug?mesa=5 ou /slug/mesa/5)
    const [searchParams] = useSearchParams();
    const tableIdFromUrl = searchParams.get('mesa') || searchParams.get('table');

    if (!isCartOpen) return null;

    async function handleCheckout() {
        if (items.length === 0) return;

        setIsSubmitting(true);

        try {
            // API URL: usa env var ou fallback para localhost em dev
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4320';

            const payload = {
                tableId: tableIdFromUrl || null, // null = balcão/delivery
                items: items.map(i => ({
                    productId: i.productId,
                    qty: i.qty,
                    notes: i.notes
                }))
            };

            console.log('Submitting Order:', payload);

            // POST para API de pedidos
            const response = await fetch(`${apiBase}/public/${profile?.slug}/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Erro ao enviar pedido');
            }

            // Success!
            setOrderSuccess(true);
            setTimeout(() => {
                clearCart();
                setIsCartOpen(false);
                setOrderSuccess(false);
            }, 2000);

        } catch (error: any) {
            console.error('Order failed', error);
            alert(error.message || 'Erro ao enviar pedido. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-surface-base h-full shadow-2xl flex flex-col transform transition-transform duration-300">

                {/* Header */}
                <div className="p-md border-b border-surface-border flex justify-between items-center bg-surface-elevated">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">Seu Pedido</h2>
                        {tableIdFromUrl && (
                            <p className="text-sm text-text-secondary">Mesa {tableIdFromUrl}</p>
                        )}
                    </div>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-surface-highlight rounded-full text-text-secondary"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-md space-y-md">
                    {items.length === 0 ? (
                        <div className="text-center text-text-secondary mt-12 space-y-4">
                            <div className="text-4xl">🛒</div>
                            <p>Seu carrinho está vazio.</p>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="text-brand-gold font-bold hover:underline"
                            >
                                Ver Menu
                            </button>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="bg-surface-elevated p-md rounded-lg border border-surface-border flex gap-md">
                                <div className="flex-1">
                                    <h3 className="font-bold text-text-primary">{item.name}</h3>
                                    <div className="text-brand-gold text-sm font-medium">
                                        {((item.price_cents * item.qty) / 100).toLocaleString('pt-PT', { style: 'currency', currency: item.currency })}
                                    </div>
                                    {item.notes && (
                                        <p className="text-xs text-text-secondary mt-1 italic">"{item.notes}"</p>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-3 bg-surface-base rounded-lg border border-surface-border p-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="p-1 hover:text-brand-gold text-text-secondary"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="font-bold text-sm min-w-[20px] text-center">{item.qty}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="p-1 hover:text-brand-gold text-text-secondary"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-xs text-risk-high hover:underline flex items-center gap-1"
                                    >
                                        <Trash2 size={12} /> Remover
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-lg bg-surface-elevated border-t border-surface-border space-y-md">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span className="text-text-secondary">Total</span>
                            <span className="text-brand-gold">
                                {(totalCents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>

                        <button
                            disabled={isSubmitting || orderSuccess}
                            onClick={handleCheckout}
                            className={clsx(
                                "w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center",
                                orderSuccess ? "bg-green-500 text-white" : "bg-brand-gold hover:bg-brand-gold-light text-surface-base",
                                isSubmitting && "opacity-70 cursor-wait"
                            )}
                        >
                            {isSubmitting ? 'Enviando Pedido...' : orderSuccess ? 'Pedido Enviado! ✅' : `Confirmar Pedido • ${(totalCents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`}
                        </button>

                        {profile?.hero?.title && (
                            <p className="text-center text-xs text-text-disabled">
                                Pedido será enviado para {profile.hero.title}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
