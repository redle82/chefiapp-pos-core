import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { readProductsByRestaurant } from '../../core-boundary/readers/ProductReader';

/** Seed restaurant ID (Docker Core). Slug → restaurant_id resolver can be added later. */
const DEFAULT_RESTAURANT_ID = '00000000-0000-0000-0000-000000000100';

export interface PublicMenuProduct {
  id: string;
  name: string;
  price_cents: number;
  category?: string;
}

interface PublicMenuData {
  storeName: string;
  categories: string[];
  products: PublicMenuProduct[];
  isLoading: boolean;
}

const PublicMenuContext = createContext<PublicMenuData | undefined>(undefined);

export const PublicMenuProvider: React.FC<{ children: ReactNode; slug?: string }> = ({ children, slug }) => {
  const [products, setProducts] = useState<PublicMenuProduct[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    readProductsByRestaurant(DEFAULT_RESTAURANT_ID, true, true)
      .then((data) => {
        if (!mounted) return;
        const mapped: PublicMenuProduct[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          price_cents: p.price_cents,
          category: p.gm_menu_categories?.name ?? undefined,
        }));
        setProducts(mapped);
      })
      .catch(() => {
        if (mounted) setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [slug]);

  const categories: string[] = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (typeof p.category === 'string') cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  const storeName = 'ChefIApp Bistro';

  const value: PublicMenuData = {
    storeName,
    categories,
    products,
    isLoading,
  };

  return (
    <PublicMenuContext.Provider value={value}>
      {children}
    </PublicMenuContext.Provider>
  );
};

export const usePublicMenu = () => {
  const context = useContext(PublicMenuContext);
  if (!context) {
    throw new Error('usePublicMenu must be used within a PublicMenuProvider');
  }
  return context;
};
