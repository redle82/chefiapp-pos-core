# Monorepo P0 - Checkpoint Publication Runbook

Data: 2026-03-07
Objetivo: executar a publicacao do checkpoint P0 em 5 minutos, com rastreabilidade.

Base:

- `docs/audit/MONOREPO_P0_CHECKPOINT_EXEC_SUMMARY_P0-01_PUBLISH_READY_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CHECKPOINT_PUBLISH_PACKAGE_P0-01_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CHECKPOINT_DRAFT_P0-01_2026-03-07.md`

## Sequencia 5-min (cronologica)

1. Preencher os 3 campos unicos no summary publish-ready.
1. Validar se os links do board e evidence pack abrem sem erro.
1. Copiar mensagem curta para Slack/Teams e publicar.
1. Copiar comentario para issue/epic do Linear e publicar.
1. Enviar email curto para stakeholders.
1. Atualizar o log de publicacao abaixo.

## Definition of Done da publicacao

- [ ] Summary publish-ready preenchido com 3 campos.
- [ ] Slack/Teams publicado.
- [ ] Comentario no Linear publicado.
- [ ] Email enviado.
- [ ] Log de publicacao preenchido.

## Log de publicacao (preencher)

| Canal               | Data/Hora               | Autor            | Link/Thread                    | Status              |
| ------------------- | ----------------------- | ---------------- | ------------------------------ | ------------------- |
| Slack/Teams         | `<YYYY-MM-DD HH:mm TZ>` | `@goldmonkey777` | `<SLACK_OR_TEAMS_LINK>`        | `<sent_or_pending>` |
| Linear (issue/epic) | `<YYYY-MM-DD HH:mm TZ>` | `@goldmonkey777` | `<LINEAR_COMMENT_LINK>`        | `<sent_or_pending>` |
| Email stakeholders  | `<YYYY-MM-DD HH:mm TZ>` | `@goldmonkey777` | `<EMAIL_THREAD_ID_OR_SUBJECT>` | `<sent_or_pending>` |

## Checklist de qualidade de mensagem

1. Semaforo P0 explicito (`MRP-001`, `MRP-002`, `MRP-003`).
1. Decisao explicita (`GO`, `GO WITH CONSTRAINTS` ou `NO-GO`).
1. Top 2 riscos declarados.
1. Proximas 72h declaradas.
1. Links de board e evidence pack incluidos.

## Politica de consistencia

- Se o status mudar no draft de checkpoint, atualizar primeiro o summary publish-ready e so depois publicar mensagens em canais.
- Se faltar evidencia objetiva, manter status com restricoes e nao declarar gate fechado.
