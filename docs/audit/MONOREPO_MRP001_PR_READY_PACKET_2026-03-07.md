# MRP-001 PR Ready Packet - 2026-03-07

Objetivo: consolidar o estado atual de execucao para abrir o PR de migracao de ownership com evidencia objetiva.

## Scope consolidado (feito)

- Boundary mapping + ADR aprovado.
- Compat auth no gateway standalone (`Authorization` Bearer + `x-internal-token`).
- Alinhamento de contrato PIX no gateway standalone:
  - Canonica: `/api/v1/payment/pix/checkout`
  - Legado: `/api/v1/payment/pix/br/checkout`
- Smoke runtime executado (`health`, `401` sem token, compat com `x-internal-token`).
- Hardening de logs sensiveis aplicado nos dois runtimes:
  - `integration-gateway/src/index.ts`
  - `server/integration-gateway.ts`
- Compatibilidade de rota PIX replicada no runtime principal (`server`):
  - handler agora aceita caminho canonico e legado.
- Cutover controlado adicionado no runtime legado (`server`):
  - flag `INTEGRATION_LEGACY_COMPAT_MODE` (default `1`) para desligar rotas sobrepostas em fase de migracao.
  - quando `INTEGRATION_LEGACY_COMPAT_MODE=0`, rotas sobrepostas retornam `410 compatibility_disabled` com metadados de autoridade/deadline.

## Arquivos chave para anexar no PR

- `docs/audit/MONOREPO_MRP001_GATEWAY_BOUNDARY_INVENTORY_2026-03-07.md`
- `docs/audit/MONOREPO_MRP001_RUNTIME_AUTHORITY_ADR_DRAFT_2026-03-07.md`
- `docs/audit/MONOREPO_MRP001_PIX_CONTRACT_SMOKE_2026-03-07.md`
- `integration-gateway/src/services/auth.ts`
- `integration-gateway/src/services/auth.test.ts`
- `integration-gateway/src/index.ts`
- `server/integration-gateway.ts`
- `scripts/flows/mrp001-cutover-smoke.sh`

## PR title recomendado

`[integration-gateway] MRP-001 Runtime authority cutover prep (contract hardening + evidence)`

## PR body recomendado

```md
## Objetivo

Avancar `MRP-001` com preparacao de cutover de autoridade runtime sem regressao de contrato.

## Entregas

- Compat auth no gateway standalone (Bearer + x-internal-token)
- Contrato PIX alinhado entre rota canonica e legado
- Smoke runtime documentado com evidencia objetiva
- Hardening de logs para evitar exposicao de credenciais em erros de checkout
- Compatibilidade de rota PIX replicada no runtime principal (`server`)
- Kill-switch de compatibilidade para cutover controlado (`INTEGRATION_LEGACY_COMPAT_MODE`)

## Evidencias

- Boundary inventory: `docs/audit/MONOREPO_MRP001_GATEWAY_BOUNDARY_INVENTORY_2026-03-07.md`
- ADR aprovado: `docs/audit/MONOREPO_MRP001_RUNTIME_AUTHORITY_ADR_DRAFT_2026-03-07.md`
- PIX smoke: `docs/audit/MONOREPO_MRP001_PIX_CONTRACT_SMOKE_2026-03-07.md`

## Risco residual

- Risco de regressao durante cutover por endpoint; exigir smoke por fase.

## Proximo passo

- Executar migracao de ownership por endpoint em PR subsequente (mantendo launch ACK isolado).
```

## Checklist de merge

- [x] ADR aprovado e linkado
- [x] Issue Linear de `MRP-001` vinculada (template pronto em `MONOREPO_LINEAR_ISSUE_PR_TEMPLATES_MRP_2026-03-07.md`)
- [x] Evidencias anexadas no pacote de PR (`inventory`, `ADR`, `smoke`)
- [x] Rollback simples descrito (manter `server` em compat mode ate D7)

## Validacao incremental (esta rodada)

- `curl http://localhost:4320/health` com gateway ativo retornou:
  - `status=ok`
  - `runtime_authority=integration-gateway`
  - `compat_mode=true`
- Runtime legado recebeu kill-switch para rotas sobrepostas via `INTEGRATION_LEGACY_COMPAT_MODE`.
- Smoke de cutover em runtime isolado (`:4321`) com `INTEGRATION_LEGACY_COMPAT_MODE=0`:
  - `POST /api/v1/webhook/sumup` -> `410 compatibility_disabled`
  - `POST /api/v1/payment/pix/checkout` -> `410 compatibility_disabled`
  - `desktop/launch-acks` preservado (`GET found=false`, `POST recorded=true`)
- Gate repetivel versionado:
  - `npm run smoke:mrp001-cutover` -> `EXIT:0`
  - report gerado em `docs/audit/runs/mrp001-cutover-smoke-2026-03-07-225923.md`
