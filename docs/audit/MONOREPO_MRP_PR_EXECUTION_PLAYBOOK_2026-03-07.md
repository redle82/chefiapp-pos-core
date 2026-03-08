# MRP PR Execution Playbook (MRP-001 ... MRP-010)

Data: 2026-03-07
Objetivo: padronizar execucao de cada item MRP com checklist de PR, validacao e evidencia.
Referencia base:

- `docs/audit/MONOREPO_MODULE_BACKLOG_LINEAR_READY_2026-03-07.md`
- `docs/audit/MONOREPO_P0_EXECUTION_PLAN_7_DAYS_2026-03-07.md`
- `docs/audit/MONOREPO_LINEAR_ISSUE_PR_TEMPLATES_MRP_2026-03-07.md`
- `docs/audit/MONOREPO_MRP001_FIRST_PR_STARTER_2026-03-07.md`

## Template Unico de PR (copiar/colar)

```md
## Objetivo

<resultado de negocio/arquitetura que este PR entrega>

## Escopo

- [ ] <mudanca 1>
- [ ] <mudanca 2>
- [ ] <mudanca 3>

## Arquivos Provaveis

- `<path-1>`
- `<path-2>`
- `<path-3>`

## Validacao Tecnica

- [ ] Build/lint/type-check das areas alteradas
- [ ] Testes relevantes executados
- [ ] Sem regressao nos fluxos citados no item

## Evidencia Esperada

- [ ] Diff/prints/logs que provam o objetivo
- [ ] Documento/ADR/checklist atualizado

## Criterio de Merge

- [ ] DoD do item MRP atendido
- [ ] Riscos residuais registrados
- [ ] Proximo passo mapeado (se houver)
```

## Checklist por Item

### MRP-001

- Objetivo:
  - Definir autoridade unica de gateway runtime entre `server` e `integration-gateway`.
- Arquivos provaveis:
  - `server/integration-gateway.ts`
  - `integration-gateway/src/index.ts`
  - `docs/audit/MONOREPO_P0_EXECUTION_PLAN_7_DAYS_2026-03-07.md`
- Validacao:
  - `GET /health` funcional no caminho alvo.
  - Fluxos de webhook criticos sem regressao.
  - Launch ACK operacional apos consolidacao.
- Evidencia esperada:
  - Tabela antes/depois de endpoints por autoridade.
  - Log de compat mode (se temporario).
- Criterio de merge:
  - Apenas uma autoridade runtime ativa para integracoes (ou compat com prazo explicito).

### MRP-002

- Objetivo:
  - Endurecer `desktop-app` como shell operacional isolado.
- Arquivos provaveis:
  - `desktop-app/src/main.ts`
  - `desktop-app/src/preload.ts`
  - `docs/ops/INCIDENT_SURFACE_ISOLATION_KDS_ADMIN.md`
- Validacao:
  - Smokes TPV/KDS sem render de admin em runtime operacional.
  - Deep link `chefiapp://` e launch ACK sem regressao.
- Evidencia esperada:
  - Checklist de smoke preenchido.
  - Logs de bloqueio/admin guard quando aplicavel.
- Criterio de merge:
  - Rotas admin inacessiveis em janelas operacionais; fluxo TPV/KDS intacto.

### MRP-003

- Objetivo:
  - Formalizar ownership dos 9 modulos Fase 4.
- Arquivos provaveis:
  - `.github/CODEOWNERS`
  - `docs/audit/MONOREPO_PHASE4_GOVERNANCE_MATRIX_2026-03-07.md`
- Validacao:
  - `git diff .github/CODEOWNERS` mostra os 9 modulos.
- Evidencia esperada:
  - Trecho do diff CODEOWNERS.
- Criterio de merge:
  - Todos os modulos com owner explicito e alinhado com matriz.

### MRP-004

- Objetivo:
  - Reduzir acoplamento interno do `merchant-portal` por dominio.
- Arquivos provaveis:
  - `merchant-portal/src/core/**`
  - `merchant-portal/src/features/**`
  - docs de contrato no `docs/architecture/**`
- Validacao:
  - Build/type-check/lint do `merchant-portal`.
  - Testes de regressao nos fluxos afetados.
- Evidencia esperada:
  - Mapa de dependencias cruzadas reduzidas (antes/depois).
- Criterio de merge:
  - Fronteiras admin/op/billing mais claras sem split prematuro.

### MRP-005

- Objetivo:
  - Definir fronteira oficial `mobile-app` vs AppStaff web.
- Arquivos provaveis:
  - `mobile-app/README.md`
  - `docs/APPSTAFF_PRODUCT_OVERVIEW.md`
  - `docs/APPSTAFF_MOBILE_TECH_SHEET.md`
- Validacao:
  - Contratos de superficie consistentes entre docs e runtime.
- Evidencia esperada:
  - Decisao publicada (fonte oficial unica) e links cruzados atualizados.
- Criterio de merge:
  - Ambiguidade eliminada sobre superficie oficial e papel de cada app.

### MRP-006

- Objetivo:
  - Endurecer `core-engine` como fonte unica de regras/contratos.
- Arquivos provaveis:
  - `core-engine/**`
  - `merchant-portal/src/core/**` (espelhos/imports)
  - `tests/unit/pulse/**`, `tests/engine/**`
- Validacao:
  - Testes de engine/pulse relevantes verdes.
  - Sem duplicacao ativa de contrato fora do core-engine.
- Evidencia esperada:
  - Lista de espelhos removidos/deprecados.
- Criterio de merge:
  - Fonte unica reforcada e documentada.

### MRP-007

- Objetivo:
  - Consolidar roadmap fiscal e reduzir espalhamento documental.
- Arquivos provaveis:
  - `fiscal-modules/**`
  - `merchant-portal/src/core/fiscal/**`
  - docs fiscais ativas em `docs/`
- Validacao:
  - Testes fiscais principais executados.
- Evidencia esperada:
  - Inventario de docs ativas vs archive e plano de limpeza.
- Criterio de merge:
  - Trilha fiscal ativa unica, sem duplicacao conflitante.

### MRP-008

- Objetivo:
  - Consolidar destino definitivo de `billing-core` (tipos/estado).
- Arquivos provaveis:
  - `billing-core/types.ts`
  - consumidores em `merchant-portal/src/**`
  - docs de billing em `docs/architecture/BILLING_FLOW.md`
- Validacao:
  - Type-check dos consumidores.
- Evidencia esperada:
  - Mapa de importadores com fonte final definida.
- Criterio de merge:
  - Sem ambiguidade para `PlanTier` e `SubscriptionStatus`.

### MRP-009

- Objetivo:
  - Eliminar adaptadores redundantes de tokens em design system.
- Arquivos provaveis:
  - `core-design-system/**`
  - `merchant-portal/src/ui/design-system/tokens/**`
- Validacao:
  - Build do portal sem regressao visual critica.
- Evidencia esperada:
  - Lista de token adapters removidos/simplificados.
- Criterio de merge:
  - Consumo de tokens via pacote padrao do design system.

### MRP-010

- Objetivo:
  - Limpar abstracoes duplicadas e debt local no `merchant-portal`.
- Arquivos provaveis:
  - `merchant-portal/src/**` (wrappers/tokens/utils redundantes)
- Validacao:
  - Lint/type-check/testes do modulo.
- Evidencia esperada:
  - Diff com remocao de duplicacao + prova de nao-regressao.
- Criterio de merge:
  - Estrutura mais simples sem alterar comportamento de produto.

## Cadencia Recomendada de Execucao

1. P0 primeiro: `MRP-001`, `MRP-002`, `MRP-003`.
1. P1 depois: `MRP-004` a `MRP-008`.
1. P2 por ultimo: `MRP-009`, `MRP-010`.

## Regras de Qualidade para Todos os MRP

1. Cada PR deve citar explicitamente o ID MRP no titulo ou descricao.
1. Cada PR deve anexar evidencia objetiva (logs, diff de contrato, checklist).
1. Sem evidencia, sem merge.
