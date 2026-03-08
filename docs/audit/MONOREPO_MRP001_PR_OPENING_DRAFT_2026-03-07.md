# MRP-001 PR Opening Draft - 2026-03-07

Objetivo: abrir o PR de `MRP-001` sem retrabalho, com titulo/body/comandos prontos.

## Branch e titulo

- Branch: `feat/fase2-electron-desktop-shell`
- PR title:
  - `[integration-gateway] MRP-001 Runtime authority cutover prep (contract hardening + evidence)`

## PR body (copiar/colar)

```md
## Objetivo

Avancar `MRP-001` com preparacao de cutover de autoridade runtime sem regressao de contrato.

## Decisao de arquitetura (ADR)

- Autoridade primaria de integracao: `integration-gateway`
- Excecao P0: `desktop/launch-acks` permanece em `server`
- Compat mode: ativo com deadline de remocao em `2026-03-14 18:00 CET`
- ADR: `docs/audit/MONOREPO_MRP001_RUNTIME_AUTHORITY_ADR_DRAFT_2026-03-07.md`

## Escopo entregue neste PR

- Compat auth no gateway standalone (`Authorization: Bearer` + `x-internal-token`)
- Alinhamento de contrato PIX entre rota canonica e legado (standalone)
- Hardening de logs sensiveis em ambos runtimes (`integration-gateway` e `server`)
- Compatibilidade de rota PIX canonica+legado no runtime `server`
- Evidencias de smoke de contrato anexadas

## Evidencias

- Boundary inventory: `docs/audit/MONOREPO_MRP001_GATEWAY_BOUNDARY_INVENTORY_2026-03-07.md`
- ADR aprovado: `docs/audit/MONOREPO_MRP001_RUNTIME_AUTHORITY_ADR_DRAFT_2026-03-07.md`
- PIX contract smoke: `docs/audit/MONOREPO_MRP001_PIX_CONTRACT_SMOKE_2026-03-07.md`
- PR ready packet: `docs/audit/MONOREPO_MRP001_PR_READY_PACKET_2026-03-07.md`

## Arquivos principais alterados

- `integration-gateway/src/services/auth.ts`
- `integration-gateway/src/services/auth.test.ts`
- `integration-gateway/src/index.ts`
- `server/integration-gateway.ts`

## Validacao executada

- `pnpm test -- auth.test.ts` (integration-gateway): `5 passed`
- Smoke runtime (gateway online):
  - `GET /health` -> `200`
  - `POST /api/v1/payment/pix/checkout` sem token -> `401`
  - `POST /api/v1/payment/pix/br/checkout` sem token -> `401`
  - Ambas com `x-internal-token` -> passam auth e seguem para downstream

## Risco residual

- Risco de regressao durante cutover por endpoint; mitigar com smoke por fase.

## Rollback

- Reverter PR restaura comportamento anterior de roteamento/compatibilidade.

## Links de gestao

- Linear issue: `<LINEAR_MRP001_URL>`
- Tracking: `docs/audit/MONOREPO_P0_LIVE_TRACKER_2026-03-07.md`
```

## Comando sugerido (GitHub CLI)

```bash
gh pr create \
  --base main \
  --head feat/fase2-electron-desktop-shell \
  --title "[integration-gateway] MRP-001 Runtime authority cutover prep (contract hardening + evidence)" \
  --body-file docs/audit/MONOREPO_MRP001_PR_OPENING_DRAFT_2026-03-07.md
```

Nota: se usar `--body-file`, copie apenas o bloco do body sem este prefacio.
