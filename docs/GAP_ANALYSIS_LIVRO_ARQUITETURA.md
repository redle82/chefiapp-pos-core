# GAP ANALYSIS — LIVRO DE ARQUITETURA vs REPO CHEFIAPP™

**Data:** 31 de Janeiro de 2026  
**Produto:** ChefIApp™  
**Propósito:** Comparar o alvo arquitetural 2026 (Livro de Arquitetura) com o estado actual do repositório ChefIApp, identificando o que está **Coberto**, **Parcial** ou **Em falta**, por secção. Este documento é um artefacto de referência para priorização de documentação e evolução.

---

## Legenda

- **Coberto** — Existe no repositório com função equivalente clara
- **Parcial** — Existe conteúdo relevante, mas disperso, incompleto ou fora do formato esperado
- **Em falta** — Não existe documento ou equivalente funcional
- **N/A** — Não aplicável ao ChefIApp (quando pertinente)

---

## 00 — Vision (Visão e limites)

| Documento alvo               | Equivalente actual no repo                                    | Gap                         | Nota |
|-----------------------------|----------------------------------------------------------------|-----------------------------|------|
| VISION.md                   | [docs/CORE_LEVEL_3_VISION.md](docs/CORE_LEVEL_3_VISION.md)     | Parcial                     | Visão de nível 3 existe; formato "vision doc" único pode diferir |
| WHY_CHEFIAPP_EXISTS.md      | Conteúdo disperso (PITCH*, LANCAMENTO*, docs/strategy/)        | Parcial                     | —    |
| WHAT_CHEFIAPP_IS_NOT.md     | Implícito em contratos (não é TPV, etc.)                      | Em falta                    | Em falta como doc dedicado |
| TARGET_RESTAURANT_PROFILE.md | docs/strategy/, docs/Commercial/, docs/sales/                   | Parcial                     | —    |
| NON_GOALS.md                | SCOPE_FREEZE, NON_GOALS em vários docs                         | Parcial / disperso          | —    |

---

## 10 — Architecture (Arquitetura real)

| Documento alvo                           | Equivalente actual no repo                                                                                                                                 | Gap                             | Nota |
|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------|------|
| ARCHITECTURE_OVERVIEW.md                 | [docs/architecture/CORE_SYSTEM_OVERVIEW.md](docs/architecture/CORE_SYSTEM_OVERVIEW.md), [docs/architecture/ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](docs/architecture/ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) | Coberto / Parcial               | —    |
| C4_CONTEXT / C4_CONTAINER / C4_COMPONENT | Diagramas em ROUTES_AND_BOOT_DIAGRAM, NOW_ENGINE_DIAGRAM; não C4 formal                                                                                      | Em falta (C4 explícito)         | —    |
| BOUNDARY_CONTEXTS.md                     | Contratos por domínio em docs/architecture/ (CORE*, MENU*, etc.)                                                                                            | Parcial                         | Sem doc de "boundary contexts" único |
| MULTI_TENANCY_MODEL.md                   | [docs/architecture/MULTI_TENANT_ARCHITECTURE.md](docs/architecture/MULTI_TENANT_ARCHITECTURE.md)                                                             | Coberto                         | —    |
| OFFLINE_STRATEGY.md                      | B1/B2/B4 containment, MENU_FALLBACK_CONTRACT                                                                                                                 | Parcial                         | Sem doc de estratégia offline único |
| EDGE_CASES.md                            | CORE_FAILURE_MODEL, OPERATIONAL_UI_RESILIENCE                                                                                                               | Parcial                         | —    |

---

## 11 — Architecture decisions (ADRs)

| Documento alvo                                                                                                 | Equivalente actual no repo                                                                                                                                     | Gap                                                                         |
|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| ADR-001 a ADR-005 (ex.: Why-Not-TPV, Orchestration-Layer, Offline-First, Event-Based-Ops, Gamification-Safety) | [docs/architecture/ARCHITECTURE_DECISION_RECORDS.md](docs/architecture/ARCHITECTURE_DECISION_RECORDS.md) (ADR em ficheiro único); archive/ADR001, ADR002       | Parcial                                                                     | ADRs num ficheiro; livro pede ADR por decisão em pasta decisions/ |

---

## 20 — Domains (Domínios como mini-produto)

| Documento alvo                                                                                                                                     | Equivalente actual no repo                                                                                                                                       | Gap                                                                                                  |
|----------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| identity-access/, organization-locations/, tasks-engine/, shifts-time/, ops-signals/, notifications/, gamification/, analytics/, compliance-audit/ (cada um com README, DATA_MODEL, EVENTS, RULES, FAILURE_MODES) | Contratos em docs/architecture/ (AUTH*, PORTAL*, CORE*TASK*, CASH*REGISTER*, etc.); docs/product/ (GLOBAL_UI_STATE_MAP); sem pastas por domínio com esse padrão   | Em falta                                                                                             | Estrutura por domínio com README + DATA_MODEL + EVENTS + RULES + FAILURE_MODES não existe |

---

## 30 — Data (Event taxonomy, métricas, lineage, retenção)

| Documento alvo        | Equivalente actual no repo                                                                                     | Gap         |
|-----------------------|----------------------------------------------------------------------------------------------------------------|-------------|
| EVENT_TAXONOMY.md     | Eventos implícitos em contratos/core; não há taxonomia central                                                 | Em falta    |
| METRICS_DICTIONARY.md | MONITORING_LOGGING, dashboards; não dicionário de métricas                                                     | Em falta    |
| DATA_LINEAGE.md       | —                                                                                                              | Em falta    |
| RETENTION_POLICY.md   | [docs/architecture/CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](docs/architecture/CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) | Parcial     |
| EXPORT_FORMATS.md     | —                                                                                                              | Em falta    |
| ANOMALY_DEFINITION.md | —                                                                                                              | Em falta    |

---

## 40 — Security (Threat model, ASVS, audit)

| Documento alvo           | Equivalente actual no repo                                                                     | Gap                                                                 |
|--------------------------|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| THREAT_MODEL.md          | —                                                                                               | Em falta                                                            |
| OWASP_ASVS_CHECKLIST.md  | —                                                                                               | Em falta                                                            |
| ACCESS_CONTROL_MATRIX.md | [docs/security/TENANT_ISOLATION_SECURITY_MODEL.md](docs/security/TENANT_ISOLATION_SECURITY_MODEL.md) | Parcial                                                             |
| AUDIT_LOG_SPEC.md        | CORE contracts, CONTRACT_ENFORCEMENT; não spec de audit log                                     | Parcial / em falta                                                  |
| INCIDENT_RESPONSE.md     | [docs/ops/INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](docs/ops/INCIDENT_PLAYBOOK_STOLEN_DEVICE.md)       | Parcial                                                             | Um playbook; não plano geral de resposta a incidentes |

---

## 50 — Compliance (GDPR, fiscal, export)

| Documento alvo            | Equivalente actual no repo                                                       | Gap         |
|---------------------------|-----------------------------------------------------------------------------------|-------------|
| GDPR_MAPPING.md           | —                                                                                 | Em falta    |
| DATA_SUBJECT_REQUESTS.md  | —                                                                                 | Em falta    |
| WORK_LOG_EXPORT.md        | —                                                                                 | Em falta    |
| FISCAL_POSITIONING.md     | Referências a RD 1007/2023, AEAT no texto do utilizador; não doc no repo           | Em falta    |
| WHAT_WE_DO_NOT_PROCESS.md | —                                                                                 | Em falta    |

---

## 60 — Operations (Deploy, SLO, runbooks)

| Documento alvo       | Equivalente actual no repo                                                                                                                                 | Gap      |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| DEPLOYMENT.md        | [docs/architecture/DEPLOYMENT_GUIDE.md](docs/architecture/DEPLOYMENT_GUIDE.md), [docs/ops/provisioning.md](docs/ops/provisioning.md)                         | Parcial  |
| ROLLBACK_PLAN.md     | [docs/ops/rollback-checklist.md](docs/ops/rollback-checklist.md), [docs/ops/rollback-procedure.md](docs/ops/rollback-procedure.md)                         | Coberto  |
| BACKUP_RESTORE.md    | [docs/ops/disaster-recovery.md](docs/ops/disaster-recovery.md)                                                                                             | Parcial  |
| DISASTER_RECOVERY.md | [docs/ops/disaster-recovery.md](docs/ops/disaster-recovery.md)                                                                                              | Coberto  |
| SLO_SLI.md           | —                                                                                                                                                           | Em falta |
| RUNBOOKS.md          | docs/ops/ (alerts, health-checks, rollback, INCIDENT_PLAYBOOK); não índice RUNBOOKS                                                                          | Parcial  |

---

## 70 — Product (PRDs, user journeys)

| Documento alvo                                                     | Equivalente actual no repo                                                                                | Gap                 |
|--------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|---------------------|
| PRD_TASKS.md, PRD_SHIFTS.md, PRD_ALERTS.md, PRD_OWNER_DASHBOARD.md | docs/product/ (KDS, GLOBAL_UI_STATE_MAP, FLUXO_FELIZ); docs/strategy/ (checklists); não PRDs por módulo   | Parcial / em falta  |
| USER_JOURNEYS.md                                                   | CAMINHO_DO_CLIENTE, CUSTOMER_JOURNEY_MAP                                                                   | Parcial             |

---

## 80 — Testing (Estratégia, carga, caos, release)

| Documento alvo       | Equivalente actual no repo                                                         | Gap      |
|----------------------|-------------------------------------------------------------------------------------|----------|
| TEST_STRATEGY.md     | [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md), [docs/testing/](docs/testing/) | Coberto  |
| LOAD_SCENARIOS.md    | —                                                                                   | Em falta |
| CHAOS_CASES.md       | —                                                                                   | Em falta |
| RELEASE_CHECKLIST.md | GO_LIVE_CHECKLIST, rollback-checklist; não checklist de release genérico           | Parcial  |

---

## Resumo executivo

**Contagem:** Número de itens por estado e por secção.

| Secção | Coberto | Parcial | Em falta |
|--------|---------|---------|----------|
| 00 Vision | 0 | 4 | 1 |
| 10 Architecture | 2 | 4 | 1 |
| 11 ADRs | 0 | 1 | 0 |
| 20 Domains | 0 | 0 | 1 |
| 30 Data | 0 | 1 | 5 |
| 40 Security | 0 | 2 | 3 |
| 50 Compliance | 0 | 0 | 5 |
| 60 Operations | 2 | 3 | 1 |
| 70 Product | 0 | 2 | 0 |
| 80 Testing | 1 | 1 | 2 |
| **Total** | **5** | **18** | **19** |

**Prioridade sugerida (1–3 frases):** Preencher primeiro **50-Compliance** e **40-Security** se houver pressão regulatória ou defesa legal; em seguida **30-Data** e **20-Domains** se a prioridade for evolução interna, observabilidade e clareza por domínio.
