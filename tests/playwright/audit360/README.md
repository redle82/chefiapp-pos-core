# Audit 360 — Playwright Harness

Objetivo: executar o protocolo MASS AUDIT 360º (UI click audit, pagamentos, surface map) sem quebrar a Truth Suite.

Serviços (subir manualmente):
- Portal: http://127.0.0.1:5173
- Core API: http://127.0.0.1:4320
- Public Page: http://127.0.0.1:5174 (se aplicável)
- Stripe: mock/live conforme ambiente

Config:
- `AUDIT_BASE_URL` (default `http://127.0.0.1:5173`)
- `AUDIT_ROUTES` CSV opcional (ex: `/,/app/tpv,/app/onboarding,/public`)
- `AUDIT_PAYMENT_ROUTE` (default `/app/payments`)
- `AUDIT_PAYMENT=1` para habilitar pagamentos auditados
- `AUDIT_STRIPE_PK` para chave Stripe (mock/live)
- `AUDIT_STRIPE_MODE=mock|live` (só efeito informativo)
- `HEADED=1` para ver o navegador

Rodar:
```bash
# Surface map (gera SYSTEM_SURFACE_MAP.json)
node scripts/audit-surface-map.js

# UI click audit (botão por botão nas rotas)
npx playwright test tests/playwright/audit360/ui-click.audit.spec.ts --config=playwright.config.audit.ts

# Pagamentos (só se AUDIT_PAYMENT=1)
AUDIT_PAYMENT=1 AUDIT_STRIPE_PK=pk_test_xxx npx playwright test tests/playwright/audit360/payments.audit.spec.ts --config=playwright.config.audit.ts
```

Saídas:
- `test-results/audit360-results.json` (reporter json)
- Anexos Playwright (traces em falha)
- `SYSTEM_SURFACE_MAP.json` (surface discovery)

Notas:
- Não há webServer automático neste config — suba os serviços antes.
- Os testes registram falhas como dados (não blocam merge) para servir como auditoria exploratória.
