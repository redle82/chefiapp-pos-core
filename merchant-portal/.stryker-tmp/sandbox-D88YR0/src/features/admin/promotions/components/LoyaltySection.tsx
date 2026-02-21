import { useCallback, useEffect, useState } from "react";
import { getLoyaltyConfig, updateLoyaltyConfig } from "../services/promotionsService";
import type { LoyaltyConfig } from "../types";
import { LoyaltyPointsPerEuroCard } from "./LoyaltyPointsPerEuroCard";
import { LoyaltyPointsPerOrderCard } from "./LoyaltyPointsPerOrderCard";

interface LoyaltySectionProps {
  locationId: string;
}

export function LoyaltySection({ locationId }: LoyaltySectionProps) {
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await getLoyaltyConfig(locationId);
      setConfig(cfg);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSavePointsPerEuro = useCallback(
    async (points: number) => {
      const next = await updateLoyaltyConfig(locationId, {
        pointsPerEuro: points,
      });
      setConfig(next);
    },
    [locationId]
  );

  const handleSavePointsPerOrder = useCallback(
    async (points: number) => {
      const next = await updateLoyaltyConfig(locationId, {
        pointsPerOrder: points,
      });
      setConfig(next);
    },
    [locationId]
  );

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          Fidelidade
        </h2>
        <p className="mt-1 text-xs text-gray-600">
          Configure quantos pontos os clientes ganham por euro gasto e por cada
          conta fechada. Mantém o modelo simples e fácil de explicar.
        </p>
      </header>
      <div className="flex flex-col gap-4 md:flex-row">
        <LoyaltyPointsPerEuroCard
          value={config?.pointsPerEuro ?? 0}
          loading={loading}
          onSave={handleSavePointsPerEuro}
        />
        <LoyaltyPointsPerOrderCard
          value={config?.pointsPerOrder ?? 0}
          loading={loading}
          onSave={handleSavePointsPerOrder}
        />
      </div>
    </section>
  );
}

