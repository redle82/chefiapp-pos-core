# Fase 6 — Estabilidade e próximo ciclo

**Status:** Épico aberto  
**Tipo:** Estabilidade — manter governança técnica explícita; preparar escala ou próximos épicos sem carregar entulho  
**Última atualização:** 2026-03  
**Pré-requisito:** Fase 5 em curso ou fechada (F5.1–F5.3 fechados; F5.4 limpeza recomendada antes de abrir frentes novas).

---

## 1. Objetivo da fase

Consolidar o estado **operacionalmente coerente** alcançado na Fase 5: contrato + evidência + disciplina de gates a funcionar em conjunto. Garantir que o sistema não volta a um estado implícito ou ambíguo. Preparar o terreno para o próximo ciclo (escala, novos épicos de produto ou qualidade) **sem** reintroduzir redundância documental nem referências obsoletas.

---

## 2. Estado herdado da Fase 5

| Item | Estado | Referência |
|------|--------|------------|
| **F5.1 customer-portal** | Fechado — removido do workspace; repo coerente | [C42_CUSTOMER_PORTAL_STATE.md](./C42_CUSTOMER_PORTAL_STATE.md) §8 |
| **F5.2 gates** | Fechado — `audit:fase3-conformance` no CI; required before merge/deploy explícitos em C44 | [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) §2 e §6 |
| **F5.3 golden path** | Fechado — ALIGNED; evidence pack F53; `audit:pre-release` | [F53_GOLDEN_PATH_EVIDENCE.md](./F53_GOLDEN_PATH_EVIDENCE.md) |
| **F5.4 limpeza** | **Fechado (F6.2)** — resíduos tratados; docs alinhados ao estado real | [FASE_5_CONVERGENCIA_OPERACIONAL.md](./FASE_5_CONVERGENCIA_OPERACIONAL.md) § F5.4 |

**Fotografia geral pós-Fase 5:** merchant-portal estabilizado; mobile-app ALIGNED; customer-portal resolvido por remoção formal; gates endurecidos no CI; pre-release gate disponível; golden path inter-app consolidado; documentação de release, rollout e rollback amarrada ao que existe.

---

## 3. Frentes e backlog priorizado

### F6.1 — Manutenção da disciplina

**Objetivo:** Não deixar os gates e a documentação de release degradarem; manter CI e pre-release como prática real.

| Prioridade | Tarefa | Critério de conclusão |
|------------|--------|----------------------|
| **P1** | Manter `audit:fase3-conformance` e `audit:pre-release` verdes; corrigir falhas no CI em vez de desativar steps | Pipeline estável; docs C44 e AGENTS refletem a prática |
| **P2** | Revisar anualmente (ou por ciclo) a tabela de gates em C44 e WORKSPACES_ALIGNMENT | Tabela atualizada; sem gates fantasmas |

**Definition of Done (F6.1):** Gates continuam a correr no CI; falhas são tratadas como bloqueantes; não há "skip" permanente sem justificação documentada.

---

### F6.2 — Fechar F5.4 (limpeza) antes de novo épico

**Objetivo:** Executar a limpeza de resíduos da Fase 5 para que a Fase 6 não arranque com documentação inconsistente.

**Estado F6.2:** **Fechado.** Varredura executada; resíduos classificados e corrigidos; F5.4 marcado fechado. Relatório abaixo (§ F6.2 executado).

| Prioridade | Tarefa | Critério de conclusão |
|------------|--------|----------------------|
| ~~**P0**~~ | ~~Executar F5.4~~ | **Feito** — docs operacionais e de auditoria alinhados |
| **P2** | Listar docs redundantes (roadmap/ops) que duplicam WORKSPACES_ALIGNMENT ou F53; depreciar ou arquivar se acordado | Opcional; lista quando útil |

**Definition of Done (F6.2):** ✅ F5.4 fechado; docs coerentes com estado real (customer-portal removido; C4.1 ALIGNED).

---

#### F6.2 executado — Relatório curto (limpeza F5.4)

| Ficheiro | Resíduo | Classificação | Decisão |
|----------|---------|----------------|---------|
| FASE_5_CONVERGENCIA_OPERACIONAL.md | C4.2 descrito como "MISSING" na tabela herdada; texto "customer-portal estado documentado como MISSING" | Desatualizado (pós-F5.1) | Corrigido — "Removido do workspace (F5.1)"; "customer-portal removido do workspace" |
| INDEX.md | Lista "customer-portal" como workspace atual | Desatualizado | Corrigido — "(customer-portal removido em F5.1)" |
| SURFACES_CURRENT_STATE.md | Árvore com `customer-portal/ # (parcial, não usado)` | Desatualizado | Corrigido — nota "(customer-portal removido em F5.1)" |
| AUDITORIA_TECNICA_SUPREMA_2026-03-10.md | "customer-portal existe como workspace" | Desatualizado | Corrigido — "removido em F5.1" |
| ARCHITECTURE_OVERVIEW.md | Constraint "Only active in customer-portal" sem contexto | Desatualizado | Corrigido — nota sobre F5.1 e C42 |
| FRAGMENTACAO_PROJETO_2026_02.md | "2 workspaces (merchant-portal, customer-portal)" | Desatualizado | Corrigido — "customer-portal removido em F5.1" |
| AUDIT_SUPREMA_20260207.md | Ghost customer-portal (recomendação de remoção) | Histórico | Nota no topo: "Resolvido em F5.1" + link C42 §8 |
| FASE_4_EXPANSAO_CONTROLADA.md | C4.2 apenas "MISSING"; ref C42 como "MISSING" | Desatualizado | Corrigido — "resolvido em F5.1 (Opção A)"; ref C42 §8 |

**C4.1 PARTIAL:** Nenhuma referência operacional a C4.1 como PARTIAL encontrada nos docs de roadmap/ops ativos; C41_MOBILE_PHASE3_EVIDENCE já indica "PARTIAL: Não". Docs em `archive/` e outros "PARTIAL" (ex.: PARTIALLY_PAID, SetupStatus) mantidos como histórico.

**Conclusão F6.2:** Fechado. Resíduos relevantes identificados e tratados; docs operacionais sem contradições com estado final; histórico preservado com notas onde necessário.

---

### F6.3 — Próximo ciclo (definido: Fase 7)

**Objetivo:** Reservar espaço para o próximo épico estratégico sem reabrir arquitetura nem quebrar a governança atual.

**Estado F6.3:** **Definido.** O próximo ciclo é a **[Fase 7 — Readiness e escala operacional](./FASE_7_READINESS_ESCALA_OPERACIONAL.md)**: readiness de produção verificável (F7.1), observabilidade e runbooks (F7.2), escala e robustez opcional (F7.3). Primeira frente recomendada: **F7.1** (checklist de production readiness com critérios verificáveis).

| Prioridade | Tarefa | Critério de conclusão |
|------------|--------|----------------------|
| ~~**P2**~~ | ~~Definir objetivos do próximo ciclo~~ | **Feito** — Fase 7 documentada |
| **P2** | Novos épicos (Fase 7+) referenciam WORKSPACES_ALIGNMENT, C44 e F53 como baseline | Fase 7 já referencia; manter em fases futuras |

**Definition of Done (F6.3):** ✅ Próximo ciclo tem objetivos claros (Fase 7) e herda o estado estável da Fase 5/6.

---

## 4. Backlog priorizado (resumo)

| P | Frente | Primeira tarefa acionável |
|---|--------|----------------------------|
| ~~**P0**~~ | F6.2 | **Fechado** — F5.4 executado; relatório § F6.2 executado |
| **P1** | F6.1 | Manter disciplina de gates; CI e pre-release como prática |
| **P2** | F6.2 | Listar docs redundantes (opcional) |
| ~~**P2**~~ | F6.3 | **Fechado** — Próximo ciclo = Fase 7 (readiness e escala operacional) |

---

## 5. Recomendação: primeira frente a executar

**Recomendação:** **F6.2** fechado; **F6.3** fechado (próximo ciclo = Fase 7). Próxima frente a executar no roadmap: **F7.1** (Production readiness verificável) em [Fase 7](./FASE_7_READINESS_ESCALA_OPERACIONAL.md). F6.1 (manutenção da disciplina) permanece como prática contínua.

**Ordem sugerida:** Fase 7 — F7.1 → F7.2 → F7.3 (opcional).

---

## 6. Referências

- [FASE_5_CONVERGENCIA_OPERACIONAL.md](./FASE_5_CONVERGENCIA_OPERACIONAL.md) — fase anterior; F5.4 fechado (F6.2).
- [WORKSPACES_ALIGNMENT.md](./WORKSPACES_ALIGNMENT.md) — estado dos workspaces; gates e pre-release.
- [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) — required before merge/deploy; recommended manual.
- [F53_GOLDEN_PATH_EVIDENCE.md](./F53_GOLDEN_PATH_EVIDENCE.md) — golden path inter-app; audit:pre-release.
- [FASE_7_READINESS_ESCALA_OPERACIONAL.md](./FASE_7_READINESS_ESCALA_OPERACIONAL.md) — próximo ciclo: readiness verificável, observabilidade, escala (F7.1 → F7.2 → F7.3).

---

*Fase 6 — Estabilidade e próximo ciclo. F6.2 e F6.3 fechados; próximo ciclo = Fase 7.*
