import React, { useState, useEffect } from 'react';
import './PublicPages.css';
import PublicHome from './views/PublicHome';
import type { WebOrder } from '../../../../web-module/contracts';
import { fetchWithTimeout } from '../../core/utils/http/fetchWithTimeout';
import { SupplierBanner } from '../../components/Supplier/SupplierBanner';
import type { Placement } from '../../types/supplier';
import { supabase } from '../../core/supabase';

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

// ... (Rest of types unchanged)

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

        // ... (Supplier layer unchanged)

      } catch (err) {
        // ... (Error handling unchanged)
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  // ... (addToCart unchanged)

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

        const { data: request, error: insertError } = await supabase
          .from('gm_order_requests')
          .insert(requestPayload)
          .select() // Select back to confirm
          .single();

        if (insertError) throw insertError;

        console.log('[Airlock] Request Accepted:', request.id);

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
            onClick={() => { setCart([]); setCurrentView('home'); }}
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
