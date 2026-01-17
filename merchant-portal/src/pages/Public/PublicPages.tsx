import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './PublicPages.css';
import PublicHome from './views/PublicHome';
import type { WebOrder } from '../../../../web-module/contracts';
import { fetchWithTimeout } from '../../core/utils/http/fetchWithTimeout';
import { SupplierBanner } from '../../components/Supplier/SupplierBanner';
import type { Placement } from '../../types/supplier';
import { supabase } from '../../core/supabase';
import { DbWriteGate } from '../../core/governance/DbWriteGate';
import { getTabIsolated, setTabIsolated } from '../../core/storage/TabIsolatedStorage';

// --- Shared Types (Reused from Contracts where possible) ---
interface PublicRestaurant {
  restaurant_id: string;
  tenant_id: string; // [FIX] Added tenant_id
  name: string;
  slug: string;
  description?: string;
  menu_categories: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
      description?: string;
      price_cents: number;
      photo_url?: string;
    }[];
  }[];
}

// P1-2 FIX: Cart Item Type
interface CartItem {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

type PageView = 'home' | 'menu' | 'checkout' | 'success' | 'contact';

// P1-2 FIX: Cart Storage Keys
const CART_STORAGE_KEY = 'chefiapp_public_cart';
const CART_TTL_KEY = 'chefiapp_public_cart_ttl';
const CART_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// P1-2 FIX: Load cart from localStorage with TTL check
function loadCart(restaurantId: string): CartItem[] {
  try {
    const ttl = getTabIsolated(`${CART_TTL_KEY}_${restaurantId}`);
    if (ttl) {
      const ttlTime = parseInt(ttl, 10);
      if (Date.now() > ttlTime) {
        // TTL expirado, limpar carrinho
        setTabIsolated(`${CART_STORAGE_KEY}_${restaurantId}`, '[]');
        setTabIsolated(`${CART_TTL_KEY}_${restaurantId}`, '');
        return [];
      }
    }

    const stored = getTabIsolated(`${CART_STORAGE_KEY}_${restaurantId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// P1-2 FIX: Save cart to localStorage with TTL
function saveCart(restaurantId: string, cart: CartItem[]): void {
  try {
    setTabIsolated(`${CART_STORAGE_KEY}_${restaurantId}`, JSON.stringify(cart));
    setTabIsolated(`${CART_TTL_KEY}_${restaurantId}`, (Date.now() + CART_TTL_MS).toString());
  } catch (err) {
    console.warn('[PublicPages] Failed to save cart:', err);
  }
}

const PublicPages: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<PublicRestaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ordering, setOrdering] = useState(false);
  const [placements, setPlacements] = useState<Placement[]>([]); // Supplier Visibility Layer

  // Parse slug from URL (simple assumption for now: /public/:slug)
  const pathParts = window.location.pathname.split('/');
  const slug = pathParts[pathParts.length - 1] || 'chef-burger'; // Default fallback

  // 1. Fetch Real Data (Sovereign Direct)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch Restaurant + Menu Structure via Supabase (Airlock Read)
        const { data: restaurantData, error: dbError } = await supabase
          .from('gm_restaurants')
          .select(`
            restaurant_id:id,
            tenant_id,
            name,
            slug,
            description,
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
        if (!restaurantData) throw new Error('Restaurante não encontrado na base soberana.');

        setRestaurant(restaurantData as any);

        // P1-2 FIX: Load cart from storage when restaurant loads
        if (restaurantData?.restaurant_id) {
          const savedCart = loadCart(restaurantData.restaurant_id);
          setCart(savedCart);
        }

        // ... (Supplier layer unchanged)

      } catch (err) {
        // ... (Error handling unchanged)
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  // P1-2 FIX: Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [cart]);

  // P1-2 FIX: Add to cart with persistence
  const addToCart = useCallback((item: { id: string; name: string; price_cents: number }) => {
    if (!restaurant) return;

    setCart(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      let newCart: CartItem[];

      if (existing) {
        newCart = prev.map(i =>
          i.itemId === item.id
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      } else {
        newCart = [...prev, {
          itemId: item.id,
          name: item.name,
          price: item.price_cents / 100, // Convert cents to euros
          qty: 1
        }];
      }

      // P1-2 FIX: Save to localStorage
      saveCart(restaurant.restaurant_id, newCart);
      return newCart;
    });
  }, [restaurant]);

  // P1-2 FIX: Remove from cart with persistence
  const removeFromCart = useCallback((itemId: string) => {
    if (!restaurant) return;

    setCart(prev => {
      const newCart = prev.filter(i => i.itemId !== itemId);
      saveCart(restaurant.restaurant_id, newCart);
      return newCart;
    });
  }, [restaurant]);

  // P1-2 FIX: Update quantity with persistence
  const updateCartQuantity = useCallback((itemId: string, qty: number) => {
    if (!restaurant) return;

    setCart(prev => {
      const newCart = prev.map(i =>
        i.itemId === itemId
          ? { ...i, qty: Math.max(0, qty) }
          : i
      ).filter(i => i.qty > 0); // Remove items with qty 0

      saveCart(restaurant.restaurant_id, newCart);
      return newCart;
    });
  }, [restaurant]);

  const submitOrder = async () => {
    if (!restaurant) return;
    setOrdering(true);
    try {
      // Construct Airlock Payload
      const itemsPayload = cart.map((i) => ({
        product_id: i.itemId,
        name: i.name,
        quantity: i.qty,
        price_cents: Math.round(i.price * 100),
        notes: ''
      }));

      const totalCents = Math.round(cartTotal * 100);

      const requestPayload = {
        tenant_id: restaurant.tenant_id, // [FIX] Use correct tenant_id
        items: itemsPayload,
        total_cents: totalCents,
        payment_method: 'UNKNOWN', // Default for now
        status: 'PENDING',
        request_source: 'WEB_PUBLIC',
        customer_contact: {
          name: 'Cliente Web',
          phone: '999999999',
          userAgent: navigator.userAgent
        }
      };

      try {
        console.log('[Airlock] Submitting Request...', requestPayload);

        console.log('[Airlock] Submitting Request (Via Gate)...', requestPayload);

        const { data: request, error: insertError } = await DbWriteGate.insert(
          'PublicPages',
          'gm_order_requests',
          requestPayload,
          { tenantId: restaurant.tenant_id }
        );

        if (insertError) throw insertError;

        console.log('[Airlock] Request Accepted:', request.id);

        // P1-2 FIX: Clear cart from storage after successful order
        if (restaurant) {
          saveCart(restaurant.restaurant_id, []);
        }
        setCart([]);
        setError(null);
        setCurrentView('success');
      } catch (e: any) {
        console.error('[PublicPages] Airlock Rejection:', e);
        setError('Erro ao enviar solicitação via Airlock. Tente novamente.');
      } finally {
        // cleanup
      }
    } catch (err) {
      console.error('[PublicPages] Critical Error:', err);
      setError('Erro crítico no sistema.');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="public-loading">Carregando cardápio...</div>;
  if (error || !restaurant) return <div className="public-error">{error || '404 - Restaurante não encontrado'}</div>;

  // --- VIEW: HOME ---
  if (currentView === 'home') {
    return (
      <PublicHome
        restaurantName={restaurant.name}
        description={restaurant.description || 'Bem-vindo!'}
        onSelectOption={(option) => {
          if (option === 'staff') {
            window.location.href = '/app/login';
          } else {
            setCurrentView(option);
          }
        }}
      />
    );
  }

  // --- VIEW: MENU ---
  if (currentView === 'menu') {
    return (
      <div className="public-menu">
        <div className="public-menu__header">
          <button className="public-menu__back" onClick={() => setCurrentView('home')}>← Voltar</button>
          <h1 className="public-menu__title">Cardápio</h1>

          {/* Supplier Visibility Layer: Header Placement */}
          {placements.find(p => p.location === 'MENU_HEADER') && (
            <div style={{ padding: '0 1rem' }}>
              <SupplierBanner placement={placements.find(p => p.location === 'MENU_HEADER')} />
            </div>
          )}

          {cart.length > 0 && (
            <button className="public-menu__cart-btn" onClick={() => setCurrentView('checkout')}>
              🛒 {cart.length} {cart.length === 1 ? 'item' : 'itens'}
            </button>
          )}
        </div>

        <div className="public-menu__content">
          {restaurant.menu_categories.map((cat) => (
            <div key={cat.id} className="public-menu__category">
              <h2 className="public-menu__category-title">{cat.name}</h2>
              <div className="public-menu__items">
                {cat.items.map((item) => (
                  <div key={item.id} className="public-menu-item">
                    <div className="public-menu-item__header">
                      <h3 className="public-menu-item__name">{item.name}</h3>
                    </div>
                    <p className="public-menu-item__description">{item.description}</p>
                    <div className="public-menu-item__footer">
                      {(item.price_cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                      <button className="public-menu-item__btn" onClick={() => addToCart(item)}>
                        Adicionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- VIEW: CHECKOUT ---
  if (currentView === 'checkout') {
    return (
      <div className="public-menu">
        <div className="public-menu__header">
          <button className="public-menu__back" onClick={() => setCurrentView('menu')}>← Voltar</button>
          <h1>Seu Pedido</h1>
        </div>
        <div className="public-menu__content">
          {cart.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
              <span>{item.qty}x {item.name}</span>
              <span>{(item.price * item.qty).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
            </div>
          ))}
          <div style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
            Total: {cartTotal.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </div>
          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33'
            }}>
              {error}
            </div>
          )}
          <button
            className="public-hero__cta public-hero__cta--primary"
            style={{ width: '100%', marginTop: '1rem' }}
            onClick={submitOrder}
            disabled={ordering}
          >
            {ordering ? 'Enviando...' : 'Confirmar Solicitação'}
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: SUCCESS ---
  if (currentView === 'success') {
    return (
      <div className="public-home">
        <div className="public-hero">
          <h1>Solicitação Recebida</h1>
          <p>O restaurante analisará seu pedido em instantes.</p>
          <button
            className="public-hero__cta public-hero__cta--secondary"
            onClick={() => {
              // P1-2 FIX: Clear cart from storage
              if (restaurant) {
                saveCart(restaurant.restaurant_id, []);
              }
              setCart([]);
              setCurrentView('home');
            }}
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-contact">
      <div className="public-contact__header">
        <button className="public-contact__back" onClick={() => setCurrentView('home')}>← Voltar</button>
        <h1>Contato</h1>
      </div>
      <div className="public-contact__content">
        <p>{restaurant.name}</p>
        <p>Em breve mais informações.</p>
      </div>
    </div>
  );
};

export default PublicPages;
