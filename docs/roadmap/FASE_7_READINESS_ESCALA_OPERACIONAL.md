# Fase 7 — Readiness e escala operacional

**Status:** Operacionalmente fechada (F7.1 + F7.2); F7.3 em espera consciente  
**Tipo:** Evolução — readiness de produção verificável; observabilidade e runbooks; preparação para escala  
**Última atualização:** 2026-03  
**Pré-requisito:** Fase 6 em curso (F6.2 fechado; F6.1 contínuo). Estado herdado: gates no CI, golden path consolidado, docs coerentes.

---

## 1. Objetivo da fase

Elevar o **readiness de produção** e a **observabilidade** a critérios **verificáveis** e executáveis, sem reabrir arquitetura. Reduzir o risco de go-live e de operação em produção através de: (1) checklist de production readiness com evidência; (2) runbooks e gaps de observabilidade explícitos; (3) opcionalmente, robustez e escala (testes, métricas, Core). A fase ataca um problema real — releases e operação hoje dependem de disciplina humana e docs estáticos; o objetivo é tornar o “pronto para produção” **auditável** e **repetível**.

---

## 2. Estado herdado da Fase 6

| Item | Estado | Referência |
|------|--------|------------|
| **F6.1 disciplina** | Contínuo — gates no CI; pre-release disponível | C44, AGENTS |
| **F6.2 F5.4 limpeza** | Fechado — docs alinhados ao estado real | FASE_6 § F6.2 executado |
| **F6.3 próximo ciclo** | Definido — **Fase 7** (este documento) | — |

**Baseline:** WORKSPACES_ALIGNMENT, C44 (gates e rollout), F53 (golden path), pre-flight-check.sh e audit:pre-release. Nenhuma alteração a workspaces já resolvidos (customer-portal permanece removido).

---

## 3. Frentes candidatas (avaliação resumida)

| Frente | Valor estratégico | Urgência | Dependências | Risco | Execução incremental | Nota |
|--------|-------------------|----------|--------------|-------|----------------------|------|
| **F7.1 Readiness verificável** | Alto — releases mais seguros; critérios explícitos | Média | Nenhuma | Baixo | Sim — checklist → evidência → gate opcional | Construção direta sobre C44 e pre-flight |
| **F7.2 Observabilidade e runbooks** | Alto — deteção e resposta a incidentes | Média | Sentry/DSN, opcional Core | Baixo | Sim — gaps documentados → runbooks → alertas | C44 já lista gaps; fechar anéis |
| **F7.3 Escala e robustez** | Alto para multi-tenant/volume | Baixa a média | Ambiente, carga | Médio | Sim — E2E/stress → métricas → hardening | Pode seguir F7.1/F7.2 |

**Recomendação:** Abrir a Fase 7 com **F7.1** como primeira frente (readiness verificável), depois **F7.2** (observabilidade e runbooks). **F7.3** fica como frente opcional ou para ciclo seguinte, consoante prioridade de produto (escala vs. novas features).

**Motivo da escolha:** F7.1 e F7.2 não inventam arquitetura nova; aproveitam C44, PRODUCTION_ROLLOUT_MONITORING_PLAN e ROLLOUT_QUICK_REFERENCE; têm primeira tarefa clara (checklist de production readiness com critérios sim/não e, se possível, script ou gate); impacto direto em go-live e operação.

---

## 4. Frentes e backlog priorizado

### F7.1 — Production readiness verificável

**Objetivo:** Ter um checklist de production readiness **executável** e **auditável**, alinhado a C44 e ao pre-flight existente, com critérios sim/não e evidência (comando, screenshot ou doc).

| Prioridade | Tarefa | Critério de conclusão |
|------------|--------|----------------------|
| **P0** | Definir checklist de production readiness (portal + opcional Core/mobile) com critérios verificáveis; documento em `docs/ops/` ou `docs/roadmap/` | Doc único com itens sim/não; cada item com “como verificar” ou comando |
| ~~**P1**~~ | Alinhar a C44 e pre-flight; referenciar | **Feito** — C44 §4, WORKSPACES_ALIGNMENT, AGENTS |
| **P2** | Opcional: script que falha se item obrigatório falhar | Pendente |

**Estado F7.1:** **Fechado.** Checklist em [PRODUCTION_READINESS_CHECKLIST.md](../ops/PRODUCTION_READINESS_CHECKLIST.md); referenciado em C44 §4, WORKSPACES_ALIGNMENT e AGENTS.

**Definition of Done (F7.1):** ✅ Checklist existe, está ligado a C44/pre-flight e pode ser usado antes de cada release como critério objetivo.

---

### F7.2 — Observabilidade e runbooks

**Objetivo:** Fechar gaps de observabilidade já identificados em C44 (Sentry/DSN opcional, métricas de negócio) e garantir runbooks de rollout/rollback e incidentes **acionáveis**.

| Prioridade | Tarefa | Critério de conclusão |
|------------|--------|----------------------|
| **P1** | Documentar gaps de observabilidade atuais (por superfície: portal, mobile, Core) e decisão: aceitar, mitigar ou resolver | Secção em C44 ou doc dedicado; lista de gaps com dono ou “aceite” |
| **P1** | Garantir que PRODUCTION_ROLLOUT_MONITORING_PLAN e ROLLOUT_QUICK_REFERENCE estão referenciados em C44 e no checklist F7.1 | Links explícitos; sem duplicar conteúdo de forma confusa |
| **P2** | Runbook mínimo para “incidente em produção” (quem verifica quê, primeiros passos, rollback) em `docs/ops/` | Doc único ou extensão de rollback existente; passos reproduzíveis |

**Estado F7.2:** **Fechado.** Mapa em [OBSERVABILITY_AND_RUNBOOKS_MAP.md](../ops/OBSERVABILITY_AND_RUNBOOKS_MAP.md): sinais por superfície (§1), runbooks quando usar (§2), gaps com decisão (§3), incidente em produção (§4). C44 e PRODUCTION_READINESS_CHECKLIST atualizados com links ao mapa e a RUNBOOKS/rollout.

**Definition of Done (F7.2):** ✅ Gaps explícitos e decididos; runbooks de rollout e incidente acessíveis e referenciados.

---

### F7.3 — Escala e robustez (opcional)

**Objetivo:** Preparar o sistema para maior carga ou multi-tenant (testes, métricas, hardening). Só avançar quando houver prioridade de produto para escala.

| Prioridade | Tarefa | Critério de conclusão |
|------------|--------|----------------------|
| **P2** | Identificar 3–5 cenários de carga ou robustez críticos (ex.: N pedidos simultâneos, Core em baixo, billing webhook em pico) | Lista em doc de roadmap ou ADR; priorizada |
| **P2** | Opcional: teste ou script de smoke de carga/robustez; documentar em WORKSPACES_ALIGNMENT ou C44 | Comando ou passo documentado; não bloqueia release por defeito |

**Definition of Done (F7.3):** Cenários de escala/robustez identificados; se aplicável, um teste ou script de evidência documentado.

---

## 5. Backlog priorizado (resumo)

| P | Frente | Primeira tarefa acionável |
|---|--------|----------------------------|
| ~~**P0**~~ | F7.1 | **Fechado** — checklist em docs/ops/PRODUCTION_READINESS_CHECKLIST.md |
| ~~**P1**~~ | F7.1 | **Feito** — C44, WORKSPACES_ALIGNMENT, AGENTS |
| ~~**P1**~~ | F7.2 | **Fechado** — OBSERVABILITY_AND_RUNBOOKS_MAP; C44 e checklist alinhados |
| ~~**P2**~~ | F7.1 | **Opcional disponível** — `npm run audit:readiness` (pre-flight-check.sh); documentado no checklist e C44 |
| ~~**P2**~~ | F7.2 | **Feito** — §4 do mapa + INCIDENT_RESPONSE + rollback-procedure |
| **P2** | F7.3 | Cenários de escala/robustez; opcional teste ou script |

---

## 6. Recomendação: primeira frente a executar

**Recomendação:** **F7.1 e F7.2 fechados.** Próxima frente opcional: **F7.3 (Escala e robustez)** quando houver prioridade de produto.

**Motivo:** F7.2 entregou mapa de observabilidade/runbooks, gaps decididos e primeiros passos para incidente em produção; tudo ligado a C44 e ao checklist de readiness.

**Ordem sugerida:** F7.3 quando prioridade de escala; senão manter disciplina (F6.1) e usar checklist + mapa em cada release.

---

## 7. Referências

- [FASE_6_ESTABILIDADE_PROXIMO_CICLO.md](./FASE_6_ESTABILIDADE_PROXIMO_CICLO.md) — fase anterior; F6.3 = objetivos do próximo ciclo (Fase 7).
- [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) — gates, rollout e rollback; baseline para F7.1 e F7.2.
- [WORKSPACES_ALIGNMENT.md](./WORKSPACES_ALIGNMENT.md) — workspaces, gates e pre-release.
- [PRODUCTION_READINESS_CHECKLIST.md](../ops/PRODUCTION_READINESS_CHECKLIST.md) — checklist F7.1 (obrigatório + recomendado; como verificar).
- [OBSERVABILITY_AND_RUNBOOKS_MAP.md](../ops/OBSERVABILITY_AND_RUNBOOKS_MAP.md) — mapa F7.2: sinais por superfície, runbooks quando usar, gaps, incidente em produção.
- [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](../ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md), [ROLLOUT_QUICK_REFERENCE.md](../ops/ROLLOUT_QUICK_REFERENCE.md) — plano de rollout e referência rápida.

---

---

## 8. Relatório de abertura (frentes candidatas e conclusão)

**Frentes avaliadas:**

| Frente | Valor | Urgência | Risco | Incremental | Decisão |
|--------|-------|----------|-------|-------------|---------|
| Readiness verificável (F7.1) | Alto — releases mais seguros | Média | Baixo | Sim | **Escolhida como primeira** — constrói sobre C44 e pre-flight; primeira tarefa clara |
| Observabilidade e runbooks (F7.2) | Alto — deteção e resposta | Média | Baixo | Sim | **Incluída** — segue F7.1; fecha gaps já listados em C44 |
| Escala e robustez (F7.3) | Alto para volume/multi-tenant | Baixa a média | Médio | Sim | **Incluída como opcional** — quando prioridade de produto para escala |
| Novo módulo/produto (ex.: customer-portal) | Depende de produto | — | — | — | Não abrir nesta fase — evitar dispersão; Fase 7 foca readiness e observabilidade |
| Billing/Core hardening (pipeline webhooks, audit) | Alto se billing crítico | Depende | Médio | Sim | Não como frente principal agora — audit:billing-core já no CI; pode entrar em F7.3 ou fase futura |

**Conclusão:** Fase 7 aberta com foco em **readiness verificável** e **observabilidade/runbooks**. Primeira frente a executar: **F7.1** (checklist de production readiness com critérios verificáveis e alinhamento a C44). Justificação: ataca problema real (releases e operação mais seguros), execução incremental, sem reabrir arquitetura nem workspaces.

---

## 9. F7.2 executado — Relatório curto

- **Sinais existentes:** Portal (audit:release:portal, Sentry, pre-flight); Core (health-check-core.sh, audit:billing-core); mobile (Sentry, audit:fase3-conformance); rollout T+0h–T+48h (PRODUCTION_ROLLOUT_MONITORING_PLAN, ROLLOUT_QUICK_REFERENCE). Documentados em C44 §1 e no novo mapa §1.
- **Runbooks existentes:** RUNBOOKS.md (índice); INCIDENT_RESPONSE, INCIDENT_PLAYBOOK_STOLEN_DEVICE, rollback-procedure, health-checks, alerts, DEPLOYMENT, GO_LIVE_CHECKLIST, etc. Mapa §2 indica quando usar cada um.
- **Gaps encontrados e decisão:** Sentry/DSN opcional → Aceite; métricas Core RPC % em dashboards externos → Aceite; logging não centralizado → Aceite; customer-portal → N/A; runbook incidente genérico → Resolvido (§4 do mapa); docs dispersas → Mitigado (RUNBOOKS + mapa). Todos registados em [OBSERVABILITY_AND_RUNBOOKS_MAP.md](../ops/OBSERVABILITY_AND_RUNBOOKS_MAP.md) §3.
- **Doc novo:** `docs/ops/OBSERVABILITY_AND_RUNBOOKS_MAP.md` — sinais por superfície, runbooks quando usar, gaps com decisão, primeiros passos para incidente em produção. C44 e PRODUCTION_READINESS_CHECKLIST atualizados com links ao mapa e a RUNBOOKS/rollout.
- **F7.2:** Fechado. Próximo passo recomendado: manter disciplina (F6.1) e usar checklist + mapa em cada release; F7.3 (escala/robustez) quando houver prioridade.

---

## 10. Encerramento operacional da Fase 7

**Estado actual:** F7.1 (readiness verificável) e F7.2 (observabilidade e runbooks) estão fechados. O sistema consegue explicar como operar, como validar release e como reagir a incidente — maturidade operacional alcançada.

**F7.3 (Escala e robustez):** Fica em **espera consciente**, não em backlog a executar por reflexo. Só abrir F7.3 quando existir **driver concreto**, por exemplo:
- volume maior (pedidos, tenants, dispositivos)
- multi-tenant mais exigente (SLA, isolamento)
- gargalo de performance (Core, frontend, sync)
- aumento de incidentes ou tempo de resolução
- necessidade explícita de robustez de Core/runtime (health, reconexão, billing)

**Uso recomendado até lá:**
- Usar **F7.1 + F7.2 em toda release** (checklist de production readiness + mapa de observabilidade/runbooks).
- Manter **F6.1** (disciplina de gates no CI, pre-release, sem desativar steps).
- Deixar **F7.3 em espera consciente** — não abrir por inércia; abrir só com evidência de necessidade.

---

## 11. Avaliação de drivers (pós-fecho)

**Avaliação realizada:** Ver [AVALIACAO_DRIVERS_POS_FASE7.md](./AVALIACAO_DRIVERS_POS_FASE7.md).

**Resultado:** Nenhum driver concreto evidenciado no repositório para abrir nova fase ou F7.3. **Decisão: não abrir nova fase;** manter F6.1 e F7 operacional; F7.3 em espera consciente. Critérios objectivos para reabrir (volume, multi-tenant, performance, incidentes, robustez, prioridade de produto) estão documentados na avaliação.

**Manutenção operacional:** Ver [RELATORIO_MANUTENCAO_OPERACIONAL.md](./RELATORIO_MANUTENCAO_OPERACIONAL.md) — auditoria dos artefactos de disciplina, correcção do pre-flight (browser-block) e do checklist, reforço de uso em toda release.

---

*Fase 7 — Readiness e escala operacional. Herda estado da Fase 6; não reabre workspaces nem arquitetura.*
