# Monorepo P0 Live Tracker

Data base: 2026-03-07
Objetivo: acompanhar execucao P0 em tempo real (status, bloqueios, evidencia, proximo passo).

Referencias:

- `docs/audit/MONOREPO_P0_OPERATIONS_HUB_2026-03-07.md`
- `docs/audit/MONOREPO_P0_EXECUTION_PLAN_7_DAYS_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CHECKPOINT_DRAFT_P0-01_2026-03-07.md`

## Status rapido (semaforo)

- `MRP-001`: `YELLOW`
- `MRP-002`: `YELLOW`
- `MRP-003`: `GREEN`
- Gate P0: `1/4`

## Quadro de execucao

| Item      | Owner            | Status   | Ultima atualizacao   | Proximo passo                                                       | Bloqueio                |
| --------- | ---------------- | -------- | -------------------- | ------------------------------------------------------------------- | ----------------------- |
| `MRP-001` | `@goldmonkey777` | `YELLOW` | `2026-03-07 21:15`   | Publicar checkpoint P0-01 via copy/paste final e abrir PR `MRP-001` | `nenhum (ADR aprovado)` |
| `MRP-002` | `@goldmonkey777` | `YELLOW` | `<YYYY-MM-DD HH:mm>` | Fechar smoke TPV/KDS + evidencias                                   | `<none_or_descricao>`   |
| `MRP-003` | `@goldmonkey777` | `GREEN`  | `<YYYY-MM-DD HH:mm>` | Confirmar review final de ownership                                 | `<none_or_descricao>`   |

## Evidencias por item (links)

- `MRP-001`
  - Issue: `<LINEAR_MRP001_URL>`
  - PR: `<GITHUB_PR_MRP001_URL>`
  - Evidencia: `docs/audit/MONOREPO_MRP001_GATEWAY_BOUNDARY_INVENTORY_2026-03-07.md`
  - Evidencia: `docs/audit/MONOREPO_MRP001_RUNTIME_AUTHORITY_ADR_DRAFT_2026-03-07.md`
  - Evidencia: `integration-gateway/src/services/auth.ts`
  - Evidencia: `integration-gateway/src/services/auth.test.ts`
  - Evidencia: `integration-gateway/src/index.ts`
  - Evidencia: `server/integration-gateway.ts`
  - Evidencia: `docs/audit/MONOREPO_MRP001_PIX_CONTRACT_SMOKE_2026-03-07.md`
  - Evidencia: `docs/audit/MONOREPO_MRP001_PR_READY_PACKET_2026-03-07.md`
  - Evidencia: `docs/audit/MONOREPO_MRP001_PR_OPENING_DRAFT_2026-03-07.md`
  - Evidencia: `docs/audit/MONOREPO_P0_CHECKPOINT_COMMS_COPYPASTE_FINAL_2026-03-07.md`
- `MRP-002`
  - Issue: `<LINEAR_MRP002_URL>`
  - PR: `<GITHUB_PR_MRP002_URL>`
  - Evidencia: `<EVID_MRP002_URL>`
- `MRP-003`
  - Issue: `<LINEAR_MRP003_URL>`
  - PR: `<GITHUB_PR_MRP003_URL>`
  - Evidencia: `<EVID_MRP003_URL>`

## Update log (append-only)

| Timestamp            | Item      | Update                                                                                                        | Impacto                                                                     |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `2026-03-07 21:15`   | `MRP-001` | Pacote final copy/paste de comunicacao preparado (Slack/Linear/Email)                                         | Publicacao do checkpoint pode ocorrer em minutos com baixo atrito           |
| `2026-03-07 21:12`   | `MRP-001` | Executive summary publish-ready e publish package sincronizados com ADR aprovado + PR opening draft           | Checkpoint pronto para publicacao sem retrabalho de contexto                |
| `2026-03-07 21:10`   | `MRP-001` | Draft final de abertura de PR preparado (titulo/body/comando `gh`)                                            | Reduz atrito operacional para publicar PR imediatamente                     |
| `2026-03-07 21:08`   | `MRP-001` | ADR de autoridade runtime aprovado com deadline de remocao do compat mode (`2026-03-14 18:00 CET`)            | Remove bloqueio decisorio e destrava abertura imediata do PR `MRP-001`      |
| `2026-03-07 21:06`   | `MRP-001` | Compatibilidade de rota PIX (canonica + legado) replicada no `server` + packet de PR pronto                   | Reduz risco de regressao cross-runtime e acelera abertura do PR             |
| `2026-03-07 21:00`   | `MRP-001` | Hardening de logs sensiveis replicado no runtime `server/integration-gateway.ts`                              | Mitiga vazamento de credenciais no runtime principal durante migracao       |
| `2026-03-07 20:56`   | `MRP-001` | Hardening de logs no checkout PIX: erro agora sanitizado sem objeto bruto                                     | Reduz risco de vazamento de credenciais em logs operacionais                |
| `2026-03-07 20:55`   | `MRP-001` | Smoke de contrato PIX executado com gateway online (`health=200`, `401` sem token, compat `x-internal-token`) | Evidencia runtime confirma alinhamento de auth entre rota canonica e legado |
| `2026-03-07 20:52`   | `MRP-001` | Tentativa de smoke bloqueada: gateway indisponivel em `localhost:4320`                                        | Validacao HTTP de contrato PIX pendente ate runtime online                  |
| `2026-03-07 20:51`   | `MRP-001` | Hardening de compatibilidade: rota legacy PIX alinhada ao mesmo auth/handler da rota canonica                 | Remove divergencia de seguranca entre caminhos legado e novo                |
| `2026-03-07 20:48`   | `MRP-001` | Compatibilidade de contrato iniciada no gateway standalone (auth + rota PIX alias)                            | Facilita migracao incremental sem quebra de clientes internos               |
| `2026-03-07 20:42`   | `MRP-001` | Inventario de fronteira + ADR draft criados                                                                   | Reduz ambiguidade de ownership e prepara decisao final                      |
| `<YYYY-MM-DD HH:mm>` | `MRP-001` | `<update>`                                                                                                    | `<impacto>`                                                                 |
| `<YYYY-MM-DD HH:mm>` | `MRP-002` | `<update>`                                                                                                    | `<impacto>`                                                                 |
| `<YYYY-MM-DD HH:mm>` | `MRP-003` | `<update>`                                                                                                    | `<impacto>`                                                                 |

## Cadencia recomendada

1. Atualizar este tracker no inicio do dia.
1. Atualizar apos cada PR relevante.
1. Atualizar antes de publicar checkpoint.

## Regra de consistencia

Sempre atualizar aqui antes do summary publish-ready.
