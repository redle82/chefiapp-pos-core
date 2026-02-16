import { useCallback, useEffect, useState } from "react";
import { getAutoPromotions, updateAutoPromotion } from "../services/promotionsService";
import type { AutoPromotion, Discount } from "../types";

interface AutoPromotionsSectionProps {
  locationId: string;
  discounts: Discount[];
  loadingDiscounts: boolean;
}

const CHANNEL_LABELS: Record<AutoPromotion["channel"], string> = {
  WEB: "Web",
  QR: "QR",
  DELIVERY: "Delivery",
};

export function AutoPromotionsSection({
  locationId,
  discounts,
  loadingDiscounts,
}: AutoPromotionsSectionProps) {
  const [autoPromotions, setAutoPromotions] = useState<AutoPromotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);

  const loadPromotions = useCallback(async () => {
    setLoadingPromotions(true);
    try {
      const aps = await getAutoPromotions(locationId);
      setAutoPromotions(aps);
    } finally {
      setLoadingPromotions(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handleChange = async (id: string, discountId: string) => {
    const ap = autoPromotions.find((item) => item.id === id);
    if (!ap) return;
    const next = await updateAutoPromotion(locationId, {
      ...ap,
      discountId,
    });
    setAutoPromotions((current) =>
      current.map((item) => (item.id === next.id ? next : item))
    );
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          Promociones automáticas
        </h2>
        <p className="mt-1 text-xs text-gray-600">
          Associe descontos a canais específicos (web, QR, delivery) para que o
          sistema aplique as ofertas automaticamente.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                >
                  Canal
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                >
                  Promoção
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loadingPromotions || loadingDiscounts ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={2}>
                    Carregando promoções automáticas...
                  </td>
                </tr>
              ) : (
                autoPromotions.map((ap) => (
                  <tr key={ap.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {CHANNEL_LABELS[ap.channel]}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <select
                        value={ap.discountId}
                        onChange={(e) => handleChange(ap.id, e.target.value)}
                        className="w-full max-w-xs rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      >
                        <option value="">Sem promoção automática</option>
                        {discounts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {discounts.length === 0 && !loadingDiscounts && (
        <p className="text-xs text-gray-500">
          Crie descontos na secção «Descuentos» acima para os associar a cada
          canal.
        </p>
      )}
    </section>
  );
}

