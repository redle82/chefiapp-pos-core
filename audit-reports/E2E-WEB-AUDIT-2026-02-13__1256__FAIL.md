# E2E WEB AUDIT — 2026-02-13 1256

## Resultado
STATUS: FAIL

## Build

- Build: OK
- Lint: SKIP

## Invariáveis

- Preview: Health gating: OK
- Preview: URL gating: OK
- Preview: Iframe gating: OK
- Preview: Ghost always available pre-publish: OK
- State: TPV readiness formula: OK
- State: Payments optional: OK
- UX: Pre-publish copy avoids premature promises: OK
- UX: CTA presence heuristic: OK

## Riscos Detectados

- [routes] merchant-portal/src/App.tsx: missing route path '/auth/phone'

## Veredicto
BLOQUEADO
