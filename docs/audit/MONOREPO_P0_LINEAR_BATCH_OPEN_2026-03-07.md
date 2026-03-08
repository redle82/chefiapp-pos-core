# Monorepo P0 - Lote de Abertura no Linear (MRP-001..003)

Data: 2026-03-07
Objetivo: abrir hoje os 3 tickets P0 com padrao unico.
Referencias:

- `docs/audit/MONOREPO_LINEAR_ISSUE_PR_TEMPLATES_MRP_2026-03-07.md`
- `docs/audit/MONOREPO_MRP_PR_EXECUTION_PLAYBOOK_2026-03-07.md`
- `docs/audit/MONOREPO_P0_EXECUTION_PLAN_7_DAYS_2026-03-07.md`
- `docs/audit/MONOREPO_P0_CHECKPOINT_TEMPLATE_2026-03-07.md`

## Metadados sugeridos (aplicar nos 3)

- Labels: `monorepo`, `governance`, `phase4`, `p0`
- Prioridade: `P0`
- Assignee: `@goldmonkey777`

## Ticket 1 - MRP-001

Titulo:

```text
[integration] MRP-001 - Definir autoridade unica de gateway runtime
```

Descricao:

```md
Contexto:
Existe sobreposicao entre `server` e `integration-gateway` em rotas/comandos de integracao.
Isso aumenta risco de divergencia operacional e regressao em webhooks/checkout.

Objetivo:
Definir e aplicar uma unica autoridade runtime para integracoes, com janela de compatibilidade curta se necessario.

Escopo:

- Mapear endpoints e handlers duplicados.
- Definir destino canonico (`server` ou `integration-gateway`).
- Migrar fluxos criticos e documentar compat mode temporario.

DoD:

- [ ] Uma autoridade runtime ativa para integracoes.
- [ ] Compatibilidade antiga (se houver) com prazo de remocao.
- [ ] Sem regressao em `/health`, webhooks e launch-ack.

Evidencia obrigatoria:

- Tabela antes/depois de endpoints por autoridade.
- Logs/resultado de smokes dos fluxos criticos.

Referencias:

- `docs/audit/MONOREPO_MRP_PR_EXECUTION_PLAYBOOK_2026-03-07.md`
- `docs/audit/MONOREPO_P0_EXECUTION_PLAN_7_DAYS_2026-03-07.md`
```

## Ticket 2 - MRP-002

Titulo:

```text
[desktop-app] MRP-002 - Endurecer contrato shell e isolamento de superficie
```

Descricao:

```md
Contexto:
`desktop-app` deve operar como shell fino para TPV/KDS, sem render de superficies admin em runtime operacional.

Objetivo:
Reforcar isolamento de superficie no shell e validar launch flow sem regressao.

Escopo:

- Hardening de guardas de navegacao.
- Validar deep link `chefiapp://` e launch ACK.
- Consolidar checklist de smoke TPV/KDS.

DoD:

- [ ] Admin nao renderiza em janelas operacionais.
- [ ] Smokes TPV/KDS aprovados.
- [ ] Deep link e launch ACK sem regressao.

Evidencia obrigatoria:

- Checklist de smoke preenchido.
- Logs de bloqueio/admin guard.

Referencias:

- `docs/audit/MONOREPO_MRP_PR_EXECUTION_PLAYBOOK_2026-03-07.md`
```

## Ticket 3 - MRP-003

Titulo:

```text
[governance] MRP-003 - Formalizar ownership dos modulos Fase 4
```

Descricao:

```md
Contexto:
Ownership formal precisa estar versionado para reduzir ambiguidade de decisao e review.

Objetivo:
Garantir os 9 modulos da Fase 4 mapeados em `CODEOWNERS` e alinhados com matriz de governanca.

Escopo:

- Atualizar `CODEOWNERS`.
- Sincronizar owner na matriz de governanca.
- Validar diff final.

DoD:

- [ ] 9 modulos da Fase 4 com owner explicito no `CODEOWNERS`.
- [ ] Matriz de governanca alinhada com ownership formal.

Evidencia obrigatoria:

- Trecho de diff do `CODEOWNERS`.

Referencias:

- `docs/audit/MONOREPO_PHASE4_GOVERNANCE_MATRIX_2026-03-07.md`
- `docs/audit/MONOREPO_MRP_PR_EXECUTION_PLAYBOOK_2026-03-07.md`
```

## Checklist de encerramento do passo 1

1. Criar os 3 tickets no Linear com os blocos acima.
1. Colar em cada ticket os links para os 3 docs de referencia.
1. Confirmar que todos ficaram com label `p0`.
