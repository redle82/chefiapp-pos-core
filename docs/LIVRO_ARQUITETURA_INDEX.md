# Livro de Arquitetura ChefIApp™ — Índice e Baseline

**Versão:** v2026.1 (baseline)  
**Data de congelação:** 1 de Fevereiro de 2026  
**Produto:** ChefIApp™  
**Onda 1 (30 dias):** Concluída em 1 de Fevereiro de 2026 — todos os documentos canónicos da Onda 1 criados.  
**Onda 2 (31–60 dias):** Concluída em 1 de Fevereiro de 2026 — audit log (A1–A3), export work log (B1–B2), DSR (C1, C3, C4), eventos/métricas (D1–D3) implementados; ver [ONDA_2_TAREFAS_60_DIAS.md](./ONDA_2_TAREFAS_60_DIAS.md).

Este documento declara o **baseline arquitectural 2026** e serve de referência para auditoria, due diligence e evolução do sistema. Toda a alteração ao Livro deve referenciar este índice e o [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md).

---

## Documentos de referência

| Documento | Propósito |
|-----------|-----------|
| [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md) | Estado actual vs alvo 2026; lacunas por secção |
| [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) | Roadmap estratégico e técnico; ondas 30/60/90 dias |
| [GAP_CLOSURE_ROADMAP.md](./GAP_CLOSURE_ROADMAP.md) | Ordem de execução (42 itens); fases doc e engenharia |
| [ONDA_1_TAREFAS_30_DIAS.md](./ONDA_1_TAREFAS_30_DIAS.md) | Tarefas técnicas da Onda 1 (sprint/backlog) |
| [CHECKLIST_FECHO_GAPS.md](./CHECKLIST_FECHO_GAPS.md) | Painel de controlo: estado 🟢🟡🔴 por GAP |
| [REGRAS_ARQUITETURA_VIVA.md](./REGRAS_ARQUITETURA_VIVA.md) | Regras de governança: como usar baseline e roadmap |
| [ONDA_2_TAREFAS_60_DIAS.md](./ONDA_2_TAREFAS_60_DIAS.md) | Tarefas de engenharia Onda 2 (31–60 dias): audit log, export, DSR, instrumentação |

---

## Índice canónico do Livro (secções 00–80)

Cada secção corresponde a um bloco do Livro de Arquitetura. O **Estado** indica o nível de fecho (✅ Implementado, 🟡 Especificado, 🔴 Necessita engenharia). Atualizar conforme [CHECKLIST_FECHO_GAPS.md](./CHECKLIST_FECHO_GAPS.md).

| Secção | Nome | Documento(s) canónico(s) | Estado |
|--------|------|---------------------------|--------|
| **00** | Vision (Visão e Limites) | VISION.md, WHY_CHEFIAPP_EXISTS.md, WHAT_CHEFIAPP_IS_NOT.md, TARGET_RESTAURANT_PROFILE.md, NON_GOALS.md | 🟡 |
| **10** | Architecture (Arquitetura Real) | ARCHITECTURE_OVERVIEW.md, BOUNDARY_CONTEXTS.md, OFFLINE_STRATEGY.md, EDGE_CASES.md, C4_*.md; MULTI_TENANT_ARCHITECTURE.md (✅) | 🟡 (✅ multi-tenancy) |
| **11** | Architecture Decisions (ADRs) | ARCHITECTURE_DECISION_RECORDS.md + CORE_DECISION_LOG.md | 🟡 |
| **20** | Domains (Domínios e Contratos) | DOMINIOS_E_CONTRATOS.md (índice + 9 domínios) | 🟡 |
| **30** | Data (Eventos, Métricas, Lineage) | EVENT_TAXONOMY.md, METRICS_DICTIONARY.md, RETENTION_POLICY.md, EXPORT_FORMATS.md, DATA_LINEAGE.md, ANOMALY_DEFINITION.md | 🟡 |
| **40** | Security | THREAT_MODEL.md, OWASP_ASVS_CHECKLIST.md, ACCESS_CONTROL_MATRIX.md, AUDIT_LOG_SPEC.md, INCIDENT_RESPONSE.md | 🟡 |
| **50** | Compliance (GDPR, Fiscal) | GDPR_MAPPING.md, DATA_SUBJECT_REQUESTS.md, WORK_LOG_EXPORT.md, FISCAL_POSITIONING.md, WHAT_WE_DO_NOT_PROCESS.md | 🟡 |
| **60** | Operations (DevOps / SRE) | DEPLOYMENT.md, SLO_SLI.md, RUNBOOKS.md, BACKUP_RESTORE.md; ROLLBACK_PLAN, DISASTER_RECOVERY (✅) | 🟡 (✅ rollback, DR) |
| **70** | Product | PRD_TASKS.md, PRD_SHIFTS.md, PRD_ALERTS.md, PRD_OWNER_DASHBOARD.md, USER_JOURNEYS.md | 🟡 |
| **80** | Testing | LOAD_SCENARIOS.md, CHAOS_CASES.md, RELEASE_CHECKLIST.md; TEST_STRATEGY (✅) | 🟡 (✅ test strategy) |

**Legenda Estado:**  
- **✅ Implementado** — Existe no sistema e documentado.  
- **🟡 Especificado** — Doc canónico existe (Onda 1); implementação parcial ou planeada (Ondas 2/3).  
- **🔴 Necessita engenharia** — Requisito claro no papel; sistema ainda não cumpre.

---

## Estado por secção (resumo) — Onda 1 concluída (1 Fev 2026)

| Secção | Estado global | Nota |
|--------|----------------|------|
| 00 Vision | 🟡 | Docs canónicos criados; revisão/implementação onde aplicável |
| 10 Architecture | 🟡 (✅ multi-tenancy) | ARCHITECTURE_OVERVIEW, BOUNDARY_CONTEXTS, OFFLINE_STRATEGY, EDGE_CASES, C4_* criados |
| 11 ADRs | 🟡 | ARCHITECTURE_DECISION_RECORDS (ADR-001 a 010) + link CORE_DECISION_LOG |
| 20 Domains | 🟡 | DOMINIOS_E_CONTRATOS (índice + 9 domínios) |
| 30 Data | 🟡 | EVENT_TAXONOMY, METRICS_DICTIONARY, RETENTION_POLICY, EXPORT_FORMATS, DATA_LINEAGE, ANOMALY_DEFINITION; instrumentação Onda 3 |
| 40 Security | 🟡 | THREAT_MODEL, OWASP_ASVS, ACCESS_CONTROL_MATRIX, AUDIT_LOG_SPEC, INCIDENT_RESPONSE; controles Onda 2/3 |
| 50 Compliance | 🟡 | GDPR_MAPPING, DATA_SUBJECT_REQUESTS, WORK_LOG_EXPORT, FISCAL_POSITIONING, WHAT_WE_DO_NOT_PROCESS; implementação Onda 2 |
| 60 Operations | 🟡 (✅ rollback, DR) | DEPLOYMENT, SLO_SLI, RUNBOOKS, BACKUP_RESTORE criados |
| 70 Product | 🟡 | PRD_TASKS, PRD_SHIFTS, PRD_ALERTS, PRD_OWNER_DASHBOARD, USER_JOURNEYS |
| 80 Testing | 🟡 (✅ test strategy) | LOAD_SCENARIOS, CHAOS_CASES, RELEASE_CHECKLIST criados |

---

## Regras após congelação

1. **Alterações ao Livro** — Nova versão ou changelog; referenciar este índice.
2. **Sprints de engenharia (Ondas 2 e 3)** — Referenciar “conforme Livro v1” e [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md).
3. **Novas features** — Indicar qual GAP fecha (ou qual novo GAP cria); ver [REGRAS_ARQUITETURA_VIVA.md](./REGRAS_ARQUITETURA_VIVA.md).

---

**ChefIApp Architecture Baseline — v2026.1**  
*Fim do índice.*
