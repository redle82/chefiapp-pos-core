/**
 * Customer Portal - App Principal
 *
 * Rota dinâmica: /:slug carrega o cardápio do restaurante
 * Exemplo: /sofia-gastrobar -> menu do Sofia Gastrobar
 */

import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartDrawer } from './components/CartDrawer';
import { CartFloatingButton } from './components/CartFloatingButton';
import { MenuList } from './components/MenuList';
import { ProductModal } from './components/ProductModal';
import { RestaurantSEO } from './components/RestaurantSEO';
import { CartProvider } from './context/CartContext';
import { MenuProvider, useMenu, type MenuItem } from './context/MenuContext';
import { useSlugFromURL } from './hooks/useSlugFromURL';
import { LoadingPage, NotFoundPage } from './pages/NotFoundPage';
import { trackViewItem } from './lib/pixel';

// --- Header ---
function Header() {
    const { profile } = useMenu();

    if (!profile) return null;

    return (
        <div className="sticky top-0 z-20 bg-surface-base/80 backdrop-blur-md border-b border-white/5 px-md py-lg text-center">
            <h1 className="text-2xl font-bold text-brand-gold">{profile.hero.title}</h1>
            {profile.hero.subtitle && (
                <p className="text-sm text-text-secondary mt-1">{profile.hero.subtitle}</p>
            )}
        </div>
    );
}

// --- Main Layout (dentro do contexto do menu) ---
function MainLayout({ slug }: { slug: string }) {
    const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
    const { isLoading, error } = useMenu();

    // Handle product selection with tracking
    const handleProductSelect = (product: MenuItem) => {
        setSelectedProduct(product);
        
        // Track view item event
        trackViewItem({
            id: product.id,
            name: product.name,
            category: product.category_id,
            price: product.price_cents / 100,
            currency: product.currency || 'EUR',
        });
    };

    // Loading state
    if (isLoading) {
        return <LoadingPage />;
    }

    // Error state (menu não encontrado, etc.)
    if (error) {
        return <NotFoundPage error={error} />;
    }

    return (
        <div className="min-h-screen w-full bg-surface-base text-text-primary relative">
            {/* Dynamic SEO & Schema.org */}
            <RestaurantSEO slug={slug} />
            
            <Header />

            <main className="pt-md pb-24">
                <MenuList onProductSelect={handleProductSelect} />
            </main>

            <ProductModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />

            <CartFloatingButton />
            <CartDrawer />
        </div>
    );
}

// --- Restaurant Page (com slug da URL) ---
function RestaurantPage() {
    const { slug, isValid, error } = useSlugFromURL();

    // Slug inválido
    if (!isValid || !slug) {
        return <NotFoundPage error={error} slug={slug} />;
    }

    // Slug válido - carregar menu
    return (
        <MenuProvider slug={slug}>
            <CartProvider slug={slug}>
                <MainLayout slug={slug} />
            </CartProvider>
        </MenuProvider>
    );
}

// --- Home Page (redirect ou landing) ---
function HomePage() {
    // Por enquanto, mostra uma página informativa
    // Em produção, poderia ser uma landing page
    return (
        <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md">
                <div className="text-6xl mb-6">🍽️</div>
                <h1 className="text-2xl font-bold text-text-primary mb-3">
                    ChefIApp - Cardápio Digital
                </h1>
                <p className="text-text-secondary mb-6">
                    Acesse o cardápio de um restaurante usando o link fornecido por ele.
                </p>
                <p className="text-sm text-text-secondary">
                    Exemplo: <code className="bg-surface-elevated px-2 py-1 rounded">chefiapp.com/nome-do-restaurante</code>
                </p>
            </div>
        </div>
    );
}

// --- Checkout Page Wrapper ---
function CheckoutRoute() {
    const { slug, isValid, error } = useSlugFromURL();

    if (!isValid || !slug) {
        return <NotFoundPage error={error} slug={slug} />;
    }

    return (
        <MenuProvider slug={slug}>
            <CartProvider slug={slug}>
                <CheckoutPage />
            </CartProvider>
        </MenuProvider>
    );
}

// --- App Root ---
function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Home - landing ou redirect */}
                <Route path="/" element={<HomePage />} />

                {/* Rota dinâmica: /:slug */}
                <Route path="/:slug" element={<RestaurantPage />} />

                {/* Checkout: /:slug/checkout */}
                <Route path="/:slug/checkout" element={<CheckoutRoute />} />

                {/* Fallback para rotas não encontradas */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
