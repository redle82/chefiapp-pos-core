/**
 * useCatalogSync — React hook for offline-first catalog access.
 *
 * On mount: checks cache freshness. If stale or missing, fetches from Core.
 * On connectivity change (offline -> online): refreshes automatically.
 * When offline: serves from IndexedDB cache.
 *
 * Fetches from Core tables: gm_menu_categories, gm_menu_items, gm_modifier_groups.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Logger } from '../logger';
import { dockerCoreClient } from '../../infra/docker-core/connection';
import { ConnectivityService } from './ConnectivityService';
import {
  OfflineCatalogCache,
  type CachedCatalog,
  type CatalogSnapshot,
} from './OfflineCatalogCache';

// ─── Singleton cache instance ────────────────────────────────────────────────

const catalogCache = new OfflineCatalogCache();

// ─── Return type ─────────────────────────────────────────────────────────────

export interface CatalogSyncState {
  /** The cached catalog data, or null if not yet loaded. */
  catalog: CachedCatalog | null;
  /** True while fetching from Core or loading from cache. */
  loading: boolean;
  /** True if the cache is older than the freshness window. */
  isStale: boolean;
  /** Timestamp of the last successful sync, or null if never synced. */
  lastSyncAt: number | null;
  /** Force a re-fetch from Core, bypassing cache freshness. */
  refresh: () => Promise<void>;
}

// ─── Core fetcher ────────────────────────────────────────────────────────────

/**
 * Fetch catalog data from Core via PostgREST.
 * Queries gm_menu_categories, gm_menu_items, and gm_modifier_groups.
 */
async function fetchCatalogFromCore(restaurantId: string): Promise<CatalogSnapshot> {
  const client = dockerCoreClient;

  const [categoriesRes, productsRes, modifiersRes] = await Promise.all([
    client
      .from('gm_menu_categories')
      .select('id, name, sort_order')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true }),
    client
      .from('gm_menu_items')
      .select(
        'id, name, category_id, price_cents, description, image_url, available, station, modifier_group_ids, tax_rate, sku',
      )
      .eq('restaurant_id', restaurantId),
    client
      .from('gm_modifier_groups')
      .select('id, name, required, min_selections, max_selections, modifiers')
      .eq('restaurant_id', restaurantId),
  ]);

  if (categoriesRes.error) throw new Error(`Failed to fetch categories: ${categoriesRes.error.message}`);
  if (productsRes.error) throw new Error(`Failed to fetch products: ${productsRes.error.message}`);
  // Modifier groups are optional — log but don't throw
  if (modifiersRes.error) {
    Logger.warn('[useCatalogSync] Failed to fetch modifier groups', { error: modifiersRes.error });
  }

  return {
    categories: (categoriesRes.data ?? []) as CatalogSnapshot['categories'],
    products: (productsRes.data ?? []) as CatalogSnapshot['products'],
    modifierGroups: (modifiersRes.data ?? []) as CatalogSnapshot['modifierGroups'],
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCatalogSync(restaurantId: string): CatalogSyncState {
  const [catalog, setCatalog] = useState<CachedCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  // Prevent concurrent fetches
  const fetchingRef = useRef(false);
  // Track mounted state
  const mountedRef = useRef(true);

  /** Load catalog from cache, then optionally refresh from Core. */
  const loadCatalog = useCallback(
    async (forceRefresh = false) => {
      if (!restaurantId) return;
      if (fetchingRef.current && !forceRefresh) return;
      fetchingRef.current = true;

      try {
        setLoading(true);

        // 1. Load from cache first (instant)
        const cached = await catalogCache.getCatalog(restaurantId);
        if (cached && mountedRef.current) {
          setCatalog(cached);
          setLastSyncAt(cached.updatedAt);
        }

        // 2. Check freshness
        const fresh = await catalogCache.isFresh(restaurantId);
        if (mountedRef.current) setIsStale(!fresh);

        // 3. If stale or forced, and online — fetch from Core
        const isOnline = ConnectivityService.getConnectivity() === 'online';
        if ((forceRefresh || !fresh) && isOnline) {
          try {
            const snapshot = await fetchCatalogFromCore(restaurantId);
            await catalogCache.saveCatalog(restaurantId, snapshot);
            const updated = await catalogCache.getCatalog(restaurantId);
            if (updated && mountedRef.current) {
              setCatalog(updated);
              setLastSyncAt(updated.updatedAt);
              setIsStale(false);
            }
          } catch (fetchErr: any) {
            Logger.warn('[useCatalogSync] Failed to fetch from Core, using cache', { error: fetchErr?.message });
            // Cache is still valid — we just couldn't refresh
          }
        }
      } catch (err) {
        Logger.error('[useCatalogSync] Error loading catalog', err);
      } finally {
        if (mountedRef.current) setLoading(false);
        fetchingRef.current = false;
      }
    },
    [restaurantId],
  );

  /** Force refresh from Core, bypassing freshness check. */
  const refresh = useCallback(async () => {
    await loadCatalog(true);
  }, [loadCatalog]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadCatalog(false);
    return () => {
      mountedRef.current = false;
    };
  }, [loadCatalog]);

  // Auto-refresh when connectivity changes offline -> online
  useEffect(() => {
    let previousStatus = ConnectivityService.getConnectivity();

    const unsubscribe = ConnectivityService.subscribe((status) => {
      if (previousStatus !== 'online' && status === 'online') {
        Logger.info('[useCatalogSync] Connectivity restored, refreshing catalog');
        loadCatalog(true);
      }
      previousStatus = status;
    });

    return unsubscribe;
  }, [loadCatalog]);

  return { catalog, loading, isStale, lastSyncAt, refresh };
}
