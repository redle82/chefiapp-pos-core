# Roadmap de Fecho de Gaps — Livro de Arquitetura ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md)  
**Propósito:** Ordem de execução para fechar as lacunas do Livro de Arquitetura. Cada item tem tipo (A/B/C) e fase (doc vs engenharia).

---

## Legenda

### Tipo de lacuna

| Tipo | Significado | Acção principal |
|------|-------------|------------------|
| **A** | Existe, mas disperso | Consolidar, dar nome oficial, 1 doc canónico, links |
| **B** | Não existe, mas podemos criar como documento | Pensar e escrever; não exige código |
| **C** | Não existe porque o sistema ainda não faz | Fechamento real exige engenharia; doc pode ser especificação + plano |

### Badge por secção (após execução)

| Badge | Significado |
|-------|-------------|
| ✅ **Implementado** | Existe no sistema e documentado |
| 🟡 **Especificado** | Documento de referência/requisito; implementação pendente ou parcial |
| 🔴 **Necessita engenharia** | Requer desenvolvimento/infra para fechar de verdade |

---

## Ordem de prioridade (execução)

Prioridade geral: **50 Compliance → 40 Security → 30 Data → 20 Domains → 00 Vision → 10–11 Arch → 60 Ops → 70 Product → 80 Testing.**  
Dentro de cada bloco: primeiro documentação (A/B), depois itens que exigem engenharia (C).

---

### Fase 1 — Fechar o livro no papel (documentação)

Executar na ordem abaixo. Itens **A** e **B** = só escrita/consolidação. Itens **C** = escrever como *especificação + plano de implementação*.

| # | Secção | Documento / Entrega | Tipo | Nota |
|---|--------|---------------------|------|------|
| 1 | 50 | GDPR_MAPPING.md | B | Mapeamento dados pessoais, bases legais, retenção |
| 2 | 50 | WHAT_WE_DO_NOT_PROCESS.md | B | Defesa legal; o que não processamos |
| 3 | 50 | DATA_SUBJECT_REQUESTS.md | B | Processo DSR (acesso, retificação, apagamento, portabilidade) |
| 4 | 50 | FISCAL_POSITIONING.md | B | RD 1007/2023, AEAT, posicionamento fiscal |
| 5 | 50 | WORK_LOG_EXPORT.md | B+C | Especificação do export; implementação = C |
| 6 | 40 | THREAT_MODEL.md | B | Ameaças, ativos, mitigações |
| 7 | 40 | OWASP_ASVS_CHECKLIST.md | B | Checklist adaptado ao ChefIApp |
| 8 | 40 | ACCESS_CONTROL_MATRIX.md | A | Expandir TENANT_ISOLATION; matriz roles/recurso |
| 9 | 40 | AUDIT_LOG_SPEC.md | B+C | Spec formal; trilha imutável = engenharia |
| 10 | 40 | INCIDENT_RESPONSE.md | A | Generalizar a partir de stolen-device; processo geral |
| 11 | 30 | EVENT_TAXONOMY.md | B | Taxonomia central a partir dos contracts |
| 12 | 30 | METRICS_DICTIONARY.md | B | Métricas formais (nome, definição, SLI) |
| 13 | 30 | RETENTION_POLICY.md | A | Doc canónico a partir de CORE_DATA_RETENTION |
| 14 | 30 | EXPORT_FORMATS.md | B+C | v1: csv/json; export real = C |
| 15 | 30 | DATA_LINEAGE.md | B+C | “Manual + futuro pipeline”; pipeline = C |
| 16 | 30 | ANOMALY_DEFINITION.md | B | O que conta como anomalia para alertas |
| 17 | 20 | Domínios: secção única “Domínios e Contratos” | A | README por domínio (identity-access, organization-locations, tasks-engine, shifts-time, ops-signals, notifications, gamification, analytics, compliance-audit) com links para contracts |
| 18 | 00 | VISION.md (doc único) | A | Consolidar CORE_LEVEL_3_VISION + formato clássico |
| 19 | 00 | WHY_CHEFIAPP_EXISTS.md | A | Consolidar PITCH*, LANCAMENTO*, strategy |
| 20 | 00 | WHAT_CHEFIAPP_IS_NOT.md | B | Limites explícitos (não é TPV genérico, não é ERP) |
| 21 | 00 | TARGET_RESTAURANT_PROFILE.md | A | Consolidar strategy, Commercial, sales |
| 22 | 00 | NON_GOALS.md | A | Consolidar SCOPE_FREEZE, NON_GOALS |
| 23 | 10 | ARCHITECTURE_OVERVIEW.md | A | Consolidar AS-IS + visão to-be |
| 24 | 10 | BOUNDARY_CONTEXTS.md | A | Doc único com links para CORE*, MENU*, etc. |
| 25 | 10 | OFFLINE_STRATEGY.md | A | Consolidar B1/B2/B4, MENU_FALLBACK_CONTRACT |
| 26 | 10 | EDGE_CASES.md | A | Consolidar CORE_FAILURE_MODEL, OPERATIONAL_UI_RESILIENCE |
| 27 | 10 | C4_CONTEXT.md | B | Diagrama C4 Context (ex.: Mermaid) |
| 28 | 10 | C4_CONTAINER.md | B | Diagrama C4 Container |
| 29 | 10 | C4_COMPONENT.md | B | Diagrama C4 Component (onde fizer sentido) |
| 30 | 11 | ADRs (doc único ou secções por ADR) | A | Manter/expandir ARCHITECTURE_DECISION_RECORDS; ADR-001 a 005 |
| 31 | 60 | DEPLOYMENT.md | A | Consolidar DEPLOYMENT_GUIDE, ops/provisioning |
| 32 | 60 | SLO_SLI.md | B | Definição de SLO/SLI (mesmo simples) |
| 33 | 60 | RUNBOOKS.md | A | Índice consolidado para ops/* (alerts, health-checks, incident) |
| 34 | 60 | BACKUP_RESTORE.md | A | Detalhar restore a partir de disaster-recovery |
| 35 | 70 | PRD_TASKS.md | A | Formalizar a partir de product/KDS, checklists |
| 36 | 70 | PRD_SHIFTS.md | A | Formalizar a partir de GLOBAL_UI_STATE_MAP |
| 37 | 70 | PRD_ALERTS.md | A | Estruturar a partir de strategy/notifications |
| 38 | 70 | PRD_OWNER_DASHBOARD.md | B | Requisitos e fluxos do dashboard dono |
| 39 | 70 | USER_JOURNEYS.md | A | Consolidar CAMINHO_DO_CLIENTE, CUSTOMER_JOURNEY_MAP |
| 40 | 80 | LOAD_SCENARIOS.md | B | Cenários de carga (simulações) |
| 41 | 80 | CHAOS_CASES.md | B | O que quebrar / como testar resiliência |
| 42 | 80 | RELEASE_CHECKLIST.md | A | Checklist genérico (além de GO_LIVE e rollback) |

---

### Fase 2 — Marcar promessa vs realidade (badges)

Após Fase 1, cada secção do Livro deve ter um badge no índice ou no cabeçalho:

- **✅ Implementado** — Comportamento e doc alinhados (ex.: MULTI_TENANCY, ROLLBACK_PLAN, DISASTER_RECOVERY, TEST_STRATEGY).
- **🟡 Especificado** — Doc canónico existe; implementação parcial ou planeada (ex.: GDPR_MAPPING, THREAT_MODEL, EVENT_TAXONOMY, C4).
- **🔴 Necessita engenharia** — Requisito claro no papel; sistema ainda não cumpre (ex.: audit log imutável, export real, DSR automatizado, SLO monitorados).

*Sugestão:* adicionar uma tabela “Estado por secção” no [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md) ou no índice do Livro, com estas três colunas.

---

### Fase 3 — Plano de execução (engenharia)

Itens que **não** se fecham só com documento; exigem código/infra/processo.

| Sprint | Foco | Entregas (exemplos) | Prioridade |
|--------|------|----------------------|------------|
| **A** | Compliance mínimo | Trilhas de auditoria imutáveis; export de trabalho/dados (formato especificado); fluxo DSR (download/delete/anonymize) mínimo | 1 |
| **B** | Security hardening | Controles derivados do threat model; implementação progressiva da AUDIT_LOG_SPEC | 2 |
| **C** | Data taxonomy + métricas | Event taxonomy instrumentada; métricas do METRICS_DICTIONARY em dashboards/alertas; SLO monitorados (não só definidos) | 3 |

Ordem de execução recomendada: **Sprint A → Sprint B → Sprint C.**

---

## Resumo

- **Fase 1:** 42 itens em ordem de prioridade (50 → 40 → 30 → 20 → 00 → 10 → 11 → 60 → 70 → 80); tipos A/B = doc; tipo C = spec + plano.
- **Fase 2:** Atribuir badge Implementado / Especificado / Necessita engenharia a cada secção do Livro.
- **Fase 3:** 3 sprints (A Compliance, B Security, C Data) para fechar as lacunas que exigem engenharia.

Referência cruzada: [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md).
