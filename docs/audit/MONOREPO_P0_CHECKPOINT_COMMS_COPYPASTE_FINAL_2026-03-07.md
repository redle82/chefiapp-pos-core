# P0-01 Communications - Copy/Paste Final

Data: 2026-03-07
Objetivo: versao final pronta para publicacao em Slack/Linear/Email com preenchimento minimo.

## Preencha apenas estes 3 campos

- `<CHECKPOINT_DATETIME>`
- `<P0_BOARD_LINK>`
- `<P0_EVIDENCE_PACK_LINK>`

## 1) Slack / Teams (copiar e colar)

```md
P0-01 update (`<CHECKPOINT_DATETIME>`)
Status: GO WITH CONSTRAINTS

Semaforo:

- MRP-001: YELLOW (ADR aprovado, PR opening draft pronto)
- MRP-002: YELLOW
- MRP-003: GREEN

Gate P0: 1/4 criterios fechados.

Next 72h:

1. Abrir PR MRP-001 + migracao inicial por endpoint
2. Fechar smoke/evidencias MRP-002
3. Consolidar links no checkpoint final

Board: <P0_BOARD_LINK>
Evidence pack: <P0_EVIDENCE_PACK_LINK>

ADR aprovado (MRP-001): `docs/audit/MONOREPO_MRP001_RUNTIME_AUTHORITY_ADR_DRAFT_2026-03-07.md`
PR opening draft (MRP-001): `docs/audit/MONOREPO_MRP001_PR_OPENING_DRAFT_2026-03-07.md`
```

## 2) Comentario Linear (copiar e colar)

```md
Checkpoint P0-01 (`<CHECKPOINT_DATETIME>`)

Decision: GO WITH CONSTRAINTS

Current state:

- MRP-003 GREEN (ownership formal concluido)
- MRP-001 YELLOW (ADR aprovado, abertura de PR imediata)
- MRP-002 YELLOW (isolamento de shell em validacao)

Gate snapshot:

- [x] Ownership formal aplicado e versionado
- [ ] Autoridade unica de integracao definida e implementada
- [ ] Contrato do desktop shell validado com checklist operacional
- [ ] Sem regressao em launch ACK, health e webhooks criticos

References:

- Board: <P0_BOARD_LINK>
- Evidence: <P0_EVIDENCE_PACK_LINK>
- ADR aprovado (MRP-001): `docs/audit/MONOREPO_MRP001_RUNTIME_AUTHORITY_ADR_DRAFT_2026-03-07.md`
- PR opening draft (MRP-001): `docs/audit/MONOREPO_MRP001_PR_OPENING_DRAFT_2026-03-07.md`
- Executive summary: `docs/audit/MONOREPO_P0_CHECKPOINT_EXEC_SUMMARY_P0-01_PUBLISH_READY_2026-03-07.md`
```

## 3) Email stakeholders (copiar e colar)

```md
Assunto: P0-01 Checkpoint - GO WITH CONSTRAINTS

Checkpoint `<CHECKPOINT_DATETIME>` concluido com status GO WITH CONSTRAINTS.

Resumo:

- MRP-003 concluido (GREEN)
- MRP-001 e MRP-002 em progresso (YELLOW)
- Gate P0 parcial: 1/4 criterios verdes

Prioridades proximas 72h:

1. Abrir PR MRP-001 e executar migracao inicial por endpoint
2. Fechar evidencias de isolamento desktop shell
3. Consolidar checkpoint com links finais de issue/PR/evidencia

Board: <P0_BOARD_LINK>
Evidence pack: <P0_EVIDENCE_PACK_LINK>

ADR aprovado (MRP-001): `docs/audit/MONOREPO_MRP001_RUNTIME_AUTHORITY_ADR_DRAFT_2026-03-07.md`
PR opening draft (MRP-001): `docs/audit/MONOREPO_MRP001_PR_OPENING_DRAFT_2026-03-07.md`
```

## Ordem de uso (1 minuto)

1. Preencher os 3 placeholders uma vez.
2. Publicar Slack/Teams.
3. Publicar comentario no Linear.
4. Enviar email para stakeholders.
