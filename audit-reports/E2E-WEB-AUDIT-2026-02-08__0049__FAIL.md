# E2E WEB AUDIT — 2026-02-08 0049

## Resultado
STATUS: FAIL

## Build

- Build: OK
- Lint: SKIP

## Invariáveis

- State: TPV readiness formula: OK
- State: Payments optional: OK
- Routes: Route present: /auth/phone
- Routes: Route present: /bootstrap
- Routes: Route present: /app/setup/menu
- Routes: Route present: /app/setup/pagamentos
- Routes: Route present: /app/setup/tpv

## Riscos Detectados

- [preview] merchant-portal/src/pages/SetupLayout.tsx: showIframe must be gated by 'steps.published && health === 'ok''
- [ux] Missing CTA-like element in: merchant-portal/src/pages/Onboarding/OnboardingIdentityPage.tsx, merchant-portal/src/pages/Onboarding/OnboardingProductsPage.tsx

## Veredicto
BLOQUEADO
