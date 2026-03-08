import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  listCatalogVariants,
  saveAvailabilityRule,
  saveCatalogVariant,
  savePriceOverride,
} from "../../../../core/catalog/catalogApi";
import type { CatalogVariant } from "../../../../core/catalog/catalogTypes";
import { CatalogLayout } from "../components/CatalogLayout";

export function CatalogCatalogsPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? null;

  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      const data = await listCatalogVariants(restaurantId);
      if (!active) return;
      setVariants(data);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [restaurantId]);

  const createVariant = async () => {
    const created = await saveCatalogVariant(
      {
        baseCatalogId: "base-1",
        name: "Nova variante",
        brandId: null,
        channel: "LOCAL",
        inherited: true,
        overridesCount: 0,
      },
      restaurantId,
    );

    setVariants((prev) => [...prev, created]);
  };

  const createPriceOverride = async (variant: CatalogVariant) => {
    await savePriceOverride(
      {
        libraryItemId: "product:p-seed",
        catalogVariantId: variant.id,
        currency: "EUR",
        priceCents: 420,
        reason: "Ajuste por canal",
      },
      restaurantId,
    );

    setVariants((prev) =>
      prev.map((item) =>
        item.id === variant.id
          ? { ...item, overridesCount: item.overridesCount + 1 }
          : item,
      ),
    );
    setStatusMessage(`Override criado para ${variant.name}.`);
  };

  const createAvailabilityRule = async (variant: CatalogVariant) => {
    await saveAvailabilityRule(
      {
        libraryItemId: "product:p-seed",
        catalogVariantId: variant.id,
        schedule: "Mon-Sun 10:00-23:00",
        channelConstraints: [variant.channel],
        visibility: "visible",
      },
      restaurantId,
    );

    setVariants((prev) =>
      prev.map((item) =>
        item.id === variant.id
          ? { ...item, overridesCount: item.overridesCount + 1 }
          : item,
      ),
    );
    setStatusMessage(`Regra de disponibilidade criada para ${variant.name}.`);
  };

  return (
    <CatalogLayout
      title="Catálogos"
      description="Composição comercial por marca, canal e plataforma com base numa biblioteca única."
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            {variants.length} variantes configuradas
          </p>
          <button
            type="button"
            className="rounded bg-violet-600 px-3 py-1 text-sm font-semibold text-white"
            onClick={createVariant}
          >
            Criar variante
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Carregando variantes...</p>
        ) : null}

        {!loading ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {variants.map((variant) => (
              <li
                key={variant.id}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <div className="text-sm font-semibold text-gray-900">
                  {variant.name}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Canal {variant.channel} · Overrides {variant.overridesCount}
                </div>
                <button
                  type="button"
                  className="mt-2 rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700"
                  onClick={() => createPriceOverride(variant)}
                >
                  Override preco {variant.id}
                </button>
                <button
                  type="button"
                  className="ml-2 mt-2 rounded border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700"
                  onClick={() => createAvailabilityRule(variant)}
                >
                  Regra disponibilidade {variant.id}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {statusMessage ? (
          <p className="text-sm text-blue-700">{statusMessage}</p>
        ) : null}
      </div>
    </CatalogLayout>
  );
}
