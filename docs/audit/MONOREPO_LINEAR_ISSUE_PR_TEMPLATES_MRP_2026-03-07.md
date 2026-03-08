# Monorepo MRP - Templates de Issue (Linear) e PR

Data: 2026-03-07
Objetivo: abrir e executar `MRP-001..MRP-010` com zero friccao operacional.
Base:

- `docs/audit/MONOREPO_MODULE_BACKLOG_LINEAR_READY_2026-03-07.md`
- `docs/audit/MONOREPO_MRP_PR_EXECUTION_PLAYBOOK_2026-03-07.md`
- `docs/audit/MONOREPO_P0_EXECUTION_PLAN_7_DAYS_2026-03-07.md`

## Como usar

1. Criar a issue no Linear com o bloco do item (`MRP-xxx`) abaixo.
1. Abrir PR usando o bloco de PR do mesmo item.
1. Anexar evidencia objetiva antes de pedir review.

## Lote inicial hoje (P0)

1. Abrir `MRP-001`, `MRP-002` e `MRP-003` no Linear.
1. Linkar cada issue para este arquivo e para o playbook.
1. No primeiro PR, usar o template pre-preenchido do item.

## Template global de labels e metadados (sugestao)

- Labels: `monorepo`, `governance`, `phase4`
- Prioridade: conforme item (`P0`, `P1`, `P2`)
- Assignee: `@goldmonkey777`

## MRP-001

### Linear issue (copiar/colar)

```md
Titulo: [integration] MRP-001 - Definir autoridade unica de gateway runtime

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

### PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-001`: autoridade unica de gateway runtime.

## Escopo

- [ ] Mapeamento de endpoints/handlers duplicados
- [ ] Consolidacao para autoridade canonica
- [ ] Compat mode temporario documentado (se aplicavel)

## Arquivos Provaveis

- `server/integration-gateway.ts`
- `integration-gateway/src/index.ts`
- `docs/audit/MONOREPO_P0_EXECUTION_PLAN_7_DAYS_2026-03-07.md`

## Validacao Tecnica

- [ ] `GET /health` funcional no caminho alvo
- [ ] Webhooks criticos sem regressao
- [ ] Launch ACK operacional

## Evidencia Esperada

- [ ] Tabela antes/depois de endpoints por autoridade
- [ ] Logs de compat mode e smokes

## Criterio de Merge

- [ ] DoD do `MRP-001` atendido
- [ ] Riscos residuais registrados
- [ ] Data de remocao do compat mode definida (se existir)
```

## MRP-002

### Linear issue (copiar/colar)

```md
Titulo: [desktop-app] MRP-002 - Endurecer contrato shell e isolamento de superficie

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

### PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-002`: shell operacional isolado em `desktop-app`.

## Escopo

- [ ] Guardas de navegacao para bloquear superficies nao operacionais
- [ ] Validacao do fluxo de deep link/ACK
- [ ] Atualizacao de checklist de smoke

## Arquivos Provaveis

- `desktop-app/src/main.ts`
- `desktop-app/src/preload.ts`
- `docs/ops/INCIDENT_SURFACE_ISOLATION_KDS_ADMIN.md`

## Validacao Tecnica

- [ ] Smokes TPV/KDS sem render admin
- [ ] Deep link `chefiapp://` sem regressao
- [ ] Launch ACK funcional

## Evidencia Esperada

- [ ] Checklist de smoke preenchido
- [ ] Logs de bloqueio/admin guard

## Criterio de Merge

- [ ] DoD do `MRP-002` atendido
- [ ] Riscos residuais registrados
- [ ] Proximo passo mapeado
```

## MRP-003

### Linear issue (copiar/colar)

```md
Titulo: [governance] MRP-003 - Formalizar ownership dos modulos Fase 4

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

### PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-003`: ownership formal dos 9 modulos Fase 4.

## Escopo

- [ ] Atualizacao do `CODEOWNERS`
- [ ] Alinhamento da matriz de governanca

## Arquivos Provaveis

- `.github/CODEOWNERS`
- `docs/audit/MONOREPO_PHASE4_GOVERNANCE_MATRIX_2026-03-07.md`

## Validacao Tecnica

- [ ] `git diff .github/CODEOWNERS` confirma os 9 modulos

## Evidencia Esperada

- [ ] Trecho de diff do `CODEOWNERS`

## Criterio de Merge

- [ ] DoD do `MRP-003` atendido
- [ ] Riscos residuais registrados
```

## MRP-004

### Linear issue (copiar/colar)

```md
Titulo: [merchant-portal] MRP-004 - Reduzir acoplamento interno por dominio

Contexto:
`merchant-portal` concentra multiplos dominios e fronteiras internas com acoplamento cruzado.

Objetivo:
Reduzir acoplamentos criticos entre admin, operacao e billing sem split prematuro.

Escopo:

- Organizar fronteiras em `src/core` e `src/features`.
- Reduzir imports cruzados criticos.
- Documentar contratos de dominio atualizados.

DoD:

- [ ] Dependencias cruzadas criticas reduzidas e documentadas.
- [ ] Build/type-check/lint do modulo sem regressao.

Evidencia obrigatoria:

- Mapa antes/depois de dependencias cruzadas.
```

### PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-004`: reduzir acoplamento interno no `merchant-portal` por dominio.

## Escopo

- [ ] Ajustes de fronteira em `src/core` e `src/features`
- [ ] Reducao de imports cruzados criticos
- [ ] Atualizacao de contratos em `docs/architecture/**`

## Arquivos Provaveis

- `merchant-portal/src/core/**`
- `merchant-portal/src/features/**`
- `docs/architecture/**`

## Validacao Tecnica

- [ ] Build/type-check/lint do `merchant-portal`
- [ ] Testes de regressao dos fluxos afetados

## Evidencia Esperada

- [ ] Mapa antes/depois de dependencias cruzadas

## Criterio de Merge

- [ ] DoD do `MRP-004` atendido
```

## MRP-005

### Linear issue (copiar/colar)

```md
Titulo: [mobile-app] MRP-005 - Definir fronteira oficial AppStaff mobile vs web

Contexto:
Existe ambiguidade historica entre superficie mobile e AppStaff web.

Objetivo:
Consolidar fronteira oficial e contrato de superficie/runtime entre `mobile-app` e AppStaff web.

Escopo:

- Alinhar docs canonicos de AppStaff.
- Sincronizar expectativa de runtime e fluxos oficiais.

DoD:

- [ ] Decisao oficial publicada.
- [ ] Rotas/fluxos alinhados ao contrato.

Evidencia obrigatoria:

- Links cruzados atualizados entre docs oficiais.
```

### PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-005`: fronteira oficial AppStaff mobile vs web.

## Escopo

- [ ] Consolidar contrato oficial de superficie
- [ ] Alinhar runtime esperado
- [ ] Atualizar referencias cruzadas

## Arquivos Provaveis

- `mobile-app/README.md`
- `docs/APPSTAFF_PRODUCT_OVERVIEW.md`
- `docs/APPSTAFF_MOBILE_TECH_SHEET.md`

## Validacao Tecnica

- [ ] Contratos de superficie consistentes entre docs e runtime

## Evidencia Esperada

- [ ] Decisao oficial publicada e links atualizados

## Criterio de Merge

- [ ] DoD do `MRP-005` atendido
```

## MRP-006

### Linear issue (copiar/colar)

```md
Titulo: [core-engine] MRP-006 - Endurecer fonte unica de regras e contratos

Contexto:
Existem espelhos/stubs de contratos fora de `core-engine` que aumentam risco de divergencia.

Objetivo:
Reforcar `core-engine` como fonte unica de regras e contratos ativos.

Escopo:

- Mapear duplicacoes ativas de contratos.
- Remover/deprecar espelhos fora do dominio canonico.

DoD:

- [ ] Sem duplicacao ativa de contrato fora de `core-engine`.
- [ ] Testes relevantes de engine/pulse verdes.

Evidencia obrigatoria:

- Lista de espelhos removidos/deprecados.
```

### PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-006`: `core-engine` como fonte unica de regras/contratos.

## Escopo

- [ ] Mapeamento de duplicacoes
- [ ] Remocao/deprecacao de espelhos
- [ ] Ajustes de importadores

## Arquivos Provaveis

- `core-engine/**`
- `merchant-portal/src/core/**`
- `tests/unit/pulse/**`

## Validacao Tecnica

- [ ] Testes de engine/pulse relevantes verdes
- [ ] Sem duplicacao ativa de contrato fora do core-engine

## Evidencia Esperada

- [ ] Lista de espelhos removidos/deprecados

## Criterio de Merge

- [ ] DoD do `MRP-006` atendido
```

## MRP-007

### Linear issue (copiar/colar)

```md
Titulo: [fiscal] MRP-007 - Consolidar roadmap fiscal e reduzir espalhamento

Contexto:
Dominio fiscal apresenta espalhamento documental/estrutural que dificulta manutencao.

Objetivo:
Consolidar trilha fiscal ativa em um roadmap unico com referencias archive isoladas.

Escopo:

- Organizar adapters/validators ativos.
- Consolidar documentacao fiscal vigente.

DoD:

- [ ] Roadmap fiscal unico.
- [ ] Referencias archive isoladas.

Evidencia obrigatoria:

- Inventario de docs ativas vs archive.
```

### PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-007`: consolidacao do roadmap fiscal ativo.

## Escopo

- [ ] Organizar adapters/validators
- [ ] Consolidar docs fiscais ativas
- [ ] Isolar referencias de archive

## Arquivos Provaveis

- `fiscal-modules/**`
- `merchant-portal/src/core/fiscal/**`
- `docs/**`

## Validacao Tecnica

- [ ] Testes fiscais principais executados

## Evidencia Esperada

- [ ] Inventario de docs ativas vs archive

## Criterio de Merge

- [ ] DoD do `MRP-007` atendido
```

## MRP-008

### Linear issue (copiar/colar)

```md
Titulo: [billing-core] MRP-008 - Consolidar destino definitivo de tipos/estado

Contexto:
Ha ambiguidade de fonte para tipos de billing (`PlanTier`, `SubscriptionStatus`).

Objetivo:
Definir fonte unica de tipos/estado de billing e migrar consumidores.

Escopo:

- Decidir fonte canonica de tipos.
- Atualizar importadores consumidores.

DoD:

- [ ] Fonte unica definida e aplicada.
- [ ] Sem ambiguidade em `PlanTier/SubscriptionStatus`.

Evidencia obrigatoria:

- Mapa de importadores antes/depois.
```

### PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-008`: consolidacao de tipos/estado de billing.

## Escopo

- [ ] Definir fonte canonica de tipos
- [ ] Migrar consumidores
- [ ] Atualizar documentacao de billing

## Arquivos Provaveis

- `billing-core/types.ts`
- `merchant-portal/src/**`
- `docs/architecture/BILLING_FLOW.md`

## Validacao Tecnica

- [ ] Type-check dos consumidores sem regressao

## Evidencia Esperada

- [ ] Mapa de importadores com fonte final

## Criterio de Merge

- [ ] DoD do `MRP-008` atendido
```

## MRP-009

### Linear issue (copiar/colar)

```md
Titulo: [design-system] MRP-009 - Eliminar adaptadores redundantes de tokens

Contexto:
Adaptadores redundantes de tokens aumentam variacao e custo de manutencao visual.

Objetivo:
Padronizar consumo de tokens via `core-design-system`.

Escopo:

- Remover/reduzir adaptadores redundantes.
- Garantir consumo padrao nos consumidores.

DoD:

- [ ] Consumo via pacote padrao.
- [ ] Duplicacoes removidas sem regressao visual critica.

Evidencia obrigatoria:

- Lista de adapters removidos/simplificados.
```

### PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-009`: eliminacao de adaptadores redundantes de tokens.

## Escopo

- [ ] Limpeza de adapters redundantes
- [ ] Padronizacao de consumo de tokens

## Arquivos Provaveis

- `core-design-system/**`
- `merchant-portal/src/ui/design-system/tokens/**`

## Validacao Tecnica

- [ ] Build do portal sem regressao visual critica

## Evidencia Esperada

- [ ] Lista de adapters removidos/simplificados

## Criterio de Merge

- [ ] DoD do `MRP-009` atendido
```

## MRP-010

### Linear issue (copiar/colar)

```md
Titulo: [merchant-portal] MRP-010 - Limpar abstracoes duplicadas e debt local

Contexto:
Wrappers/tokens/utils redundantes no `merchant-portal` geram debt estrutural.

Objetivo:
Simplificar estrutura com remocao de duplicacoes de baixo risco.

Escopo:

- Limpeza de abstrações duplicadas.
- Preservar comportamento de produto.

DoD:

- [ ] Estrutura simplificada sem regressao funcional.
- [ ] Bundle/qualidade tecnica sem degradacao.

Evidencia obrigatoria:

- Diff de limpeza + prova de nao-regressao.
```

### PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-010`: limpeza de abstrações duplicadas e debt local.

## Escopo

- [ ] Remocao de wrappers/tokens/utils redundantes
- [ ] Preservacao de comportamento funcional

## Arquivos Provaveis

- `merchant-portal/src/**`

## Validacao Tecnica

- [ ] Lint/type-check/testes do modulo

## Evidencia Esperada

- [ ] Diff de limpeza + prova de nao-regressao

## Criterio de Merge

- [ ] DoD do `MRP-010` atendido
```

## Checkpoint P0 (evidencia objetiva)

No fechamento do primeiro checkpoint P0, anexar:

1. Links das issues `MRP-001`, `MRP-002`, `MRP-003`.
1. Link do primeiro PR com template aplicado.
1. Evidencias objetivas (smokes, diffs, logs) alinhadas ao playbook.
