/**
 * Customer Portal - App Principal
 * 
 * Rota dinâmica: /:slug carrega o cardápio do restaurante
 * Exemplo: /sofia-gastrobar -> menu do Sofia Gastrobar
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MenuProvider, useMenu, type MenuItem } from './context/MenuContext';
import { CartProvider } from './context/CartContext';
import { MenuList } from './components/MenuList';
import { CartFloatingButton } from './components/CartFloatingButton';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { useSlugFromURL } from './hooks/useSlugFromURL';
import { NotFoundPage, LoadingPage } from './pages/NotFoundPage';

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
function MainLayout() {
    const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
    const { isLoading, error } = useMenu();

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
            <Header />

            <main className="pt-md pb-24">
                <MenuList onProductSelect={setSelectedProduct} />
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
                <MainLayout />
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

// --- App Root ---
function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Home - landing ou redirect */}
                <Route path="/" element={<HomePage />} />

                {/* Rota dinâmica: /:slug */}
                <Route path="/:slug" element={<RestaurantPage />} />

                {/* Fallback para rotas não encontradas */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
