/**
 * Hook para Menu com Cache
 * 
 * Cacheia produtos e categorias para melhorar performance
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { getCache, setCache, invalidateCache, CacheKeys, withCache } from '@/services/cache';
import { useRestaurant } from '@/context/RestaurantContext';

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  price_cents: number;
  category_id: string;
  available: boolean;
}

export function useCachedMenu() {
  const { activeRestaurant } = useRestaurant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeRestaurant?.id) {
      setLoading(false);
      return;
    }

    loadMenu();
  }, [activeRestaurant?.id]);

  const loadMenu = async () => {
    if (!activeRestaurant?.id) return;

    setLoading(true);

    try {
      // Carregar categorias com cache
      const categoriesData = await withCache<Category[]>(
        CacheKeys.categories(activeRestaurant.id),
        async () => {
          const { data, error } = await supabase
            .from('gm_menu_categories')
            .select('*')
            .eq('restaurant_id', activeRestaurant.id)
            .order('sort_order', { ascending: true });

          if (error) throw error;
          return data || [];
        },
        5 * 60 * 1000 // 5 minutos
      );

      setCategories(categoriesData);

      // Carregar produtos com cache
      const productsData = await withCache<Product[]>(
        CacheKeys.products(activeRestaurant.id),
        async () => {
          const { data, error } = await supabase
            .from('gm_products')
            .select('*')
            .eq('restaurant_id', activeRestaurant.id)
            .eq('available', true)
            .order('name', { ascending: true });

          if (error) throw error;
          return data || [];
        },
        5 * 60 * 1000 // 5 minutos
      );

      setProducts(productsData);
    } catch (error) {
      console.error('[useCachedMenu] Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Invalidar cache quando necessário
  const refreshMenu = async () => {
    if (!activeRestaurant?.id) return;

    await invalidateCache(CacheKeys.categories(activeRestaurant.id));
    await invalidateCache(CacheKeys.products(activeRestaurant.id));
    await loadMenu();
  };

  return {
    categories,
    products,
    loading,
    refreshMenu,
  };
}
