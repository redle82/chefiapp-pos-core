# Onda 1 (30 dias) — Tarefas técnicas para sprint/backlog

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) · [GAP_CLOSURE_ROADMAP.md](./GAP_CLOSURE_ROADMAP.md)  
**Objetivo:** Fechar no papel todos os GAPs da Onda 1 (Fundação & Defesa); Livro v1 congelado como baseline 2026.

**Uso:** Copiar linhas para Linear/Jira/backlog. Cada tarefa = 1 item; Tipo = Doc ou Spec; Resultado = critério de done.

---

## Legenda

| Tipo | Significado |
|------|-------------|
| **Doc** | Só documentação (consolidar ou escrever); não exige código |
| **Spec** | Especificação; implementação fica para Onda 2/3 |

---

## Tarefas por prioridade (50 → 40 → 30 → 20 → 00 → 10 → 11 → 60 → 70 → 80)

### Bloco 50 — Compliance (dias 1–5)

| ID | Tarefa | Entregável | Tipo | Resultado esperado | Risco mitigado |
|----|--------|------------|------|--------------------|-----------------|
| T50-1 | Escrever mapeamento GDPR (dados pessoais, bases legais, retenção) | docs/architecture/GDPR_MAPPING.md | Spec | Doc canónico aprovado; lista de dados e finalidades | Exposição legal |
| T50-2 | Escrever “o que não processamos” (limites e defesa legal) | docs/architecture/WHAT_WE_DO_NOT_PROCESS.md | Spec | Doc canónico aprovado | Defesa legal |
| T50-3 | Escrever processo DSR (acesso, retificação, apagamento, portabilidade) | docs/architecture/DATA_SUBJECT_REQUESTS.md | Spec | Processo e prazos definidos; implementação = Onda 2 | GDPR |
| T50-4 | Escrever posicionamento fiscal (RD 1007/2023, AEAT) | docs/architecture/FISCAL_POSITIONING.md | Spec | Doc canónico aprovado | Exposição fiscal |
| T50-5 | Escrever especificação de export de work log (formato, scope, uso) | docs/architecture/WORK_LOG_EXPORT.md | Spec | Spec aprovada; implementação = Onda 2 | Compliance / auditoria |

---

### Bloco 40 — Security (dias 6–10)

| ID | Tarefa | Entregável | Tipo | Resultado esperado | Risco mitigado |
|----|--------|------------|------|--------------------|-----------------|
| T40-1 | Escrever threat model (ameaças, ativos, mitigações) | docs/architecture/THREAT_MODEL.md | Spec | Modelo aprovado; backlog de controles | Segurança |
| T40-2 | Escrever checklist OWASP ASVS adaptado ao ChefIApp | docs/architecture/OWASP_ASVS_CHECKLIST.md | Spec | Checklist revisável por auditoria | Segurança |
| T40-3 | Consolidar matriz de acesso (expandir TENANT_ISOLATION; roles/recurso) | docs/architecture/ACCESS_CONTROL_MATRIX.md | Doc | Matriz completa e referenciada | Isolamento / auditoria |
| T40-4 | Escrever spec formal de audit log (eventos, imutabilidade, retenção) | docs/architecture/AUDIT_LOG_SPEC.md | Spec | Spec aprovada; implementação = Onda 2/3 | Trilha jurídica / operacional |
| T40-5 | Generalizar processo de incidente (a partir de stolen-device) | docs/ops/INCIDENT_RESPONSE.md ou equivalente | Doc | Processo geral documentado | Resposta a incidentes |

---

### Bloco 30 — Data (dias 11–15)

| ID | Tarefa | Entregável | Tipo | Resultado esperado | Risco mitigado |
|----|--------|------------|------|--------------------|-----------------|
| T30-1 | Escrever taxonomia de eventos (a partir dos contracts) | docs/architecture/EVENT_TAXONOMY.md | Spec | Lista de eventos e significado | Observabilidade |
| T30-2 | Escrever dicionário de métricas (nome, definição, SLI) | docs/architecture/METRICS_DICTIONARY.md | Spec | Métricas formais; instrumentação = Onda 3 | Observabilidade |
| T30-3 | Consolidar política de retenção (a partir de CORE_DATA_RETENTION) | docs/architecture/RETENTION_POLICY.md | Doc | Doc canónico aprovado | Defesa legal |
| T30-4 | Escrever spec de formatos de export (v1: csv/json) | docs/architecture/EXPORT_FORMATS.md | Spec | Spec aprovada; export real = Onda 2 | Compliance |
| T30-5 | Escrever spec de lineage (“manual + futuro pipeline”) | docs/architecture/DATA_LINEAGE.md | Spec | Spec aprovada; pipeline = Onda 3 | Auditoria / escala |
| T30-6 | Escrever definição de anomalia (para alertas) | docs/architecture/ANOMALY_DEFINITION.md | Spec | Doc aprovado | Observabilidade |

---

### Bloco 20 — Domains (dias 16–17)

| ID | Tarefa | Entregável | Tipo | Resultado esperado | Risco mitigado |
|----|--------|------------|------|--------------------|-----------------|
| T20-1 | Criar secção “Domínios e Contratos” com README por domínio + links | docs/architecture/DOMINIOS_E_CONTRATOS.md (ou índice) + README por domínio | Doc | Índice + 9 domínios (identity-access, organization-locations, tasks-engine, shifts-time, ops-signals, notifications, gamification, analytics, compliance-audit) com links para contracts | Onboarding / clareza |

---

### Bloco 00 — Vision (dias 18–19)

| ID | Tarefa | Entregável | Tipo | Resultado esperado | Risco mitigado |
|----|--------|------------|------|--------------------|-----------------|
| T00-1 | Consolidar visão única (CORE_LEVEL_3_VISION + formato clássico) | docs/VISION.md | Doc | Doc canónico aprovado | Alinhamento |
| T00-2 | Consolidar “porquê existe” (PITCH*, LANCAMENTO*, strategy) | docs/WHY_CHEFIAPP_EXISTS.md | Doc | Doc canónico aprovado | Alinhamento |
| T00-3 | Escrever limites explícitos (não é TPV genérico, não é ERP) | docs/WHAT_CHEFIAPP_IS_NOT.md | Spec | Doc canónico aprovado | Defesa / scope |
| T00-4 | Consolidar perfil alvo (strategy, Commercial, sales) | docs/TARGET_RESTAURANT_PROFILE.md | Doc | Doc canónico aprovado | Comercial |
| T00-5 | Consolidar não-objectivos (SCOPE_FREEZE, NON_GOALS) | docs/NON_GOALS.md | Doc | Doc canónico aprovado | Scope |

---

### Bloco 10–11 — Architecture (dias 20–24)

| ID | Tarefa | Entregável | Tipo | Resultado esperado | Risco mitigado |
|----|--------|------------|------|--------------------|-----------------|
| T10-1 | Consolidar visão AS-IS + to-be | docs/ARCHITECTURE_OVERVIEW.md | Doc | Doc canónico aprovado | Consistência |
| T10-2 | Escrever doc único de boundary contexts (links CORE*, MENU*, etc.) | docs/architecture/BOUNDARY_CONTEXTS.md | Doc | Doc canónico aprovado | Consistência |
| T10-3 | Consolidar estratégia offline (B1/B2/B4, MENU_FALLBACK_CONTRACT) | docs/architecture/OFFLINE_STRATEGY.md | Doc | Doc canónico aprovado | Escala |
| T10-4 | Consolidar edge cases (CORE_FAILURE_MODEL, OPERATIONAL_UI_RESILIENCE) | docs/architecture/EDGE_CASES.md | Doc | Doc canónico aprovado | Resiliência |
| T10-5 | Desenhar C4 Context (ex.: Mermaid) | docs/architecture/C4_CONTEXT.md | Spec | Diagrama aprovado | Clareza |
| T10-6 | Desenhar C4 Container | docs/architecture/C4_CONTAINER.md | Spec | Diagrama aprovado | Clareza |
| T10-7 | Desenhar C4 Component (onde fizer sentido) | docs/architecture/C4_COMPONENT.md | Spec | Diagrama aprovado | Clareza |
| T11-1 | Manter/expandir ADRs (ADR-001 a 005; doc único ou secções) | docs/ARCHITECTURE_DECISION_RECORDS.md (ou equivalente) | Doc | ADRs referenciáveis | Decisões |

---

### Bloco 60 — Operations (dias 25–26)

| ID | Tarefa | Entregável | Tipo | Resultado esperado | Risco mitigado |
|----|--------|------------|------|--------------------|-----------------|
| T60-1 | Consolidar deploy (DEPLOYMENT_GUIDE, ops/provisioning) | docs/DEPLOYMENT.md ou docs/ops/DEPLOYMENT.md | Doc | Doc canónico único | Operacional |
| T60-2 | Escrever definição de SLO/SLI (mesmo simples) | docs/architecture/SLO_SLI.md | Spec | Definições aprovadas; instrumentação = Onda 3 | Observabilidade |
| T60-3 | Criar índice de runbooks (alerts, health-checks, incident) | docs/ops/RUNBOOKS.md | Doc | Índice com links para ops/* | Operacional |
| T60-4 | Detalhar backup/restore (a partir de disaster-recovery) | docs/ops/BACKUP_RESTORE.md | Doc | Doc canónico aprovado | DR |

---

### Bloco 70 — Product (dias 27–28)

| ID | Tarefa | Entregável | Tipo | Resultado esperado | Risco mitigado |
|----|--------|------------|------|--------------------|-----------------|
| T70-1 | Formalizar PRD Tasks (product/KDS, checklists) | docs/product/PRD_TASKS.md | Doc | PRD aprovado | Produto |
| T70-2 | Formalizar PRD Shifts (GLOBAL_UI_STATE_MAP) | docs/product/PRD_SHIFTS.md | Doc | PRD aprovado | Produto |
| T70-3 | Estruturar PRD Alerts (strategy/notifications) | docs/product/PRD_ALERTS.md | Doc | PRD aprovado | Produto |
| T70-4 | Escrever PRD Owner Dashboard (requisitos e fluxos) | docs/product/PRD_OWNER_DASHBOARD.md | Spec | PRD aprovado | Produto |
| T70-5 | Consolidar user journeys (CAMINHO_DO_CLIENTE, CUSTOMER_JOURNEY_MAP) | docs/product/USER_JOURNEYS.md | Doc | Doc canónico aprovado | Produto |

---

### Bloco 80 — Testing (dias 29–30)

| ID | Tarefa | Entregável | Tipo | Resultado esperado | Risco mitigado |
|----|--------|------------|------|--------------------|-----------------|
| T80-1 | Escrever cenários de carga (simulações) | docs/testing/LOAD_SCENARIOS.md | Spec | Doc aprovado | Performance |
| T80-2 | Escrever casos de caos (o que quebrar, como testar resiliência) | docs/testing/CHAOS_CASES.md | Spec | Doc aprovado | Resiliência |
| T80-3 | Consolidar checklist de release genérico (além de GO_LIVE e rollback) | docs/testing/RELEASE_CHECKLIST.md | Doc | Checklist aprovado | Release |

---

### Fecho Onda 1 (dia 30)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| T0-1 | Congelar Livro v1 (baseline 2026) | docs/LIVRO_ARQUITETURA_INDEX.md ou equivalente | Doc | Índice canónico + tabela “Estado por secção” (✅/🟡/🔴) + data de congelação |

---

## Resumo para backlog

- **Total de tarefas:** 42 entregas + 1 fecho = 43 itens.
- **Ordem de execução:** T50-* → T40-* → T30-* → T20-* → T00-* → T10-* / T11-* → T60-* → T70-* → T80-* → T0-1.
- **Tipo:** Maioria Doc; Spec onde a implementação é Onda 2/3.
- **Critério de sucesso:** Cada entregável existe no path indicado, foi revisto e está referenciado no índice do Livro; no fim, Livro v1 congelado.

**Referências:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) · [GAP_CLOSURE_ROADMAP.md](./GAP_CLOSURE_ROADMAP.md) · [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md).
