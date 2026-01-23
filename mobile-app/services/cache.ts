/**
 * Cache Service - Caching estratégico para dados frequentemente acessados
 * 
 * Cache local usando AsyncStorage para:
 * - Menu (produtos, categorias)
 * - Configurações de restaurante
 * - Dados de usuário (roles, permissões)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_PREFIX = '@chefiapp:cache:';
const DEFAULT_TTL = {
  menu: 5 * 60 * 1000, // 5 minutos
  restaurant: 30 * 60 * 1000, // 30 minutos
  user: 15 * 60 * 1000, // 15 minutos
};

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================

/**
 * Obter dados do cache
 * @param key - Chave do cache
 * @returns Dados ou null se expirado/não existir
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Verificar se expirou
    if (now - entry.timestamp > entry.ttl) {
      // Cache expirado, remover
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('[Cache] Error getting cache:', error);
    return null;
  }
}

/**
 * Salvar dados no cache
 * @param key - Chave do cache
 * @param data - Dados para cachear
 * @param ttl - Time to live em milissegundos (opcional)
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || DEFAULT_TTL.menu,
    };

    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify(entry)
    );
  } catch (error) {
    console.error('[Cache] Error setting cache:', error);
  }
}

/**
 * Invalidar cache (remover)
 * @param key - Chave do cache
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.error('[Cache] Error invalidating cache:', error);
  }
}

/**
 * Invalidar todos os caches de um tipo
 * @param pattern - Padrão para invalidar (ex: 'menu:*')
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `${CACHE_PREFIX}${pattern}`;
    
    const keysToRemove = keys.filter(key => key.startsWith(prefix));
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error('[Cache] Error invalidating cache pattern:', error);
  }
}

/**
 * Limpar todo o cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('[Cache] Error clearing all cache:', error);
  }
}

// ============================================================================
// CACHE KEYS HELPERS
// ============================================================================

export const CacheKeys = {
  menu: (restaurantId: string) => `menu:${restaurantId}`,
  categories: (restaurantId: string) => `categories:${restaurantId}`,
  products: (restaurantId: string) => `products:${restaurantId}`,
  restaurant: (restaurantId: string) => `restaurant:${restaurantId}`,
  userRoles: (userId: string) => `user:roles:${userId}`,
  userRestaurants: (userId: string) => `user:restaurants:${userId}`,
};

// ============================================================================
// CACHE WRAPPER (Higher-Order Function)
// ============================================================================

/**
 * Wrapper para funções async com cache
 * @param key - Chave do cache
 * @param fn - Função async para executar se cache miss
 * @param ttl - Time to live (opcional)
 * @returns Dados (do cache ou da função)
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Tentar obter do cache
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss, executar função
  const data = await fn();
  
  // Salvar no cache
  await setCache(key, data, ttl);

  return data;
}
