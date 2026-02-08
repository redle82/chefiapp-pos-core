# Plano de Fecho de Gaps — Livro de Arquitetura ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referências:** [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md) · [GAP_CLOSURE_ROADMAP.md](./GAP_CLOSURE_ROADMAP.md)  
**Propósito:** Plano único com (1) classificação de cada gap, (2) ondas 30/60/90 dias, (3) mapa arquitetura → sprints reais, (4) baseline Livro v1.

---

## 1. Classificação de cada gap (🟢🟡🔴)

Cada lacuna é uma de três naturezas:

| Badge | Nome | Significado | Acção |
|-------|------|-------------|--------|
| 🟢 | **Consolidação** | Já existe no repo, disperso; falta doc canónico + links | Só escrita e organização |
| 🟡 | **Formalização** | Sistema faz ou pressupõe; nunca foi padrão formal | Reflexão + decisões + doc |
| 🔴 | **Engenharia** | Sistema ainda não faz; doc = especificação + plano | Requer código/infra/processo |

### Tabela completa: 42 itens do Roadmap com badge

| # | Secção | Documento / Entrega | 🟢🟡🔴 | Tipo A/B/C |
|---|--------|---------------------|--------|------------|
| 1 | 50 | GDPR_MAPPING.md | 🟡 | B |
| 2 | 50 | WHAT_WE_DO_NOT_PROCESS.md | 🟡 | B |
| 3 | 50 | DATA_SUBJECT_REQUESTS.md | 🟡 | B |
| 4 | 50 | FISCAL_POSITIONING.md | 🟡 | B |
| 5 | 50 | WORK_LOG_EXPORT.md | 🟡+🔴 | B+C (spec agora; export real = eng) |
| 6 | 40 | THREAT_MODEL.md | 🟡 | B |
| 7 | 40 | OWASP_ASVS_CHECKLIST.md | 🟡 | B |
| 8 | 40 | ACCESS_CONTROL_MATRIX.md | 🟢 | A |
| 9 | 40 | AUDIT_LOG_SPEC.md | 🟡+🔴 | B+C (spec agora; trilha imutável = eng) |
| 10 | 40 | INCIDENT_RESPONSE.md | 🟢 | A |
| 11 | 30 | EVENT_TAXONOMY.md | 🟡 | B |
| 12 | 30 | METRICS_DICTIONARY.md | 🟡 | B |
| 13 | 30 | RETENTION_POLICY.md | 🟢 | A |
| 14 | 30 | EXPORT_FORMATS.md | 🟡+🔴 | B+C |
| 15 | 30 | DATA_LINEAGE.md | 🟡+🔴 | B+C |
| 16 | 30 | ANOMALY_DEFINITION.md | 🟡 | B |
| 17 | 20 | Domínios e Contratos (README por domínio) | 🟢 | A |
| 18 | 00 | VISION.md | 🟢 | A |
| 19 | 00 | WHY_CHEFIAPP_EXISTS.md | 🟢 | A |
| 20 | 00 | WHAT_CHEFIAPP_IS_NOT.md | 🟡 | B |
| 21 | 00 | TARGET_RESTAURANT_PROFILE.md | 🟢 | A |
| 22 | 00 | NON_GOALS.md | 🟢 | A |
| 23 | 10 | ARCHITECTURE_OVERVIEW.md | 🟢 | A |
| 24 | 10 | BOUNDARY_CONTEXTS.md | 🟢 | A |
| 25 | 10 | OFFLINE_STRATEGY.md | 🟢 | A |
| 26 | 10 | EDGE_CASES.md | 🟢 | A |
| 27 | 10 | C4_CONTEXT.md | 🟡 | B |
| 28 | 10 | C4_CONTAINER.md | 🟡 | B |
| 29 | 10 | C4_COMPONENT.md | 🟡 | B |
| 30 | 11 | ADRs (doc único / secções) | 🟢 | A |
| 31 | 60 | DEPLOYMENT.md | 🟢 | A |
| 32 | 60 | SLO_SLI.md | 🟡 | B |
| 33 | 60 | RUNBOOKS.md | 🟢 | A |
| 34 | 60 | BACKUP_RESTORE.md | 🟢 | A |
| 35 | 70 | PRD_TASKS.md | 🟢 | A |
| 36 | 70 | PRD_SHIFTS.md | 🟢 | A |
| 37 | 70 | PRD_ALERTS.md | 🟢 | A |
| 38 | 70 | PRD_OWNER_DASHBOARD.md | 🟡 | B |
| 39 | 70 | USER_JOURNEYS.md | 🟢 | A |
| 40 | 80 | LOAD_SCENARIOS.md | 🟡 | B |
| 41 | 80 | CHAOS_CASES.md | 🟡 | B |
| 42 | 80 | RELEASE_CHECKLIST.md | 🟢 | A |

**Resumo por badge:** 🟢 ~22 · 🟡 ~16 · 🔴 (parcial com 🟡) ~5 itens com componente de engenharia.

---

## 2. Ondas 30 / 60 / 90 dias

### Onda 1 — 30 dias (fechar livro no papel)

**Objetivo:** Todos os docs de lacuna 🟢 e 🟡 escritos ou consolidados; Livro v1 congelado como baseline.

| Prioridade | Entregas (exemplos) |
|------------|----------------------|
| 1 | 50 Compliance: GDPR_MAPPING, WHAT_WE_DO_NOT_PROCESS, DATA_SUBJECT_REQUESTS, FISCAL_POSITIONING, WORK_LOG_EXPORT (spec) |
| 2 | 40 Security: THREAT_MODEL, OWASP_ASVS_CHECKLIST, ACCESS_CONTROL_MATRIX, AUDIT_LOG_SPEC (spec), INCIDENT_RESPONSE |
| 3 | 30 Data: EVENT_TAXONOMY, METRICS_DICTIONARY, RETENTION_POLICY, EXPORT_FORMATS (spec), DATA_LINEAGE (spec), ANOMALY_DEFINITION |
| 4 | 20 Domains: secção “Domínios e Contratos” com README por domínio + links para contracts |
| 5 | 00 Vision: VISION, WHY_CHEFIAPP_EXISTS, WHAT_CHEFIAPP_IS_NOT, TARGET_RESTAURANT_PROFILE, NON_GOALS |
| 6 | 10–11 Arch: ARCHITECTURE_OVERVIEW, BOUNDARY_CONTEXTS, OFFLINE_STRATEGY, EDGE_CASES, C4 (Context/Container/Component), ADRs |
| 7 | 60 Ops: DEPLOYMENT, SLO_SLI, RUNBOOKS, BACKUP_RESTORE |
| 8 | 70 Product: PRD_TASKS, PRD_SHIFTS, PRD_ALERTS, PRD_OWNER_DASHBOARD, USER_JOURNEYS |
| 9 | 80 Testing: LOAD_SCENARIOS, CHAOS_CASES, RELEASE_CHECKLIST |

**Critério de sucesso:** Índice do Livro completo; cada secção com doc canónico ou link; tabela “Estado por secção” com badge ✅/🟡/🔴.

---

### Onda 2 — 60 dias (primeira execução de engenharia)

**Objetivo:** Sprint A (Compliance mínimo) executado; evidência operacional dos requisitos documentados na Onda 1.

| Entrega | Descrição |
|---------|-----------|
| Trilhas de auditoria | Audit log imutável (quem fez o quê, quando); alinhado a AUDIT_LOG_SPEC |
| Export real (work log / dados) | Formato especificado (ex.: csv/json); fluxo de export para compliance |
| DSR mínimo | Fluxo operacional para pedidos do titular (acesso, retificação, apagamento, portabilidade); documentado em DATA_SUBJECT_REQUESTS |

**Critério de sucesso:** Export e DSR utilizáveis por equipa legal/DPO; trilha de auditoria consultável.

---

### Onda 3 — 90 dias (hardening + dados)

**Objetivo:** Sprints B (Security) e C (Data) em execução; SLO monitorados.

| Entrega | Descrição |
|---------|-----------|
| Controles do threat model | Mitigações do THREAT_MODEL implementadas ou planeadas com dono |
| AUDIT_LOG_SPEC em produção | Trilha alargada conforme spec |
| Event taxonomy instrumentada | Eventos do METRICS_DICTIONARY/EVENT_TAXONOMY em pipeline/dashboards |
| SLO monitorados | SLO_SLI não só definidos; instrumentação e alertas básicos |

**Critério de sucesso:** Dashboards/alertas alinhados ao Livro; SLO visíveis; security backlog priorizado.

---

## 3. Mapa arquitetura → sprints reais

| Secção do Livro | Onda 1 (30 d) | Onda 2 (60 d) | Onda 3 (90 d) |
|-----------------|---------------|---------------|---------------|
| **50 Compliance** | Docs (GDPR, DSR, Fiscal, Work log spec, What we do not process) | Sprint A: export + DSR + trilhas | — |
| **40 Security** | Docs (Threat model, ASVS, Access matrix, Audit spec, Incident response) | — | Sprint B: controles + audit log em prod |
| **30 Data** | Docs (Event taxonomy, Metrics dict, Retention, Export/Lineage spec, Anomaly) | — | Sprint C: taxonomy instrumentada + SLO monitorados |
| **20 Domains** | Doc “Domínios e Contratos” (README + links) | — | — |
| **00 Vision** | VISION, WHY, IS_NOT, Target profile, Non-goals | — | — |
| **10–11 Arch** | Overview, Boundary, Offline, Edge, C4, ADRs | — | — |
| **60 Ops** | DEPLOYMENT, SLO_SLI, RUNBOOKS, BACKUP_RESTORE | — | SLO monitorados (instrumentação) |
| **70 Product** | PRDs + User journeys | — | — |
| **80 Testing** | Load scenarios, Chaos cases, Release checklist | — | — |

**Resumo:** Onda 1 = documento; Onda 2 = Sprint A (Compliance); Onda 3 = Sprint B (Security) + Sprint C (Data) + SLO em produção.

---

## 4. Baseline Livro v1 (congelar 2026)

**O que é:** Primeira versão oficial do Livro de Arquitetura ChefIApp™, referência para auditoria, due diligence e evolução.

**Quando congelar:** No fim da **Onda 1 (30 dias)**, quando todos os docs da Fase 1 do [GAP_CLOSURE_ROADMAP.md](./GAP_CLOSURE_ROADMAP.md) estiverem criados ou consolidados.

**Conteúdo do baseline:**

- Índice canónico do Livro (secções 00, 10, 11, 20, 30, 40, 50, 60, 70, 80).
- Um documento ou pasta por secção (ou link para doc existente).
- Tabela **Estado por secção** com badge:
  - ✅ Implementado
  - 🟡 Especificado
  - 🔴 Necessita engenharia
- Data de congelação e versão: **Livro v1 — baseline 2026 (YYYY-MM-DD)**.

**Onde registar:** No próprio índice do Livro ou em `docs/` um ficheiro `LIVRO_ARQUITETURA_INDEX.md` (ou equivalente) com data e versão.

**Após congelação:** Alterações ao Livro = nova versão ou changelog; sprints de engenharia (Ondas 2 e 3) passam a referenciar “conforme Livro v1”.

---

## 5. Resumo executivo

| Movimento | Prazo | Resultado |
|-----------|--------|------------|
| **1. Fechar livro no papel** | 30 dias | 42 itens doc; Livro v1 congelado; badges por secção |
| **2. Classificar gaps** | Incluído em 1 | Tabela 🟢🟡🔴 por item (esta secção 1) |
| **3. Ondas 30/60/90** | 90 dias | Onda 1 doc; Onda 2 Sprint A; Onda 3 Sprints B+C + SLO |
| **4. Mapa arch → sprints** | Referência | Secção 3 deste plano |
| **5. Baseline Livro v1** | Fim Onda 1 | Índice + Estado por secção + data de congelação |

Referências: [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md) · [GAP_CLOSURE_ROADMAP.md](./GAP_CLOSURE_ROADMAP.md).
