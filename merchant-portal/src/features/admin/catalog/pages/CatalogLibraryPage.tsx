import { useEffect, useMemo, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { listLibraryItems } from "../../../../core/catalog/catalogApi";
import type { LibraryItem } from "../../../../core/catalog/catalogTypes";
import { CatalogLayout } from "../components/CatalogLayout";

export function CatalogLibraryPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? null;

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listLibraryItems(restaurantId);
        if (!active) return;
        setItems(data);
      } catch (e) {
        if (!active) return;
        const message =
          e instanceof Error ? e.message : "Erro ao carregar biblioteca";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [restaurantId]);

  const totalLabel = useMemo(
    () => `${items.length} itens na biblioteca`,
    [items.length],
  );

  return (
    <CatalogLayout
      title="Biblioteca"
      description="Itens base reutilizáveis entre marcas e canais, com consistência de nomes e traduções."
    >
      <div className="space-y-3">
        <div className="text-sm text-gray-700">{totalLabel}</div>

        {loading ? (
          <p className="text-sm text-gray-500">Carregando biblioteca...</p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {!loading && !error ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <div className="text-sm font-semibold text-gray-900">
                  {item.canonicalName}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                  {item.type}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </CatalogLayout>
  );
}
