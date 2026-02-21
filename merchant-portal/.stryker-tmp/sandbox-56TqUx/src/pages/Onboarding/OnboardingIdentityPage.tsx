/**
 * Onboarding 5min — Tela 1: Identidade (nome, tipo, país+moeda).
 * Reutiliza BootstrapPage; após sucesso avança para /onboarding/location.
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */
// @ts-nocheck


import { BootstrapPage } from "../BootstrapPage";

export function OnboardingIdentityPage() {
  return (
    <div data-onboarding-step="1">
      <BootstrapPage successNextPath="/onboarding/location" />
    </div>
  );
}
