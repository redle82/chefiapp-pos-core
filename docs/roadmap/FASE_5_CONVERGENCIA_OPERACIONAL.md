# Fase 5 — Convergência operacional

**Status:** Épico aberto  
**Tipo:** Convergência — decisões sobre customer-portal, disciplina de gates, evidência inter-app, limpeza de resíduos  
**Última atualização:** 2026-03  
**Pré-requisito:** Fase 4 consolidada (ver estado herdado abaixo).

---

## 1. Objetivo da fase

Transformar o estado final da Fase 4 em **backlog executável** e convergir operacionalmente os workspaces: decidir o destino do customer-portal, instituir os gates como disciplina real de release, produzir evidência inter-app ponta a ponta e remover resíduos de documentação/código que possam induzir regressão. Sem reabrir discussões já fechadas na Fase 4 nem inventar arquitetura nova.

---

## 2. Estado herdado da Fase 4

| Item | Estado | Referência |
|------|--------|------------|
| **C4.1 mobile-app** | **ALIGNED** — evidence pack com role-from-backend, recovery e activation flow; probe `audit:fase3-conformance` inclui mobile-app | [C41_MOBILE_PHASE3_EVIDENCE.md](./C41_MOBILE_PHASE3_EVIDENCE.md) |
| **C4.2 customer-portal** | **Removido do workspace (F5.1)** — era MISSING; decisão Opção A em C42 §8 | [C42_CUSTOMER_PORTAL_STATE.md](./C42_CUSTOMER_PORTAL_STATE.md) |
| **C4.3 billing** | Fechado — `audit:billing-core` em `.github/workflows/ci.yml` (opcional por secret) | [AUDIT_BILLING_CORE_RUN.md](../ops/AUDIT_BILLING_CORE_RUN.md), WORKSPACES_ALIGNMENT §5 |
| **C4.4 observability & rollout** | Fechado — gates, rollout e rollback documentados; tabela em C44 | [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md), WORKSPACES_ALIGNMENT §6 |
| **Workspaces alinhados** | Documento único: onde vive cada app, como testar, contrato Core, gates | [WORKSPACES_ALIGNMENT.md](./WORKSPACES_ALIGNMENT.md) |

**O que já está alinhado (não reabrir):** Contratos Core; merchant-portal e mobile-app com evidência; desktop-app estrutura no probe; gates documentados; customer-portal removido do workspace (F5.1).

---

## 3. Frentes e backlog priorizado

### F5.1 — Customer-portal: decisão formal

**Objetivo:** Eliminar o workspace fantasma ou reintroduzi-lo com contrato mínimo e evidência.

**Estado F5.1:** **Fechado (Opção A executada).** customer-portal removido de `package.json` workspaces e de `tsconfig.json` exclude; docs atualizados. Relatório: [C42_CUSTOMER_PORTAL_STATE.md](./C42_CUSTOMER_PORTAL_STATE.md) §8.

| Prioridade | Tarefa | Critério de conclusão |
|------------|--------|----------------------|
| ~~**P0**~~ | ~~Decidir: remover ou reintroduzir~~ | **Feito** — Opção A (remover) |
| ~~**P1**~~ | ~~Se remover: atualizar tsconfig, docs~~ | **Feito** — tsconfig, C42, WORKSPACES_ALIGNMENT, AGENTS |
| — | Se no futuro reintroduzir: criar `customer-portal/` com package.json + contrato Core; voltar a registar em WORKSPACES_ALIGNMENT §1–§2 | Doc em C42 §2–§3 |

**Definition of Done (F5.1):** ✅ Decisão executada; workspace fantasma eliminado; repo coerente.

---

### F5.2 — Gates operacionais como disciplina de release

**Objetivo:** Fazer de `audit:fase3-conformance` e `audit:billing-core` disciplina real antes de release (não opcional na prática).

**Estado F5.2:** **Fechado.** `audit:fase3-conformance` adicionado ao job `validate` em `.github/workflows/ci.yml`; falha do step = pipeline vermelho. Documentação: required before merge / required before deploy / recommended manual em [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) §2 e §6; AGENTS e WORKSPACES_ALIGNMENT atualizados.

| Prioridade | Tarefa | Critério de conclusão |
|------------|--------|----------------------|
| ~~**P0**~~ | ~~Incluir audit:fase3-conformance no CI~~ | **Feito** — step em ci.yml |
| ~~**P1**~~ | ~~Documentar em AGENTS e C44~~ | **Feito** — §2 (definição explícita) e §6 (quem bloqueia) |
| **P2** | Opcional: job ou workflow dedicado "release-readiness" que corre os três gates em sequência | Comando ou workflow reproduzível |

**Definition of Done (F5.2):** ✅ audit:fase3-conformance corre no CI e falha o pipeline se falhar; documentação explicita required-before-merge, required-before-deploy e recommended manual.

**Relatório curto (mapa dos gates):**

| Gate | Onde | Obrigatório? |
|------|------|----------------|
| typecheck, lint, testes, sovereignty, check-financial-supabase | CI job `validate` | Sim (before merge) |
| **audit:fase3-conformance** | CI job `validate` (F5.2) | Sim (before merge) |
| audit:billing-core | CI job `validate` (se secret) | Sim se secret; senão recommended manual |
| audit:release:portal | Manual / pre-flight-check.sh | Sim (before deploy portal) |
| audit:billing-core (local) | Manual | Recomendado antes de release com alterações billing |

Referência completa: [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) §2 (definição) e §3 (tabela).

---

### F5.3 — Evidência inter-app ponta a ponta

**Objetivo:** Ter uma prova executável (script ou doc de checklist) que cubra portal → mobile → desktop → Core num fluxo coerente com os contratos.

**Estado F5.3:** **Fechado. Classificação: ALIGNED.** Golden path consolidado em [F53_GOLDEN_PATH_EVIDENCE.md](./F53_GOLDEN_PATH_EVIDENCE.md). Comando único: `npm run audit:fase3-conformance`; sequência pre-release: `npm run audit:pre-release` (script `scripts/pre-release-gate.sh` — health Core e audit:billing-core opcionais por env). Automação vs manual explícitos no evidence pack.

| Prioridade | Tarefa | Critério de conclusão |
|------------|--------|----------------------|
| ~~**P0**~~ | ~~Golden path único + doc~~ | **Feito** — F53_GOLDEN_PATH_EVIDENCE.md §1 e §4 |
| ~~**P1**~~ | ~~Script pre-release (health + fase3 + billing)~~ | **Feito** — `audit:pre-release` / `pre-release-gate.sh` |
| **P2** | Evidência E2E manual (checklist) pairing desktop + mobile em device real | Residual; documentado como manual em F53 §3 |

**Definition of Done (F5.3):** ✅ Golden path descrito e rastreável; evidência centralizada (F53 + probe + pre-release script); automação vs manual separados; F5.3 ALIGNED.

---

### F5.4 — Limpeza de resíduos (workspaces e documentação)

**Objetivo:** Remover ou atualizar referências que possam induzir regressão (ex.: docs que assumem customer-portal ativo, menções obsoletas a "PARTIAL" para C4.1).

**Estado F5.4:** **Fechado (F6.2 executado).** Varredura feita; docs operacionais e de auditoria alinhados ao estado real (customer-portal removido F5.1; C4.1 ALIGNED). Relatório: [FASE_6_ESTABILIDADE_PROXIMO_CICLO.md](./FASE_6_ESTABILIDADE_PROXIMO_CICLO.md) § F6.2.

| Prioridade | Tarefa | Critério de conclusão |
|------------|--------|----------------------|
| ~~**P1**~~ | ~~Varrer docs por customer-portal e PARTIAL (C4.1)~~ | **Feito** — FASE_5, INDEX, SURFACES_CURRENT_STATE, AUDITORIA_TECNICA_SUPREMA, ARCHITECTURE_OVERVIEW, FRAGMENTACAO, FASE_4, AUDIT_SUPREMA_20260207 corrigidos ou anotados |
| ~~**P1**~~ | ~~FASE_4 e INDEX consistentes com C41/C42~~ | **Feito** — C42 como removido (F5.1); C41 ALIGNED |
| **P2** | Listar docs redundantes (opcional) | Lista em FASE_5 ou RUNBOOKS; sem remoção agressiva sem acordo |

**Definition of Done (F5.4):** ✅ Documentação operacional coerente; não há referências que assumam customer-portal ativo ou C4.1 PARTIAL.

---

## 4. Backlog priorizado (resumo)

| P | Frente | Primeira tarefa acionável |
|---|--------|----------------------------|
| ~~**P0**~~ | F5.1 | **Fechado** — Opção A (removido do workspace) |
| ~~**P0**~~ | F5.2 | **Fechado** — audit:fase3-conformance no CI; disciplina em C44 §2 e §6 |
| ~~**P0**~~ | F5.3 | **Fechado** — Golden path em F53; audit:pre-release (pre-release-gate.sh) |
| **P1** | F5.1 | Atualizar tsconfig/docs (se remover) ou package.json + WORKSPACES_ALIGNMENT (se reintroduzir) |
| ~~**P1**~~ | F5.2 | **Feito** — disciplina em AGENTS/C44 |
| ~~**P1**~~ | F5.4 | **Fechado** — limpeza executada em F6.2 |
| **P2** | F5.2 | Opcional: workflow release-readiness único |
| ~~**P2**~~ | F5.3 | **Feito** — Script pre-release gate; E2E real em device permanece manual (F53 §3) |
| **P2** | F5.4 | Listar docs redundantes (opcional); depreciar se acordado |

---

## 5. Recomendação: primeira frente a executar

**Recomendação:** **F5.1 (customer-portal)**.

**Motivo:** O workspace está declarado sem diretório; isso gera ambiguidade em clones frescos e em qualquer menção a "workspaces". Decidir e executar (remover do `package.json` ou criar diretório mínimo) é de baixo risco, rápido e desbloqueia coerência total em WORKSPACES_ALIGNMENT e em F5.4 (limpeza). Em seguida, executar **F5.2** (audit:fase3-conformance no CI) para tornar a disciplina de gates real sem depender de decisão de produto.

**Ordem sugerida:** F5.1 → F5.2 → F5.3 → F5.4 (com F5.4 em paralelo ou após F5.1 para alinhar docs ao novo estado do customer-portal).

---

## 6. Referências

- [WORKSPACES_ALIGNMENT.md](./WORKSPACES_ALIGNMENT.md) — estado dos workspaces; link para Fase 5 no fim.
- [FASE_4_EXPANSAO_CONTROLADA.md](./FASE_4_EXPANSAO_CONTROLADA.md) — estado consolidado que a Fase 5 herda.
- [C42_CUSTOMER_PORTAL_STATE.md](./C42_CUSTOMER_PORTAL_STATE.md) — opções e recomendações para customer-portal (F5.1).
- [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) — tabela de gates e disciplina de release (F5.2).
- [FASE_3_CONFORMANCE_INTER_APP.md](./FASE_3_CONFORMANCE_INTER_APP.md) — golden flows e matriz de conformidade (F5.3).
- [F53_GOLDEN_PATH_EVIDENCE.md](./F53_GOLDEN_PATH_EVIDENCE.md) — evidence pack F5.3: golden path, automação vs manual, audit:pre-release.

---

**Próxima fase:** [Fase 6 — Estabilidade e próximo ciclo](./FASE_6_ESTABILIDADE_PROXIMO_CICLO.md).

*Fase 5 — Convergência operacional. Backlog acionável; não reabrir Fase 4.*
