# Monorepo P0 Daily Operating Rhythm

Data base: 2026-03-07
Objetivo: padronizar rotina AM/PM para evitar drift entre tracker, checkpoint, summary e publicacao.

## Janela AM (10-15 min)

1. Atualizar `docs/audit/MONOREPO_P0_LIVE_TRACKER_2026-03-07.md`:

- semaforo
- proximo passo
- bloqueio
- update log

1. Validar alinhamento com issues/PRs reais (`MRP-001..003`).

1. Se houver mudanca relevante de status, refletir em:

- `docs/audit/MONOREPO_P0_CHECKPOINT_DRAFT_P0-01_2026-03-07.md`

## Janela PM (10-15 min)

1. Reconciliar evidencias no tracker (links de logs, smokes, diffs).
1. Atualizar summary publish-ready se houve mudanca de status:

- `docs/audit/MONOREPO_P0_CHECKPOINT_EXEC_SUMMARY_P0-01_PUBLISH_READY_2026-03-07.md`

1. Se houver comunicacao externa, executar runbook:

- `docs/audit/MONOREPO_P0_CHECKPOINT_PUBLICATION_RUNBOOK_2026-03-07.md`

## Ordem obrigatoria de atualizacao

1. Live tracker
1. Checkpoint draft
1. Executive summary publish-ready
1. Publish package/runbook/log

## Quality gate diario

- [ ] Nenhum item com status alterado sem evidencia linkada.
- [ ] Nenhuma publicacao com status desatualizado.
- [ ] Nenhum fechamento de gate sem checklist completo.

## Escalacao

Escalar no mesmo dia se:

1. `MRP-001` ou `MRP-002` ficar `RED`.
1. Houver bloqueio > 24h sem plano de mitigacao.
1. Gate P0 regredir (ex.: criterio previamente verde voltar a amarelo/vermelho).

## Artefatos de referencia rapida

- Hub: `docs/audit/MONOREPO_P0_OPERATIONS_HUB_2026-03-07.md`
- Tracker: `docs/audit/MONOREPO_P0_LIVE_TRACKER_2026-03-07.md`
- Checkpoint draft: `docs/audit/MONOREPO_P0_CHECKPOINT_DRAFT_P0-01_2026-03-07.md`
- Summary publish-ready: `docs/audit/MONOREPO_P0_CHECKPOINT_EXEC_SUMMARY_P0-01_PUBLISH_READY_2026-03-07.md`
- Runbook publicacao: `docs/audit/MONOREPO_P0_CHECKPOINT_PUBLICATION_RUNBOOK_2026-03-07.md`
