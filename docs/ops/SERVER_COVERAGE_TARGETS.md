# Server coverage targets — Enterprise 4 ondas

Cobertura do diretório `server/` (integration-gateway, imageProcessor, minioStorage) como KPI. Foco em **branches** (decisões, erros, guard clauses).

**Infra + DB (merchant-portal):** target 60% branches em `merchant-portal/src/infra/`, `core/infra/`, `core/db/`. Ver [INFRA_DB_COVERAGE_TARGETS.md](./INFRA_DB_COVERAGE_TARGETS.md).

## Métricas

- **Branches** — métrica principal (target por etapa).
- **Lines** — referência.
- **Functions** e **statements** — reportados pelo Jest; opcionalmente incluídos no gate.

## Targets por etapa

| Etapa   | Semana | Branches (target) | Notas |
|---------|--------|-------------------|--------|
| Onda 0  | —      | (sem falhar build) | Só instrumentação; thresholds opcionais ou baixos |
| Onda 1  | 1      | 20%               | Unit baratos (helpers, parse, validate, imageProcessor, minioStorage) |
| Onda 2  | 2      | 40%               | Contract tests (HTTP com mocks) |
| Onda 3  | 3      | 60%               | Mais rotas + integração leve |
| Onda 4  | 4      | 70%               | Rate limit 429, PIX/SumUp checkout, WhatsApp incoming; gate 70% (atingido 72%+) |
| Onda 5  | 5      | 80%               | Gate 80% branches; validação PIX/SumUp 400/500, WhatsApp 401, insertDeliveryLog !ok, SumUp non-JSON error |
| Onda 6  | 6      | 87%               | Gate 87% branches; mais ramos em handleApiV1, SumUp/PIX catch, WhatsApp, emitEventInternal |

## Como verificar

1. Gerar cobertura (inclui testes do server):
   ```bash
   npm run test:coverage -- --testPathPattern=server
   ```
   Ou cobertura global (recomendado para CI):
   ```bash
   npm run test:coverage
   ```

2. Verificar gate apenas para ficheiros em `server/`:
   ```bash
   npx ts-node scripts/check-server-coverage.ts
   ```
   O script lê `coverage/coverage-final.json`, filtra entradas sob `server/`, calcula % branches (e opcionalmente lines) e sai com código de erro se estiver abaixo do target configurado.

## Target atual

O target é configurável via variável de ambiente `SERVER_COVERAGE_BRANCHES_TARGET` (número inteiro, percentagem). Valor por defeito: `84` (gate passa com baseline actual; meta Onda 6 é 87%). Para exigir 87%: `SERVER_COVERAGE_BRANCHES_TARGET=87`. Para outro valor, por exemplo 80:
```bash
SERVER_COVERAGE_BRANCHES_TARGET=80 npx ts-node scripts/check-server-coverage.ts
```

## CI

Passo recomendado para validar apenas o server (sem falhar thresholds globais):
```bash
npm run test:server-coverage
npm run check:server-coverage
```
Ou cobertura global e depois gate:
```bash
npm run test:coverage
npm run check:server-coverage
```
O script usa o target da variável de ambiente ou o valor por defeito (84).

## Estado das ondas (implementado)

- **Onda 0:** Script `scripts/check-server-coverage.ts`, doc de targets, `coverageReporters` em jest.config.js, script `check:server-coverage` no package.json.
- **Onda 1:** Testes unitários para helpers (branches adicionais), `server/imageProcessor`, `server/minioStorage`; gate 20% branches.
- **Onda 2:** Contract tests HTTP (GET /, /health, OPTIONS, favicon, POST /internal/events, /internal/product-images, /api/v1/webhook/sumup, /internal/billing/create-checkout-session com 401/400/403/200).
- **Onda 3:** Poison events (billing invalid JSON → 400); chaos (POST /internal/events com fetch Core a falhar → 500); auditoria de risco por endpoint (docs/audit/ENDPOINT_RISK_AUDIT.md); contract tests billing no_such_price, 500 Stripe, 200 Stripe (mock), PIX/SumUp 401/503, fallback 401/401 invalid key, handleApiV1 404 e POST orders 201/400/500, PATCH orders 200/404/500/400, POST orders/:id/payment 200/400, POST tasks 201/400/500 (incl. table missing 404→201); SumUp webhook logic testável (server/sumupWebhookVerify.ts); Stripe webhook verify (server/stripeWebhookVerify.ts). **Meta 60% atingida:** cobertura server/ ≥60% branches; `SERVER_COVERAGE_BRANCHES_TARGET=60` é o default em `scripts/check-server-coverage.ts` e em CI. **Observabilidade:** checklist mínimo em [OBSERVABILITY_CHECKLIST_60.md](OBSERVABILITY_CHECKLIST_60.md); meta “60% + observabilidade” = (a) server branches ≥60%, (b) gate CI verde, (c) checklist verificado.
- **Onda 4:** Rate limit 429 (POST /api/v1/* 101 requests), extractBase64Payload (data URL), POST /api/v1/integrations/whatsapp/incoming (200/400), PIX/SumUp checkout com token e SumUp API mockada (201/200). **Meta 70% atingida:** cobertura server/ ≥70% branches.
- **Onda 5:** **Meta 80%:** cobertura server/ ≥80% branches. Testes: PIX/SumUp 400/500, deliverOne 429 retry e catch e 4xx no retry, config events.length === 0, insertDeliveryLog !ok, request handler catch, Authorization Bearer, SumUp date/transactions/validUntil/reference, stripeWebhookVerify Buffer e catch non-Error, GET 404 fallback, BILLING_ALLOWED_ORIGINS, POST orders invalid JSON, handleProductImageUpload CORE_SERVICE_KEY (PATCH gm_products), processProductImage reject non-Error. **80,1%** (322/402).
- **Onda 6:** **Meta 87%** (fase finalizada com gate a 84%). Cobertura server/ baseline **84,5%** (337/399); gate por defeito 84% para passar em CI. Testes: GET/POST payment/sumup e sumup/checkout 401/503, POST sumup invalid JSON e catch non-Error, SumUp 500 empty/JSON (try/catch), emitEventInternal com webhook events.includes, handleApiV1 WhatsApp header array, Buffer.from catch 198, server.listen excluído (istanbul ignore). Para subir a 87%: `SERVER_COVERAGE_BRANCHES_TARGET=87` e cobrir ramos restantes (610, 649, 984).
