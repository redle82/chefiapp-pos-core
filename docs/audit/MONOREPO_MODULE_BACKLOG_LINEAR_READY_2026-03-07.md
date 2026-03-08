# Backlog por Modulo — Linear/PR Ready

Data: 2026-03-07
Fonte: `docs/audit/MONOREPO_PHASE4_GOVERNANCE_MATRIX_2026-03-07.md`
Playbook de execucao por PR: `docs/audit/MONOREPO_MRP_PR_EXECUTION_PLAYBOOK_2026-03-07.md`
Templates pre-preenchidos de issue/PR: `docs/audit/MONOREPO_LINEAR_ISSUE_PR_TEMPLATES_MRP_2026-03-07.md`
Objetivo: transformar decisoes `manter/consolidar/arquivar` em trabalho executavel.

## Formato

Cada item abaixo ja vem com:

- Prioridade (`P0`, `P1`, `P2`)
- Acao (`manter`, `consolidar`, `arquivar`)
- Titulo sugerido para Linear
- Escopo de PR
- Criterio de aceite (DoD)

## Itens

| ID      | Modulo                                 | Prioridade | Acao       | Titulo Linear sugerido                                              | Escopo PR                                                        | DoD                                                                                       |
| ------- | -------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| MRP-001 | `server` + `integration-gateway`       | P0         | consolidar | `[integration] Definir autoridade unica de gateway runtime`         | mapear e migrar endpoints duplicados; manter compat temporaria   | existe apenas uma autoridade runtime para integracoes; compat antiga com prazo de remocao |
| MRP-002 | `desktop-app`                          | P0         | manter     | `[desktop-app] Endurecer contrato shell e isolamento de superficie` | reforcar bloqueio de rotas nao-operacionais; validar launch flow | admin nao renderiza em janelas operacionais; checklist de smoke aprovado                  |
| MRP-003 | `CODEOWNERS` (9 modulos)               | P0         | manter     | `[governance] Formalizar ownership dos modulos Fase 4`              | atualizar `CODEOWNERS`; alinhar docs de governanca               | todos os 9 modulos mapeados no CODEOWNERS                                                 |
| MRP-004 | `merchant-portal`                      | P1         | manter     | `[merchant-portal] Reduzir acoplamento interno por dominio`         | separar fronteiras de admin/op/billing sem split prematuro       | dependencias cruzadas criticas reduzidas e documentadas                                   |
| MRP-005 | `mobile-app`                           | P1         | manter     | `[mobile-app] Definir fronteira oficial AppStaff mobile vs web`     | consolidar contrato de superficie e runtime esperado             | decisao oficial publicada; rotas/fluxos alinhados ao contrato                             |
| MRP-006 | `core-engine`                          | P1         | manter     | `[core-engine] Endurecer fonte unica de regras e contratos`         | reduzir stubs/espelhos; centralizar contratos ativos             | referencias duplicadas removidas ou marcadas como deprecadas                              |
| MRP-007 | `fiscal-modules`                       | P1         | manter     | `[fiscal] Consolidar roadmap fiscal e reduzir espalhamento`         | organizar adapters/validators e docs ativos                      | roadmap fiscal unico e referencias archive isoladas                                       |
| MRP-008 | `billing-core`                         | P1         | consolidar | `[billing-core] Consolidar destino definitivo de tipos/estado`      | decidir fonte unica de tipos billing e migrar consumidores       | sem ambiguidade de fonte para `PlanTier/SubscriptionStatus`                               |
| MRP-009 | `core-design-system`                   | P2         | manter     | `[design-system] Eliminar adaptadores redundantes de tokens`        | reduzir re-declaracoes de token no `merchant-portal`             | consumo de tokens via pacote padrao e duplicacoes removidas                               |
| MRP-010 | `merchant-portal` (higiene estrutural) | P2         | consolidar | `[merchant-portal] Limpar abstrações duplicadas e debt local`       | limpar wrappers/tokens duplicados com impacto baixo              | bundle e estrutura sem regressao funcional                                                |

## Sugestao de Sequencia de Execucao

1. Sprint curta P0 (MRP-001, MRP-002, MRP-003).
1. Sprint P1 dominio (MRP-004 a MRP-008).
1. Sprint P2 qualidade estrutural (MRP-009, MRP-010).

## Template de PR por Item

Usar este template minimo para cada item:

- Titulo: `[<modulo>] <objetivo claro>`
- Contexto: problema atual e risco se nada for feito
- Mudancas: lista objetiva de alteracoes
- Validacao: comandos/testes executados
- DoD: checkbox alinhado ao backlog
- Riscos residuais: o que fica para proximo item
