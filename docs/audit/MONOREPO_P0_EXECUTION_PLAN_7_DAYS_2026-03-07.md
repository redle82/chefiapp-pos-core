# Plano P0 — Execucao em 7 Dias

Data de inicio: 2026-03-07
Horizonte: 7 dias corridos
Escopo P0:

- Consolidar fronteira `server` vs `integration-gateway`.
- Formalizar ownership dos 9 modulos no `CODEOWNERS`.
- Reforcar contrato do `desktop-app` como shell (sem ambiguidade de superficie).

Playbook operacional de PR/checklist:

- `docs/audit/MONOREPO_P0_OPERATIONS_HUB_2026-03-07.md`
- `docs/audit/MONOREPO_P0_DAILY_OPERATING_RHYTHM_2026-03-07.md`
- `docs/audit/MONOREPO_MRP_PR_EXECUTION_PLAYBOOK_2026-03-07.md`
- `docs/audit/MONOREPO_LINEAR_ISSUE_PR_TEMPLATES_MRP_2026-03-07.md`
- `docs/audit/MONOREPO_P0_LINEAR_BATCH_OPEN_2026-03-07.md`
- `docs/audit/MONOREPO_MRP001_FIRST_PR_STARTER_2026-03-07.md`
- `docs/audit/MONOREPO_MRP001_GATEWAY_BOUNDARY_INVENTORY_2026-03-07.md`
- `docs/audit/MONOREPO_MRP001_RUNTIME_AUTHORITY_ADR_DRAFT_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CHECKPOINT_TEMPLATE_2026-03-07.md`
- `docs/audit/MONOREPO_P0_LIVE_TRACKER_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CHECKPOINT_DRAFT_P0-01_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CHECKPOINT_EXEC_SUMMARY_P0-01_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CHECKPOINT_EXEC_SUMMARY_P0-01_PUBLISH_READY_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CHECKPOINT_PUBLISH_PACKAGE_P0-01_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CHECKPOINT_PUBLICATION_RUNBOOK_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CLOSEOUT_REPORT_DRAFT_D7_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CLOSEOUT_REPORT_PUBLISH_READY_D7_2026-03-07.md`

## Objetivo de Saida (D+7)

- Uma autoridade unica para integracoes runtime (arquitetura e execucao).
- Ownership formal versionado para todos os modulos da Fase 4.
- Contrato shell do desktop testavel e documentado, com criterios claros de bloqueio/aceite de superficie.

## RACI Resumido

- Responsavel principal (R): `@goldmonkey777`
- Aprovador (A): `@goldmonkey777`
- Consultado (C): mantenedores de `merchant-portal`, `desktop-app`, `server`, `integration-gateway`
- Informado (I): equipa de produto e operacao

## Plano Diario

| Dia | Frente                           | Responsavel      | Resultado esperado                                                         | Criterio de aceite                                                                                                                                                                                        |
| --- | -------------------------------- | ---------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Ownership formal                 | `@goldmonkey777` | `CODEOWNERS` com os 9 modulos da matriz                                    | `git diff .github/CODEOWNERS` mostra entradas para `mobile-app`, `merchant-portal`, `desktop-app`, `server`, `integration-gateway`, `core-engine`, `core-design-system`, `fiscal-modules`, `billing-core` |
| D2  | Inventario de fronteira gateway  | `@goldmonkey777` | Mapa de rotas/comandos duplicados entre `server/` e `integration-gateway/` | Documento/issue com: endpoint, origem, consumidor, dependencia, decisao alvo (manter/migrar/remover)                                                                                                      |
| D3  | Decisao de autoridade unica      | `@goldmonkey777` | ADR curta: runtime authority de integracao                                 | ADR aprovada com estrategia escolhida: `server` como autoridade ou `integration-gateway` como autoridade (nao ambos)                                                                                      |
| D4  | Implementacao tecnica P0-A       | `@goldmonkey777` | Primeira migracao de fronteira (rotas/handlers)                            | Build/lint/test das areas tocadas passam; sem regressao em `/health`, webhooks e launch-ack                                                                                                               |
| D5  | Implementacao tecnica P0-B       | `@goldmonkey777` | Segunda migracao + compat layer temporaria                                 | Compat mode documentado, com prazo de remocao; logs deprecando caminho antigo                                                                                                                             |
| D6  | Desktop shell contract hardening | `@goldmonkey777` | Contrato de superficie operacional reforcado (admin fora do shell)         | Checklist de smoke para shell concluido e documentado; rotas admin bloqueadas no runtime operacional                                                                                                      |
| D7  | Fecho operacional                | `@goldmonkey777` | Relatorio final P0 + backlog P1/P2 refinado                                | Documento de encerramento com: deltas, riscos residuais, rollback path e proximos passos priorizados                                                                                                      |

## Entregaveis Minimos

- Codigo:
  - `.github/CODEOWNERS` atualizado.
  - Consolidacao parcial/total de `server` e `integration-gateway` conforme ADR.
  - Ajustes no `desktop-app` para reforco de contrato de shell.
- Documentacao:
  - ADR de autoridade de integracao.
  - Checklist de validacao do desktop shell.
  - Relatorio de encerramento P0.

## Riscos e Mitigacoes

1. Risco: quebra em fluxo de webhook/checkout durante consolidacao.

- Mitigacao: compat layer temporaria + smoke diario em endpoints criticos.

1. Risco: regressao de superficie no desktop shell.

- Mitigacao: smoke checklist dedicado para `TPV/KDS` e bloqueio de rotas admin.

1. Risco: consolidacao parcial virar estado permanente.

- Mitigacao: definir data de remocao da compat layer no D7.

## Gate de Conclusao P0

Todos os itens abaixo devem estar verdes:

1. Ownership formal aplicado e versionado.
1. Autoridade unica de integracao definida e implementada (com ou sem janela de transicao curta).
1. Contrato do desktop shell validado com checklist operacional.
1. Sem regressao nos fluxos de launch ACK, health e webhooks criticos.
