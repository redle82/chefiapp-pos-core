/**
 * PUBLIC WEB ORDERING PAGE
 * 
 * Mobile-first public ordering interface for restaurants.
 * 
 * Route: /public/:slug
 * 
 * Features:
 * - Menu navigation
 * - Cart management (localStorage)
 * - Order submission (auto-accept or airlock)
 * - Status tracking
 * 
 * @constitutional Bridge between public web and sovereign order system.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WebOrderingService, type WebOrderItem, type RestaurantWebConfig, type WebOrderResult } from '../../core/services/WebOrderingService';
import { supabase } from '../../core/supabase';
import { getTabIsolated, setTabIsolated, removeTabIsolated } from '../../core/storage/TabIsolatedStorage';
import './PublicPages.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price_cents: number;
    photo_url?: string;
    available?: boolean;
}

interface MenuCategory {
    id: string;
    name: string;
    items: MenuItem[];
}

interface CartItem {
    product_id: string;
    name: string;
    price_cents: number;
    quantity: number;
    notes?: string;
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

    // State
    const [view, setView] = useState<PageView>('home');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Restaurant data
    const [config, setConfig] = useState<RestaurantWebConfig | null>(null);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    
    // Cart
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // Order
    const [submitting, setSubmitting] = useState(false);
    const [orderResult, setOrderResult] = useState<WebOrderResult | null>(null);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);

    // ─────────────────────────────────────────────────────────────────────────
    // DATA LOADING
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!slug) {
            setError('URL inválida');
            setLoading(false);
            return;
        }

        loadRestaurantData();
    }, [slug]);

    const loadRestaurantData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Get restaurant + menu via Supabase
            const { data: restaurantData, error: dbError } = await supabase
                .from('gm_restaurants')
                .select(`
                    id,
                    tenant_id,
                    name,
                    slug,
                    description,
                    web_ordering_enabled,
                    auto_accept_web_orders,
                    menu_categories:gm_menu_categories (
                        id,
                        name,
                        items:gm_products (
                            id,
                            name,
                            description,
                            price_cents,
                            photo_url,
                            available
                        )
                    )
                `)
                .eq('slug', slug)
                .single();

            if (dbError) throw dbError;
            if (!restaurantData) throw new Error('Restaurante não encontrado');

            // 2. Set config
            setConfig({
                restaurant_id: restaurantData.id,
                tenant_id: restaurantData.tenant_id,
                name: restaurantData.name,
                slug: restaurantData.slug,
                web_ordering_enabled: restaurantData.web_ordering_enabled ?? true,
                auto_accept_web_orders: restaurantData.auto_accept_web_orders ?? false
            });

            // 3. Set menu (filter available items)
            const filteredCategories = (restaurantData.menu_categories || [])
                .map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    items: (cat.items || []).filter((item: any) => item.available !== false)
                }))
                .filter((cat: MenuCategory) => cat.items.length > 0);

            setCategories(filteredCategories);

            // 4. Load cart from storage
            setCart(loadCart(restaurantData.id));

        } catch (err: any) {
            console.error('[PublicOrdering] Load failed:', err);
            setError(err.message || 'Erro ao carregar restaurante');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // CART MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    const addToCart = useCallback((item: MenuItem) => {
        if (!config) return;

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
                    price_cents: item.price_cents,
                    quantity: 1
                }];
            }

            saveCart(config.restaurant_id, newCart);
            return newCart;
        });
    }, [config]);

    const removeFromCart = useCallback((productId: string) => {
        if (!config) return;

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

            saveCart(config.restaurant_id, newCart);
            return newCart;
        });
    }, [config]);

    const clearCart = useCallback(() => {
        if (!config) return;
        setCart([]);
        clearCartStorage(config.restaurant_id);
    }, [config]);

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

    const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
    const [submissionProgress, setSubmissionProgress] = useState<{
        phase: string;
        message: string;
        attempt?: number;
        maxAttempts?: number;
    } | null>(null);

    const submitOrder = async () => {
        if (!config || cart.length === 0) return;

        setSubmitting(true);
        setError(null);
        setSubmissionProgress({ phase: 'SENDING', message: 'Enviando seu pedido...' });

        try {
            const result = await WebOrderingService.submitOrderWithRetry(
                {
                    restaurant_id: config.restaurant_id,
                    items: cart.map(item => ({
                        product_id: item.product_id,
                        name: item.name,
                        quantity: item.quantity,
                        price_cents: item.price_cents,
                        notes: item.notes
                    }))
                },
                (progress) => {
                    // Update UI with progress
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

            if (result.success) {
                clearCart();
                setView('success');
                
                // Start status polling
                if (result.order_id || result.request_id) {
                    startStatusPolling(result.order_id, result.request_id);
                }
            } else if (result.status === 'UNCERTAIN') {
                // Order may have been received - show uncertain state
                clearCart(); // Clear cart to prevent retry
                setView('success');
                setOrderStatus('⏳ Não foi possível confirmar. Seu pedido pode ter sido recebido.');
                
                // If we have IDs, still try polling
                if (result.order_id || result.request_id) {
                    startStatusPolling(result.order_id, result.request_id);
                }
            } else if (result.status === 'BLOCKED') {
                // Handle protection blocks
                if (result.blockReason === 'DUPLICATE') {
                    // If duplicate, show existing order status
                    if (result.order_id || result.request_id) {
                        setView('success');
                        setOrderStatus('📋 Este pedido já foi enviado anteriormente.');
                        startStatusPolling(result.order_id, result.request_id);
                    } else {
                        setError(result.message);
                    }
                } else if (result.blockReason === 'RATE_LIMITED' && result.retryAfterSeconds) {
                    // Start countdown for retry
                    setRetryCountdown(result.retryAfterSeconds);
                    setError(result.message);
                    
                    const countdown = setInterval(() => {
                        setRetryCountdown(prev => {
                            if (prev && prev > 1) return prev - 1;
                            clearInterval(countdown);
                            setError(null);
                            return null;
                        });
                    }, 1000);
                } else {
                    setError(result.message);
                }
            } else {
                setError(result.message);
            }

        } catch (err: any) {
            console.error('[PublicOrdering] Submit failed:', err);
            setError('Erro ao enviar pedido. Tente novamente.');
            setSubmissionProgress(null);
        } finally {
            setSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STATUS TRACKING
    // ─────────────────────────────────────────────────────────────────────────

    const startStatusPolling = (orderId?: string, requestId?: string) => {
        const poll = async () => {
            const { status, message } = await WebOrderingService.checkStatus(orderId, requestId);
            setOrderStatus(message);

            // Stop polling on terminal states
            if (['READY', 'PAID', 'CANCELLED', 'REJECTED'].includes(status)) {
                return;
            }

            // Continue polling
            setTimeout(poll, 5000); // 5 seconds
        };

        poll();
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FORMATTING
    // ─────────────────────────────────────────────────────────────────────────

    const formatPrice = (cents: number) =>
        (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: LOADING / ERROR
    // ─────────────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="public-loading">
                <div className="public-loading__spinner">🍳</div>
                <p>Carregando cardápio...</p>
            </div>
        );
    }

    if (error && !config) {
        return (
            <div className="public-error">
                <h2>😕 Ops!</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Tentar novamente</button>
            </div>
        );
    }

    if (!config) return null;

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: HOME
    // ─────────────────────────────────────────────────────────────────────────

    if (view === 'home') {
        return (
            <div className="public-home">
                <div className="public-hero">
                    <div className="public-hero__content">
                        <h1 className="public-hero__title">{config.name}</h1>
                        <p className="public-hero__subtitle">
                            Faça seu pedido diretamente do celular
                        </p>
                        <div className="public-hero__ctas">
                            <button
                                className="public-hero__cta public-hero__cta--primary"
                                onClick={() => setView('menu')}
                            >
                                🍔 Ver Cardápio
                            </button>
                        </div>
                    </div>
                </div>

                {/* Featured items preview */}
                {categories.length > 0 && categories[0].items.length > 0 && (
                    <div className="public-section">
                        <h2 className="public-section__title">Destaques</h2>
                        <div className="public-featured-grid">
                            {categories[0].items.slice(0, 3).map(item => (
                                <div key={item.id} className="public-menu-item public-menu-item--featured">
                                    {item.photo_url && (
                                        <img
                                            src={item.photo_url}
                                            alt={item.name}
                                            className="public-menu-item__image"
                                        />
                                    )}
                                    <h3 className="public-menu-item__name">{item.name}</h3>
                                    <p className="public-menu-item__price">{formatPrice(item.price_cents)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: MENU
    // ─────────────────────────────────────────────────────────────────────────

    if (view === 'menu') {
        return (
            <div className="public-menu">
                <header className="public-menu__header">
                    <button className="public-menu__back" onClick={() => setView('home')}>
                        ← Voltar
                    </button>
                    <h1 className="public-menu__title">Cardápio</h1>
                    {cartCount > 0 && (
                        <button
                            className="public-menu__cart-btn"
                            onClick={() => setView('checkout')}
                        >
                            🛒 {cartCount}
                        </button>
                    )}
                </header>

                <div className="public-menu__content">
                    {categories.map(category => (
                        <section key={category.id} className="public-menu__category">
                            <h2 className="public-menu__category-title">{category.name}</h2>
                            <div className="public-menu__items">
                                {category.items.map(item => {
                                    const inCart = cart.find(i => i.product_id === item.id);
                                    return (
                                        <div key={item.id} className="public-menu-item">
                                            <div className="public-menu-item__info">
                                                <h3 className="public-menu-item__name">{item.name}</h3>
                                                {item.description && (
                                                    <p className="public-menu-item__description">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <p className="public-menu-item__price">
                                                    {formatPrice(item.price_cents)}
                                                </p>
                                            </div>
                                            <div className="public-menu-item__actions">
                                                {inCart ? (
                                                    <div className="public-menu-item__qty-control">
                                                        <button onClick={() => removeFromCart(item.id)}>−</button>
                                                        <span>{inCart.quantity}</span>
                                                        <button onClick={() => addToCart(item)}>+</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="public-menu-item__add"
                                                        onClick={() => addToCart(item)}
                                                    >
                                                        Adicionar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Fixed cart bar */}
                {cartCount > 0 && (
                    <div className="public-cart-bar">
                        <div className="public-cart-bar__info">
                            <span>{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
                            <span className="public-cart-bar__total">{formatPrice(cartTotal)}</span>
                        </div>
                        <button
                            className="public-cart-bar__checkout"
                            onClick={() => setView('checkout')}
                        >
                            Ver Pedido
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: CHECKOUT
    // ─────────────────────────────────────────────────────────────────────────

    if (view === 'checkout') {
        return (
            <div className="public-checkout">
                <header className="public-menu__header">
                    <button className="public-menu__back" onClick={() => setView('menu')}>
                        ← Voltar
                    </button>
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
                                            <button onClick={() => addToCart({ 
                                                id: item.product_id, 
                                                name: item.name, 
                                                price_cents: item.price_cents 
                                            })}>+</button>
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

                            {error && (
                                <div className="public-checkout__error">
                                    {error}
                                </div>
                            )}

                            {/* Progress feedback during submission */}
                            {submitting && submissionProgress && (
                                <div className="public-checkout__progress">
                                    <div className="public-checkout__progress-spinner" />
                                    <span className="public-checkout__progress-message">
                                        {submissionProgress.message}
                                    </span>
                                    {submissionProgress.attempt && submissionProgress.maxAttempts && 
                                     submissionProgress.attempt > 1 && (
                                        <span className="public-checkout__progress-attempt">
                                            Tentativa {submissionProgress.attempt}/{submissionProgress.maxAttempts}
                                        </span>
                                    )}
                                </div>
                            )}

                            {!config.web_ordering_enabled ? (
                                <div className="public-checkout__disabled">
                                    <p>⚠️ Pedidos online desativados temporariamente</p>
                                </div>
                            ) : (
                                <button
                                    className="public-checkout__submit"
                                    onClick={submitOrder}
                                    disabled={submitting || cart.length === 0 || retryCountdown !== null}
                                >
                                    {submitting 
                                        ? (submissionProgress?.message || 'Enviando...')
                                        : retryCountdown 
                                            ? `Aguarde ${retryCountdown}s...`
                                            : 'Confirmar Pedido'
                                    }
                                </button>
                            )}

                            <p className="public-checkout__note">
                                {config.auto_accept_web_orders
                                    ? '✓ Seu pedido será enviado diretamente para a cozinha'
                                    : 'O restaurante confirmará seu pedido em instantes'
                                }
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: SUCCESS
    // ─────────────────────────────────────────────────────────────────────────

    if (view === 'success') {
        return (
            <div className="public-success">
                <div className="public-success__icon">
                    {orderResult?.status === 'ACCEPTED' ? '✅' : '📬'}
                </div>
                <h1 className="public-success__title">
                    {orderResult?.status === 'ACCEPTED' 
                        ? 'Pedido Recebido!' 
                        : 'Pedido Enviado!'
                    }
                </h1>
                <p className="public-success__message">
                    {orderResult?.message}
                </p>

                {orderStatus && (
                    <div className="public-success__status">
                        <span className="public-success__status-label">Status:</span>
                        <span className="public-success__status-value">{orderStatus}</span>
                    </div>
                )}

                {orderResult?.order_id && (
                    <p className="public-success__order-id">
                        Pedido #{orderResult.order_id.slice(0, 8).toUpperCase()}
                    </p>
                )}

                <div className="public-success__actions">
                    <button
                        className="public-success__btn public-success__btn--primary"
                        onClick={() => {
                            setView('home');
                            setOrderResult(null);
                            setOrderStatus(null);
                        }}
                    >
                        Fazer Novo Pedido
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

export default PublicOrderingPage;
