import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// --- Types ---

export interface MenuCategory {
    id: string;
    name: string;
    position: number;
}

export interface MenuItem {
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price_cents: number;
    currency: string;
    photo_url: string | null;
    tags: string[];
}

export interface RestaurantProfile {
    restaurant_id: string;
    slug: string;
    status: 'published' | 'draft';
    theme: string;
    hero: {
        title: string;
        subtitle?: string;
        image_url?: string;
    };
}

interface MenuData {
    categories: MenuCategory[];
    items: MenuItem[];
}

interface MenuApiResponse {
    profile: RestaurantProfile;
    menu: MenuData;
}

interface MenuContextType {
    profile: RestaurantProfile | null;
    categories: MenuCategory[];
    items: MenuItem[];
    isLoading: boolean;
    error: string | null;
}

// --- Context ---

const MenuContext = createContext<MenuContextType | undefined>(undefined);

// --- Provider ---

interface MenuProviderProps {
    slug: string;
    children: ReactNode;
}

export function MenuProvider({ slug, children }: MenuProviderProps) {
    const [data, setData] = useState<MenuApiResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                setIsLoading(true);

                // API URL: usa env var ou fallback para localhost em dev
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4320';
                const response = await fetch(`${apiBase}/public/${slug}/menu`);

                if (response.status === 404) {
                    throw new Error('Restaurante não encontrado');
                }

                if (!response.ok) {
                    throw new Error(`Erro ao carregar cardápio: ${response.statusText}`);
                }

                const json = await response.json();
                setData(json);
            } catch (err: unknown) {
                console.error('Menu load error:', err);
                setError(err instanceof Error ? err.message : 'Falha ao carregar cardápio');
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            fetchMenu();
        }
    }, [slug]);

    const value: MenuContextType = {
        profile: data?.profile || null,
        categories: data?.menu.categories || [],
        items: data?.menu.items || [],
        isLoading,
        error,
    };

    return (
        <MenuContext.Provider value={value}>
            {children}
        </MenuContext.Provider>
    );
}

// --- Hook ---

// eslint-disable-next-line react-refresh/only-export-components
export function useMenu() {
    const context = useContext(MenuContext);
    if (context === undefined) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
}
