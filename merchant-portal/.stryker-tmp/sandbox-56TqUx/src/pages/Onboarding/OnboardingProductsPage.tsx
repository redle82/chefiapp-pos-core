/**
 * Onboarding 5min — Tela 5: Produtos (1 produto rápido / importar / exemplo).
 * Reutiliza FirstProductPage; após sucesso ou skip avança para /onboarding/tpv-preview.
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */
// @ts-nocheck


import { FirstProductPage } from "./FirstProductPage";

export function OnboardingProductsPage() {
  return (
    <div data-onboarding-step="5">
      <FirstProductPage successNextPath="/onboarding/tpv-preview" />
    </div>
  );
}
