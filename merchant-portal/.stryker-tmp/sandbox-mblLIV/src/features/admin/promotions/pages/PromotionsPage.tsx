import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { AutoPromotionsSection } from "../components/AutoPromotionsSection";
import { DiscountsSection } from "../components/DiscountsSection";
import { LoyaltySection } from "../components/LoyaltySection";
import { getDiscounts } from "../services/promotionsService";
import type { Discount } from "../types";

const DEFAULT_LOCATION_ID = "sofia-gastrobar-ibiza";

export function PromotionsPage() {
  const locationId = DEFAULT_LOCATION_ID;
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);

  const loadDiscounts = useCallback(async () => {
    setLoadingDiscounts(true);
    try {
      const list = await getDiscounts(locationId);
      setDiscounts(list);
    } finally {
      setLoadingDiscounts(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Promociones y recompensas"
        subtitle="Configure descontos, pontos de fidelidade e ofertas automáticas para os seus clientes. Mantém simples para a equipa, poderoso para o negócio."
      />

      <LoyaltySection locationId={locationId} />

      <DiscountsSection
        locationId={locationId}
        discounts={discounts}
        loadingDiscounts={loadingDiscounts}
        onDiscountsUpdated={loadDiscounts}
      />

      <AutoPromotionsSection
        locationId={locationId}
        discounts={discounts}
        loadingDiscounts={loadingDiscounts}
      />
    </div>
  );
}

