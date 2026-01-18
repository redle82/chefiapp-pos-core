
/**
 * PUBLIC WEB ORDERING PAGE
 * 
 * Mobile-first public ordering interface for restaurants.
 * Now powered by Intelligent Menu Systems (Dynamic + Sponsored).
 * 
 * Route: /public/:slug
 */

import React, { useState, useCallback, useMemo } from 'react';
import { usePublicMenu, type PublicMenuProduct } from './usePublicMenu';
import { WebOrderingService, type WebOrderResult } from '../../core/services/WebOrderingService';
import { getTabIsolated, setTabIsolated, removeTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { StripePaymentModal } from '../../components/payment/StripePaymentModal';
import './PublicPages.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CartItem {
    product_id: string;
    name: string;
    price_cents: number;
    quantity: number;
    notes?: string;
    // Snapshot of dynamic state at add time (optional, for debugging)
    dynamic_snapshot?: {
        score: number;
        is_sponsored: boolean;
    }
}

type PageView = 'home' | 'menu' | 'checkout' | 'success' | 'tracking';

// ─────────────────────────────────────────────────────────────────────────────
// CART STORAGE (localStorage)
// ─────────────────────────────────────────────────────────────────────────────

const CART_STORAGE_KEY = 'chefiapp_public_cart';

function loadCart(restaurantId: string): CartItem[] {
    try {
        const stored = getTabIsolated(`${CART_STORAGE_KEY}_${restaurantId}`);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveCart(restaurantId: string, cart: CartItem[]): void {
    try {
        setTabIsolated(`${CART_STORAGE_KEY}_${restaurantId}`, JSON.stringify(cart));
    } catch {
        console.warn('[PublicOrdering] Failed to save cart');
    }
}

function clearCartStorage(restaurantId: string): void {
    removeTabIsolated(`${CART_STORAGE_KEY}_${restaurantId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function PublicOrderingPage() {
    // URL parsing
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1] || '';

    // Hooks
    const { restaurant, menu, loading, error, trackClick } = usePublicMenu(slug);

    // State
    const [view, setView] = useState<PageView>('home');
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load cart on restaurant load
    React.useEffect(() => {
        if (restaurant?.id) {
            setCart(loadCart(restaurant.id));
        }
    }, [restaurant?.id]);

    // Order State
    const [submitting, setSubmitting] = useState(false);
    const [orderResult, setOrderResult] = useState<WebOrderResult | null>(null);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
    const [submissionProgress, setSubmissionProgress] = useState<{
        phase: string;
        message: string;
        attempt?: number;
        maxAttempts?: number;
    } | null>(null);

    // ─────────────────────────────────────────────────────────────────────────
    // CART MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    const addToCart = useCallback((item: PublicMenuProduct) => {
        if (!restaurant) return;

        trackClick(item.id); // Track engagement

        setCart(prev => {
            const existing = prev.find(i => i.product_id === item.id);
            let newCart: CartItem[];

            if (existing) {
                newCart = prev.map(i =>
                    i.product_id === item.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            } else {
                newCart = [...prev, {
                    product_id: item.id,
                    name: item.name,
                    price_cents: item.final_price_cents,
                    quantity: 1,
                    dynamic_snapshot: {
                        score: item.score,
                        is_sponsored: !!item.sponsorship
                    }
                }];
            }

            saveCart(restaurant.id, newCart);
            return newCart;
        });
    }, [restaurant, trackClick]);

    const removeFromCart = useCallback((productId: string) => {
        if (!restaurant) return;

        setCart(prev => {
            const existing = prev.find(i => i.product_id === productId);
            let newCart: CartItem[];

            if (existing && existing.quantity > 1) {
                newCart = prev.map(i =>
                    i.product_id === productId
                        ? { ...i, quantity: i.quantity - 1 }
                        : i
                );
            } else {
                newCart = prev.filter(i => i.product_id !== productId);
            }

            saveCart(restaurant.id, newCart);
            return newCart;
        });
    }, [restaurant]);

    const clearCart = useCallback(() => {
        if (!restaurant) return;
        setCart([]);
        clearCartStorage(restaurant.id);
    }, [restaurant]);

    const cartTotal = useMemo(() =>
        cart.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0),
        [cart]
    );

    const cartCount = useMemo(() =>
        cart.reduce((sum, item) => sum + item.quantity, 0),
        [cart]
    );

    // ─────────────────────────────────────────────────────────────────────────
    // ORDER SUBMISSION
    // ─────────────────────────────────────────────────────────────────────────

    // --- CHECKOUT VIEW ---
    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Dynamic import for Modal to avoid load if not needed? 
    // Actually, standard import is fine given we imported at top. 
    // Wait, top import missing. I should add it.

    // (Helper for handling payment flow)
    const handlePaymentClick = async () => {
        if (!restaurant || cart.length === 0) return;

        if (paymentMethod === 'cash') {
            await submitOrder('cash');
        } else {
            // Online Payment Flow
            setSubmitting(true);
            setSubmissionProgress({ phase: 'SENDING', message: 'Iniciando pagamento seguro...' });

            const result = await WebOrderingService.initiatePublicPayment(restaurant.id, cartTotal);

            if (result && result.clientSecret) {
                setClientSecret(result.clientSecret);
                setIsPaymentModalOpen(true);
                setSubmitting(false); // Stop submitting spinner, show modal
                setSubmissionProgress(null);
            } else {
                setSubmitting(false);
                setSubmissionProgress(null);
                alert('Erro ao iniciar pagamento. Tente novamente ou pague no balcão.');
            }
        }
    };

    const handleStripeSuccess = async (paymentIntentId: string) => {
        setIsPaymentModalOpen(false);
        // Proceed to submit order as PAID
        await submitOrder('online', paymentIntentId);
    };

    const submitOrder = async (method: 'cash' | 'online', transactionId?: string) => {
        if (!restaurant || cart.length === 0) return;

        setSubmitting(true);
        setSubmissionProgress({ phase: 'SENDING', message: 'Enviando seu pedido...' });

        try {
            const result = await WebOrderingService.submitOrderWithRetry(
                {
                    restaurant_id: restaurant.id,
                    items: cart.map(item => ({
                        product_id: item.product_id,
                        name: item.name,
                        quantity: item.quantity,
                        price_cents: item.price_cents,
                        notes: item.notes
                    })),
                    // Payment Details
                    payment_status: method === 'online' ? 'paid' : 'pending',
                    payment_method: method === 'online' ? 'online' : 'cash',
                    transaction_id: transactionId
                },
                (progress) => {
                    setSubmissionProgress({
                        phase: progress.phase,
                        message: progress.message,
                        attempt: progress.attempt,
                        maxAttempts: progress.maxAttempts
                    });
                }
            );

            setOrderResult(result);
            setSubmissionProgress(null);

            if (result.success || result.status === 'UNCERTAIN') {
                clearCart();
                setView('success');
                if (result.order_id || result.request_id) {
                    startStatusPolling(result.order_id, result.request_id);
                }
            } else if (result.status === 'BLOCKED' && result.blockReason === 'RATE_LIMITED' && result.retryAfterSeconds) {
                setRetryCountdown(result.retryAfterSeconds);
                const interval = setInterval(() => {
                    setRetryCountdown(prev => {
                        if (prev && prev > 1) return prev - 1;
                        clearInterval(interval);
                        return null;
                    });
                }, 1000);
            }

        } catch (err) {
            console.error('[PublicOrdering] Submit failed:', err);
            setSubmissionProgress(null);
        } finally {
            setSubmitting(false);
        }
    };

    if (view === 'checkout') {
        return (
            <div className="public-checkout">
                <header className="public-menu__header">
                    <button className="public-menu__back" onClick={() => setView('menu')}>← Voltar</button>
                    <h1 className="public-menu__title">Seu Pedido</h1>
                </header>

                <div className="public-checkout__content">
                    {cart.length === 0 ? (
                        <div className="public-checkout__empty">
                            <p>Seu carrinho está vazio</p>
                            <button onClick={() => setView('menu')}>Ver Cardápio</button>
                        </div>
                    ) : (
                        <>
                            <div className="public-checkout__items">
                                {cart.map(item => (
                                    <div key={item.product_id} className="public-checkout__item">
                                        <div className="public-checkout__item-info">
                                            <span className="public-checkout__item-name">
                                                {item.quantity}x {item.name}
                                            </span>
                                            <span className="public-checkout__item-price">
                                                {formatPrice(item.price_cents * item.quantity)}
                                            </span>
                                        </div>
                                        <div className="public-checkout__item-actions">
                                            <button onClick={() => removeFromCart(item.product_id)}>−</button>
                                            <button onClick={() => {
                                                const product = menu?.fullCatalog
                                                    .flatMap(c => c.items)
                                                    .find(p => p.id === item.product_id);
                                                if (product) addToCart(product);
                                            }}>+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="public-checkout__summary">
                                <div className="public-checkout__total">
                                    <span>Total</span>
                                    <span>{formatPrice(cartTotal)}</span>
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="public-checkout__payment-method">
                                <h3>Forma de Pagamento</h3>
                                <div className="payment-options">
                                    <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="card"
                                            checked={paymentMethod === 'card'}
                                            onChange={() => setPaymentMethod('card')}
                                        />
                                        <span>💳 Cartão / Google Pay</span>
                                    </label>
                                    <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cash"
                                            checked={paymentMethod === 'cash'}
                                            onChange={() => setPaymentMethod('cash')}
                                        />
                                        <span>💵 Pagar no Balcão</span>
                                    </label>
                                </div>
                            </div>

                            {/* Actions */}
                            <button
                                className="public-checkout__submit"
                                onClick={handlePaymentClick}
                                disabled={submitting || retryCountdown !== null}
                            >
                                {submitting ? (submissionProgress?.message || 'Processando...') :
                                    retryCountdown ? `Aguarde ${retryCountdown}s...` : 'Confirmar Pedido'}
                            </button>
                        </>
                    )}
                </div>

                {isPaymentModalOpen && clientSecret && (
                    <StripePaymentModal
                        clientSecret={clientSecret}
                        total={cartTotal / 100}
                        onSuccess={handleStripeSuccess}
                        onCancel={() => setIsPaymentModalOpen(false)}
                    />
                )}
            </div>
        );
    }

    // --- SUCCESS VIEW ---
    if (view === 'success') {
        return (
            <div className="public-success">
                <div className="public-success__icon">✅</div>
                <h1 className="public-success__title">Pedido Enviado!</h1>
                <p className="public-success__message">{orderResult?.message}</p>
                {orderStatus && <div className="public-success__status">{orderStatus}</div>}
                <button className="public-success__btn" onClick={() => {
                    setView('home');
                    setOrderResult(null);
                }}>Fazer Novo Pedido</button>
            </div>
        );
    }

    return null;
}

export default PublicOrderingPage;
