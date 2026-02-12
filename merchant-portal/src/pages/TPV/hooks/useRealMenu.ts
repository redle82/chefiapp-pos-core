import { useEffect, useState } from "react";
// LEGACY / LAB — blocked in Docker mode
import { GenesisKernel } from "../../../core/kernel/GenesisKernel";
import { getTabIsolated } from "../../../core/storage/TabIsolatedStorage";

// LEGACY: Supabase client removed — Docker Core only
const supabase = null as any;

export interface VerifiedProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  origin: "verified";
}

export function useRealMenu() {
  const [products, setProducts] = useState<VerifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchVerifiedMenu() {
      try {
        // 1. Get Identity from Authority (with Hardening Fallback)
        const blueprint = await GenesisKernel.getBlueprint();
        let tenantId = blueprint?.meta?.tenantId;

        // Fallback: Try TabIsolatedStorage direct access if Core memory is wiped
        if (!tenantId) {
          const stored =
            getTabIsolated("chefiapp_blueprint") ||
            getTabIsolated("chefiapp_system_blueprint_v2"); // Legacy/Core key
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              tenantId = parsed.meta?.tenantId;
            } catch {
              /* ignore */
            }
          }
        }
        // Fallback 2: Try simple ID
        if (!tenantId) {
          tenantId =
            getTabIsolated("chefiapp_active_tenant") ||
            getTabIsolated("chefiapp_restaurant_id") ||
            getTabIsolated("chefiapp_tenant_id") ||
            undefined;
        }

        // HARDENING: Graceful exit if no tenant (e.g. refresh, race condition)
        if (!tenantId) {
          // Do not throw, just return empty. The TPV will handle the empty state.
          console.warn(
            "[useRealMenu] No active tenant found in blueprint or storage.",
          );
          if (mounted) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }

        // 2. Fetch from Database
        const { data, error: dbError } = await supabase
          .from("gm_menu_items")
          .select("*, gm_menu_categories(name)")
          .eq("restaurant_id", tenantId);

        if (dbError) throw dbError;

        if (mounted) {
          // HARDENING: Defensive Mapping
          const safeData = Array.isArray(data) ? data : [];

          const mapped: VerifiedProduct[] = safeData
            .map((item: any) => {
              // Guard against malformed items
              if (!item) return null;

              return {
                id: item.id || `fallback-${Math.random()}`,
                name: item.name || "Produto Sem Nome",
                price: (item.price_cents || 0) / 100,
                category: item.gm_menu_categories?.name || "Geral",
                origin: "verified",
              };
            })
            .filter(Boolean) as VerifiedProduct[]; // Remove nulls

          setProducts(mapped);
        }
      } catch (err: any) {
        console.error("[useRealMenu] Failed to fetch verified menu:", err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchVerifiedMenu();

    return () => {
      mounted = false;
    };
  }, []);

  return { products, loading, error };
}
