/**
 * RestaurantContext - Context Switching para Multi-Tenant
 * 
 * Gerencia o restaurante ativo do usuário, permitindo seleção entre múltiplos restaurantes
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { useAuth } from './AuthContext';
import { logError, logEvent, addBreadcrumb } from '@/services/logging';

// ============================================================================
// TYPES
// ============================================================================

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'manager' | 'waiter' | 'kitchen' | 'cashier';
}

export interface RestaurantContextType {
  activeRestaurant: Restaurant | null;
  availableRestaurants: Restaurant[];
  loading: boolean;
  setActiveRestaurant: (restaurant: Restaurant) => Promise<void>;
  refreshRestaurants: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

const ACTIVE_RESTAURANT_KEY = '@chefiapp:active_restaurant_id';

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [activeRestaurant, setActiveRestaurantState] = useState<Restaurant | null>(null);
  const [availableRestaurants, setAvailableRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar restaurantes disponíveis do usuário
  const loadRestaurants = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      addBreadcrumb('Loading restaurants', 'restaurant_context', { userId: session.user.id });

      // Buscar restaurantes do usuário via gm_restaurant_members
      const { data: memberships, error } = await supabase
        .from('gm_restaurant_members')
        .select(`
          restaurant_id,
          role,
          gm_restaurants (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', session.user.id);

      if (error) {
        logError(error, {
          action: 'loadRestaurants',
          userId: session.user.id,
        });
        throw error;
      }

      // Transformar dados
      const restaurants: Restaurant[] = (memberships || [])
        .filter(m => m.gm_restaurants)
        .map(m => ({
          id: m.restaurant_id,
          name: (m.gm_restaurants as any).name,
          slug: (m.gm_restaurants as any).slug || '',
          role: (m.role as any) || 'waiter',
        }));

      setAvailableRestaurants(restaurants);

      // Se não há restaurante ativo, usar o primeiro disponível
      if (restaurants.length > 0 && !activeRestaurant) {
        const savedRestaurantId = await AsyncStorage.getItem(ACTIVE_RESTAURANT_KEY);
        const savedRestaurant = restaurants.find(r => r.id === savedRestaurantId);
        
        if (savedRestaurant) {
          setActiveRestaurantState(savedRestaurant);
        } else {
          // Usar primeiro restaurante disponível
          setActiveRestaurantState(restaurants[0]);
          await AsyncStorage.setItem(ACTIVE_RESTAURANT_KEY, restaurants[0].id);
        }
      }

      logEvent('restaurants_loaded', {
        count: restaurants.length,
        userId: session.user.id,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, {
        action: 'loadRestaurants',
        userId: session.user.id,
      });
    } finally {
      setLoading(false);
    }
  };

  // Definir restaurante ativo
  const setActiveRestaurant = async (restaurant: Restaurant) => {
    try {
      addBreadcrumb('Setting active restaurant', 'restaurant_context', {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      });

      setActiveRestaurantState(restaurant);
      await AsyncStorage.setItem(ACTIVE_RESTAURANT_KEY, restaurant.id);

      logEvent('restaurant_switched', {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        role: restaurant.role,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, {
        action: 'setActiveRestaurant',
        restaurantId: restaurant.id,
      });
    }
  };

  // Carregar restaurante salvo ao iniciar
  useEffect(() => {
    if (session?.user?.id) {
      loadRestaurants();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Refresh restaurantes
  const refreshRestaurants = async () => {
    setLoading(true);
    await loadRestaurants();
  };

  return (
    <RestaurantContext.Provider
      value={{
        activeRestaurant,
        availableRestaurants,
        loading,
        setActiveRestaurant,
        refreshRestaurants,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
