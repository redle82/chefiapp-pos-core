import { AutoPromotionsSection } from "../components/AutoPromotionsSection";
import { DiscountsSection } from "../components/DiscountsSection";
import { LoyaltySection } from "../components/LoyaltySection";

const DEFAULT_LOCATION_ID = "sofia-gastrobar-ibiza";

export function PromotionsPage() {
  const locationId = DEFAULT_LOCATION_ID;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">
          Promociones y recompensas
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure descontos, pontos de fidelidade e ofertas automáticas para
          os seus clientes. Mantém simples para a equipa, poderoso para o
          negócio.
        </p>
      </header>

      <LoyaltySection locationId={locationId} />

      <DiscountsSection locationId={locationId} />

      <AutoPromotionsSection locationId={locationId} />
    </div>
  );
}

