import type { ReactNode } from "react";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { resolveProductImageUrl } from "../../core/products/resolveProductImageUrl";
import { readProductsByRestaurant } from "../../infra/readers/ProductReader";

/** Seed restaurant ID (Docker Core). Slug → restaurant_id resolver can be added later. */
const DEFAULT_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

export interface PublicMenuProduct {
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  /** Price in euros (price_cents / 100) — convenience for display */
  price: number;
  photo_url?: string | null;
  category?: string;
}

interface PublicMenuData {
  storeName: string;
  categories: string[];
  products: PublicMenuProduct[];
  isLoading: boolean;
}

const PublicMenuContext = createContext<PublicMenuData | undefined>(undefined);

export const PublicMenuProvider: React.FC<{
  children: ReactNode;
  slug?: string;
}> = ({ children, slug }) => {
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
          description: p.description ?? null,
          price_cents: p.price_cents,
          price: p.price_cents / 100,
          photo_url: resolveProductImageUrl(p),
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
    return () => {
      mounted = false;
    };
  }, [slug]);

  const categories: string[] = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (typeof p.category === "string") cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Resolve store name from slug or fallback
  const storeName = slug
    ? slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "ChefIApp Bistro";

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
    throw new Error("usePublicMenu must be used within a PublicMenuProvider");
  }
  return context;
};
