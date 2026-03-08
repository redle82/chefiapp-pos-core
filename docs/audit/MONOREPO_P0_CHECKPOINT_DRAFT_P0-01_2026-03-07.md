# Monorepo P0 - Checkpoint Draft (P0-01)

Data: 2026-03-07
Status: Draft pre-preenchido para uso imediato.
Base: `docs/audit/MONOREPO_P0_CHECKPOINT_TEMPLATE_2026-03-07.md`
Operations hub (entrada unica): `docs/audit/MONOREPO_P0_OPERATIONS_HUB_2026-03-07.md`
Live tracker (status diario): `docs/audit/MONOREPO_P0_LIVE_TRACKER_2026-03-07.md`
Resumo executivo 1-pagina: `docs/audit/MONOREPO_P0_CHECKPOINT_EXEC_SUMMARY_P0-01_2026-03-07.md`
Resumo executivo publish-ready: `docs/audit/MONOREPO_P0_CHECKPOINT_EXEC_SUMMARY_P0-01_PUBLISH_READY_2026-03-07.md`
Pacote de publicacao (Slack/Linear/Email): `docs/audit/MONOREPO_P0_CHECKPOINT_PUBLISH_PACKAGE_P0-01_2026-03-07.md`
Runbook de publicacao (5-min + log): `docs/audit/MONOREPO_P0_CHECKPOINT_PUBLICATION_RUNBOOK_2026-03-07.md`

## Header do checkpoint

Checkpoint: `P0-01`
Data/Hora: `2026-03-07 <HH:mm TZ>`
Responsavel: `@goldmonkey777`

Resumo semaforo:

- `MRP-001`: `YELLOW` (execucao iniciada)
- `MRP-002`: `YELLOW` (execucao iniciada)
- `MRP-003`: `GREEN` (ownership/documentacao formalizada)

Decisao do checkpoint:

- [ ] Go
- [x] Go with constraints
- [ ] No-go

## MRP-001 - Gateway runtime authority

Status: `YELLOW`
Issue Linear: `<LINEAR_MRP001_URL>`
PR: `<GITHUB_PR_MRP001_URL>`

Resultado principal:

- Autoridade final definida: `integration-gateway` (ADR aprovado)
- Compat mode: `sim (incremental, sem quebra)`

Evidencias objetivas:

- Tabela antes/depois de endpoints: `docs/audit/MONOREPO_MRP001_GATEWAY_BOUNDARY_INVENTORY_2026-03-07.md`
- ADR draft de autoridade runtime: `docs/audit/MONOREPO_MRP001_RUNTIME_AUTHORITY_ADR_DRAFT_2026-03-07.md`
- Implementacao de auth compat (Bearer + x-internal-token): `integration-gateway/src/services/auth.ts`
- Testes de auth compat (TDD): `integration-gateway/src/services/auth.test.ts` (5 casos verdes)
- Alias de contrato PIX (`/api/v1/payment/pix/checkout`) e hardening da rota legado (`/api/v1/payment/pix/br/checkout`): `integration-gateway/src/index.ts`
- Evidencia de smoke de contrato PIX (runtime): `docs/audit/MONOREPO_MRP001_PIX_CONTRACT_SMOKE_2026-03-07.md`
- Hardening de logs para nao expor credenciais em erro de checkout PIX: `integration-gateway/src/index.ts`
- Hardening equivalente no runtime principal (`server`) para Stripe/SumUp checkout errors: `server/integration-gateway.ts`
- Compatibilidade de rota PIX (canonica + legado) aplicada tambem no runtime principal (`server`): `server/integration-gateway.ts`
- Pacote pronto para abertura de PR `MRP-001`: `docs/audit/MONOREPO_MRP001_PR_READY_PACKET_2026-03-07.md`
- Logs de smoke webhook/health: `<EVID_SMOKE_LOGS_URL>`
- Launch ACK: `<EVID_ACK_URL>`
- Nota operacional: primeira tentativa de smoke em `2026-03-07 20:52 CET` bloqueou por gateway offline; validacao foi concluida em `20:55 CET` (ver evidencia de smoke).

Risco residual:

- Risco de regressao em rotas legadas durante transicao de autoridade.

Proximo passo:

- Abrir PR de migracao de ownership por endpoint com base no ADR aprovado e no smoke de contrato PIX validado.

## MRP-002 - Desktop shell isolation

Status: `YELLOW`
Issue Linear: `<LINEAR_MRP002_URL>`
PR: `<GITHUB_PR_MRP002_URL>`

Resultado principal:

- Admin bloqueado em runtime operacional: `<sim|nao>`
- Deep link + ACK: `<ok|pendente>`

Evidencias objetivas:

- Checklist de smoke TPV/KDS: `<EVID_SMOKE_CHECKLIST_URL>`
- Logs de bloqueio/admin guard: `<EVID_ADMIN_GUARD_LOGS_URL>`
- Validacao de launch flow: `<EVID_LAUNCH_FLOW_URL>`

Risco residual:

- Risco de bypass de rota operacional em cenarios de navegacao edge.

Proximo passo:

- Rodar smoke completo TPV/KDS e anexar logs finais no PR.

## MRP-003 - Ownership formal

Status: `GREEN`
Issue Linear: `<LINEAR_MRP003_URL>`
PR: `<GITHUB_PR_MRP003_URL>`

Resultado principal:

- 9 modulos mapeados no CODEOWNERS: `sim`
- Matriz de governanca sincronizada: `sim`

Evidencias objetivas:

- Diff de CODEOWNERS: `<EVID_CODEOWNERS_DIFF_URL>`
- Atualizacao da matriz: `<EVID_MATRIX_UPDATE_URL>`

Risco residual:

- Baixo; manter sincronizacao quando houver alteracao de ownership.

Proximo passo:

- Confirmar review dos stakeholders e congelar ownership P0.

## Gate P0 consolidado

Checklist Gate P0:

- [x] Ownership formal aplicado e versionado
- [ ] Autoridade unica de integracao definida e implementada
- [ ] Contrato do desktop shell validado com checklist operacional
- [ ] Sem regressao em launch ACK, health e webhooks criticos

Conclusao:

- `aprovado_com_restricoes`
- Justificativa: ownership concluido; fronteira de integracao e hardening de shell ainda em andamento.

## Snapshot de links obrigatorios

Issues:

- MRP-001: `<LINEAR_MRP001_URL>`
- MRP-002: `<LINEAR_MRP002_URL>`
- MRP-003: `<LINEAR_MRP003_URL>`

PRs:

- MRP-001: `<GITHUB_PR_MRP001_URL>`
- MRP-002: `<GITHUB_PR_MRP002_URL>`
- MRP-003: `<GITHUB_PR_MRP003_URL>`

Evidencias:

- Webhook/Health/ACK: `<EVID_WEBHOOK_HEALTH_ACK_URL>`
- Smoke desktop shell: `<EVID_SMOKE_DESKTOP_URL>`
- CODEOWNERS diff: `<EVID_CODEOWNERS_DIFF_URL>`
