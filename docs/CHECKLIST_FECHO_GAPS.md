# Checklist de Fecho de GAP — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) · [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md)  
**Propósito:** Painel de controlo do progresso; cada GAP com estado, dono e prova. Atualizar à medida que a Onda 1 (e 2/3) avança.

---

## Legenda de estado

| Badge | Estado | Critério |
|-------|--------|----------|
| 🟢 | **Fechado** | Doc canónico existe e validado; quando aplicável, capacidade implementada e utilizável |
| 🟡 | **Parcial** | Doc existe e validado; implementação pendente ou parcial |
| 🔴 | **Aberto** | Falta doc canónico ou falta implementação onde o doc já exige capacidade operacional |

**Dono:** Responsável pelo fecho. **Prova:** Link para doc ou evidência (teste, export, trilha).

---

## Checklist por secção (00 → 80)

### 00 — Vision

| GAP | Estado | Dono | Prova | Notas |
|-----|--------|------|-------|-------|
| VISION.md | 🟡 | — | docs/VISION.md | Doc canónico consolidado |
| WHY_CHEFIAPP_EXISTS.md | 🟡 | — | docs/WHY_CHEFIAPP_EXISTS.md | Doc canónico consolidado |
| WHAT_CHEFIAPP_IS_NOT.md | 🟡 | — | docs/WHAT_CHEFIAPP_IS_NOT.md | Limites explícitos; link WHAT_WE_DO_NOT_PROCESS |
| TARGET_RESTAURANT_PROFILE.md | 🟡 | — | docs/TARGET_RESTAURANT_PROFILE.md | Doc canónico consolidado |
| NON_GOALS.md | 🟡 | — | docs/NON_GOALS.md | Consolidado SCOPE_FREEZE, NON_GOALS |

---

### 10 — Architecture

| GAP | Estado | Dono | Prova | Notas |
|-----|--------|------|-------|-------|
| ARCHITECTURE_OVERVIEW.md | 🟡 | — | docs/ARCHITECTURE_OVERVIEW.md | AS-IS + to-be consolidado; referência Livro §10 |
| C4_CONTEXT.md | 🟡 | — | docs/architecture/C4_CONTEXT.md | Diagrama C4 Context (Mermaid) |
| C4_CONTAINER.md | 🟡 | — | docs/architecture/C4_CONTAINER.md | Diagrama C4 Container |
| C4_COMPONENT.md | 🟡 | — | docs/architecture/C4_COMPONENT.md | Diagrama C4 Component (Merchant Portal) |
| BOUNDARY_CONTEXTS.md | 🟡 | — | docs/architecture/BOUNDARY_CONTEXTS.md | Doc único + links CORE*, MENU*, operacionais |
| MULTI_TENANCY_MODEL.md | 🟢 | — | docs/MULTI_TENANT_ARCHITECTURE.md | Coberto |
| OFFLINE_STRATEGY.md | 🟡 | — | docs/architecture/OFFLINE_STRATEGY.md | Consolidado B1/B2/B4, MENU_FALLBACK_CONTRACT |
| EDGE_CASES.md | 🟡 | — | docs/architecture/EDGE_CASES.md | Consolidado CORE_FAILURE_MODEL, OPERATIONAL_UI_RESILIENCE |

---

### 11 — ADRs

| GAP | Estado | Dono | Prova | Notas |
|-----|--------|------|-------|-------|
| ADR-001 a ADR-005 | 🟡 | — | docs/architecture/ARCHITECTURE_DECISION_RECORDS.md | ADR-001 a ADR-010; secção "Como usar" + link CORE_DECISION_LOG |

---

### 20 — Domains

| GAP | Estado | Dono | Prova | Notas |
|-----|--------|------|-------|-------|
| Domínios e Contratos (índice + 9 domínios) | 🟡 | — | docs/architecture/DOMINIOS_E_CONTRATOS.md | Índice com secção por domínio e links para contracts |
| identity-access/ | 🟡 | — | Secção 2.1 em DOMINIOS_E_CONTRATOS.md | — |
| organization-locations/ | 🟡 | — | Secção 2.2 em DOMINIOS_E_CONTRATOS.md | — |
| tasks-engine/ | 🟡 | — | Secção 2.3 em DOMINIOS_E_CONTRATOS.md | — |
| shifts-time/ | 🟡 | — | Secção 2.4 em DOMINIOS_E_CONTRATOS.md | — |
| ops-signals/ | 🟡 | — | Secção 2.5 em DOMINIOS_E_CONTRATOS.md | — |
| notifications/ | 🟡 | — | Secção 2.6 em DOMINIOS_E_CONTRATOS.md | — |
| gamification/ | 🟡 | — | Secção 2.7 em DOMINIOS_E_CONTRATOS.md | — |
| analytics/ | 🟡 | — | Secção 2.8 em DOMINIOS_E_CONTRATOS.md | — |
| compliance-audit/ | 🟡 | — | Secção 2.9 em DOMINIOS_E_CONTRATOS.md | — |

---

### 30 — Data

| GAP | Estado | Dono | Prova | Notas |
|-----|--------|------|-------|-------|
| EVENT_TAXONOMY.md | 🟢 | — | docs/architecture/EVENT_TAXONOMY.md | Onda 2: eventos order_created, payment_recorded, user_disabled, user_reenabled, export_requested, shift_started, shift_ended em gm_audit_logs |
| METRICS_DICTIONARY.md | 🟢 | — | docs/architecture/METRICS_DICTIONARY.md | Onda 2: RPC get_operational_metrics; ver docs/ops/DASHBOARD_METRICS.md |
| DATA_LINEAGE.md | 🟢 | — | docs/architecture/DATA_LINEAGE.md | Onda 3 H1/H2: §3 tabelas→fontes→consumidores; processo §5.1 + scripts/lineage-check.sh |
| RETENTION_POLICY.md | 🟡 | — | docs/architecture/RETENTION_POLICY.md | Doc canónico consolidado |
| EXPORT_FORMATS.md | 🟢 | — | docs/architecture/EXPORT_FORMATS.md | Onda 2: get_work_log_export (JSON v1), get_dsr_access_export (JSON dsr_access_v1) |
| ANOMALY_DEFINITION.md | 🟢 | — | docs/architecture/ANOMALY_DEFINITION.md | Onda 3 G3: regras em docs/ops/alerts.md §G3 |

---

### 40 — Security

| GAP | Estado | Dono | Prova | Notas |
|-----|--------|------|-------|-------|
| THREAT_MODEL.md | 🟢 | — | docs/architecture/THREAT_MODEL.md | Onda 3 E1: THREAT_MODEL_MITIGATION_MATRIX; E2 validação/rate limit doc |
| OWASP_ASVS_CHECKLIST.md | 🟢 | — | docs/architecture/OWASP_ASVS_CHECKLIST.md | Onda 3 E3: coluna Evidência; 7.3.1 ✅ |
| ACCESS_CONTROL_MATRIX.md | 🟡 | — | docs/architecture/ACCESS_CONTROL_MATRIX.md | Doc criado; expande TENANT_ISOLATION |
| AUDIT_LOG_SPEC.md | 🟢 | — | docs/architecture/AUDIT_LOG_SPEC.md | Onda 2 + Onda 3 F1–F3: auth (login_success/failure/logout), caixa (triggers), purge runbook; get_audit_logs, Realtime |
| INCIDENT_RESPONSE.md | 🟡 | — | docs/ops/INCIDENT_RESPONSE.md | Doc criado; generaliza stolen-device |

---

### 50 — Compliance

| GAP | Estado | Dono | Prova | Notas |
|-----|--------|------|-------|-------|
| GDPR_MAPPING.md | 🟡 | — | docs/architecture/GDPR_MAPPING.md | Doc criado; pendente revisão jurídica/DPO |
| DATA_SUBJECT_REQUESTS.md | 🟢 | — | docs/architecture/DATA_SUBJECT_REQUESTS.md | Onda 2: gm_dsr_requests, get_dsr_access_export, create_dsr_request; docs/ops/DSR_RUNBOOK.md |
| WORK_LOG_EXPORT.md | 🟢 | — | docs/architecture/WORK_LOG_EXPORT.md | Onda 2: RPC get_work_log_export (JSON work_log_v1); docs/ops/WORK_LOG_EXPORT_RUNBOOK.md |
| FISCAL_POSITIONING.md | 🟡 | — | docs/architecture/FISCAL_POSITIONING.md | Doc criado; pendente revisão jurídica/fiscal |
| WHAT_WE_DO_NOT_PROCESS.md | 🟡 | — | docs/architecture/WHAT_WE_DO_NOT_PROCESS.md | Doc criado; pendente revisão jurídica/DPO |

---

### 60 — Operations

| GAP | Estado | Dono | Prova | Notas |
|-----|--------|------|-------|-------|
| DEPLOYMENT.md | 🟡 | — | docs/ops/DEPLOYMENT.md | Consolidado DEPLOYMENT_GUIDE, deployment.md, provisioning |
| ROLLBACK_PLAN.md | 🟢 | — | ops/rollback-checklist.md, rollback-procedure.md | Coberto |
| BACKUP_RESTORE.md | 🟡 | — | docs/ops/BACKUP_RESTORE.md | Detalhado a partir de disaster-recovery |
| DISASTER_RECOVERY.md | 🟢 | — | ops/disaster-recovery.md | Coberto |
| SLO_SLI.md | 🟢 | — | docs/architecture/SLO_SLI.md | Onda 3 G2: §2.1 SLO concretos (números e janelas); métricas expostas |
| RUNBOOKS.md | 🟢 | — | docs/ops/RUNBOOKS.md | Índice ops/*; Onda 3: purge audit (AUDIT_LOG_PURGE_RUNBOOK), event pipeline (EVENT_PIPELINE) |

---

### 70 — Product

| GAP | Estado | Dono | Prova | Notas |
|-----|--------|------|-------|-------|
| PRD_TASKS.md | 🟡 | — | docs/product/PRD_TASKS.md | PRD formalizado (CORE_TASK_SYSTEM, KDS, checklists) |
| PRD_SHIFTS.md | 🟡 | — | docs/product/PRD_SHIFTS.md | PRD formalizado (GLOBAL_UI_STATE_MAP, turno, caixa) |
| PRD_ALERTS.md | 🟡 | — | docs/product/PRD_ALERTS.md | PRD estruturado (alerts, governança, silêncio/ruído) |
| PRD_OWNER_DASHBOARD.md | 🟡 | — | docs/product/PRD_OWNER_DASHBOARD.md | PRD requisitos e fluxos (READY_TO_PUBLISH, dashboard) |
| USER_JOURNEYS.md | 🟡 | — | docs/product/USER_JOURNEYS.md | Consolidado CAMINHO_DO_CLIENTE + CUSTOMER_JOURNEY_MAP |

---

### 80 — Testing

| GAP | Estado | Dono | Prova | Notas |
|-----|--------|------|-------|-------|
| TEST_STRATEGY.md | 🟢 | — | TESTING_STRATEGY.md, testing/ | Coberto |
| LOAD_SCENARIOS.md | 🟡 | — | docs/testing/LOAD_SCENARIOS.md | Cenários A–D; regras; métricas; ref. SIMULATION_RULES, STRESS_TEST |
| CHAOS_CASES.md | 🟡 | — | docs/testing/CHAOS_CASES.md | Casos Core down, crash /op/, auth, constraint; ref. EDGE_CASES, OFFLINE_STRATEGY |
| RELEASE_CHECKLIST.md | 🟡 | — | docs/testing/RELEASE_CHECKLIST.md | Pré-release, build, deploy, pós-release, smoke; ref. GO_LIVE, rollback |

---

## Resumo (atualizar conforme fecho)

| Estado | Quantidade | Nota |
|--------|------------|------|
| 🟢 Fechado | 16 | Onda 1–2: MULTI_TENANCY, ROLLBACK_PLAN, DISASTER_RECOVERY, TEST_STRATEGY, EVENT_TAXONOMY, METRICS_DICTIONARY, EXPORT_FORMATS, AUDIT_LOG_SPEC, DATA_SUBJECT_REQUESTS, WORK_LOG_EXPORT; Onda 3: DATA_LINEAGE, ANOMALY_DEFINITION, THREAT_MODEL, OWASP_ASVS_CHECKLIST, SLO_SLI, RUNBOOKS |
| 🟡 Parcial | 41 | 00 (5) + 10 (8) + 11 (1) + 20 (10) + 30 (3) + 40 (3) + 50 (3) + 60 (5) + 70 (5) + 80 (3): docs canónicos; refinamentos conforme prioridade |
| 🔴 Aberto | 0 | Onda 1 (doc/spec) concluída; Onda 2 concluída 1 Fev 2026; Onda 3 concluída (E1–H2) |

**Onda 1 concluída (1 Fev 2026):** Todos os documentos canónicos da Onda 1 foram criados. Ver [LIVRO_ARQUITETURA_INDEX.md](./LIVRO_ARQUITETURA_INDEX.md) — Estado por secção.

**Onda 2 concluída (1 Fev 2026):** Audit log (A1–A3), export work log (B1–B2), DSR (C1, C3, C4), eventos/métricas (D1–D3) implementados. Ver [ONDA_2_TAREFAS_60_DIAS.md](./ONDA_2_TAREFAS_60_DIAS.md).

**Onda 3 concluída:** Security (E1–E3), Audit alargado (F1–F3), Pipeline/SLO/alertas/dashboard (G1–G4), DATA_LINEAGE (H1–H2). Ver [ONDA_3_TAREFAS_90_DIAS.md](./ONDA_3_TAREFAS_90_DIAS.md).

**Próximo passo:** Refinamentos (C2, jurídico/DPO onde 🟡) ou próxima onda/roadmap; manter checklist atualizado ao fechar capacidade.

**Referências:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) · [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md).
