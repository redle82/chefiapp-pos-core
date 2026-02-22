# E2E WEB AUDIT — 2026-02-22 1412

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
- UX: Pre-publish copy avoids premature promises: OK
- UX: CTA presence heuristic: OK

## Riscos Detectados

- [preview] merchant-portal/src/pages/SetupLayout.tsx: URL must be shown only under 'steps.published && publicUrl'

## Veredicto
BLOQUEADO
