# Freeze Operacional — Versão 1.0-rc

**Data:** 2026-02-03
**Status:** Congelado
**Versão:** 1.0-rc (release candidate)

---

## Frase âncora

Congelar não é parar. Congelar = parar de mexer no motor enquanto o carro está em pista.

Congelar não é desistir de evoluir. É respeitar um sistema que finalmente está inteiro.

---

## Estado em que se congela

- Core soberano (Docker) funcional
- Frontend alinhado ao Core
- Testes automáticos a passar
- Ritual humano ([CHECKLIST_HUMANO_OPERACIONAL_COMPLETO.md](./CHECKLIST_HUMANO_OPERACIONAL_COMPLETO.md)) pendente

---

## O que fica congelado (não mexer)

- Arquitectura
- Core schema
- Fluxos TPV → Order → KDS → Fecho
- Guards, mensagens, preflight
- "Melhorias" por intuição
- Qualquer refactor estrutural

**Regra:** Nada entra no Core sem quebrar o gelo conscientemente (ritual da [LEI_EXISTENCIAL_CHEFIAPP_OS.md](./LEI_EXISTENCIAL_CHEFIAPP_OS.md)).

---

## O que ainda pode acontecer sem quebrar o freeze

1. **Ritual humano** — Executar [CHECKLIST_HUMANO_OPERACIONAL_COMPLETO.md](./CHECKLIST_HUMANO_OPERACIONAL_COMPLETO.md) na UI. Obrigatório; não é mudança de código.
2. **Correções cirúrgicas** — Se o ritual falhar: bug claro, escopo mínimo, sem redesenhar.
3. **Documentação** — Manual do restaurante, manual do operador, pitch, roadmap v1.
4. **Uso real** — Testar em restaurante, observar comportamento, anotar fricções (sem corrigir no impulso).

---

## Fases (ordem)

### Fase 1 — FREEZE (agora)

- Declarar freeze (este documento).
- Tag: `v1.0.0-rc1`. Branch: `release/enterprise-core-rc1`.

### Fase 2 — Ritual humano

- Executar o checklist na UI (1 pedido, 3 roles, PASS/FAIL por passo).
- Resultado documentado; nenhuma linha de código até acabar.

### Fase 3 — Decisão binária

| Resultado           | Acção                                                           |
| ------------------- | --------------------------------------------------------------- |
| **PASS total**      | Promover para v1.0; sistema pronto para venda / escala / pitch. |
| **FAIL pontual**    | Corrigir apenas o que falhou; novo tag rc2; congelar novamente. |
| **FAIL estrutural** | Descongelar conscientemente, com problema nomeado; sem caos.    |

---

## Referências

- [SCOPE_FREEZE.md](./SCOPE_FREEZE.md) — Escopo de features congelado.
- [LEI_EXISTENCIAL_CHEFIAPP_OS.md](./LEI_EXISTENCIAL_CHEFIAPP_OS.md) — Ritual de mudança; zonas intocáveis.
- [CHECKLIST_HUMANO_OPERACIONAL_COMPLETO.md](./CHECKLIST_HUMANO_OPERACIONAL_COMPLETO.md) — Ritual humano (1 pedido, 3 roles).
- [TEST_PLAN_BEFORE_FREEZE.md](./TEST_PLAN_BEFORE_FREEZE.md) — Os 4 testes; Test Day.
- [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md) — Índice de contratos Core.
