# Domínios e Contratos — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T20-1 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Índice canónico dos domínios do ChefIApp com links para os contratos de arquitectura. Cada domínio agrupa contratos por responsabilidade; serve para onboarding, clareza interna e evolução do produto.

---

## 1. Âmbito

Este documento é o **índice** da secção “Domínios e Contratos”. Para cada um dos 9 domínios abaixo:

- **Nome** e **descrição breve** do domínio.
- **Contratos** associados (links para docs/architecture/ ou docs/security/, docs/ops/ quando aplicável).
- **Nota:** README, DATA_MODEL, EVENTS, RULES e FAILURE_MODES podem ser expandidos em documentos dedicados por domínio (futuro); por agora o índice e os links aos contratos existentes fecham o GAP de estrutura por domínio.

---

## 2. Domínios e contratos

### 2.1 identity-access (Identidade e Acesso)

**Descrição:** Autenticação, sessão, membros do restaurante (gm_restaurant_members), papéis (Owner, Manager, Waiter, KDS) e controlo de acesso por tenant.

| Contrato | Caminho |
|----------|---------|
| AUTH_AND_ENTRY_CONTRACT | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) |
| PORTAL_MANAGEMENT_CONTRACT | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) |
| CORE_APPSTAFF_IDENTITY_CONTRACT | [CORE_APPSTAFF_IDENTITY_CONTRACT.md](./CORE_APPSTAFF_IDENTITY_CONTRACT.md) |
| ACCESS_CONTROL_MATRIX | [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) |
| TENANT_ISOLATION_SECURITY_MODEL | [../security/TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md) |

---

### 2.2 organization-locations (Organização e Localizações)

**Descrição:** Restaurante (tenant), localizações, criação e bootstrap do restaurante, multi-tenant e soberania do Core.

| Contrato | Caminho |
|----------|---------|
| RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT | [RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md](./RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md) |
| RESTAURANT_OS_DESIGN_PRINCIPLES | [RESTAURANT_OS_DESIGN_PRINCIPLES.md](./RESTAURANT_OS_DESIGN_PRINCIPLES.md) |
| MULTI_TENANT_ARCHITECTURE | [MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md) |
| TENANCY_KERNEL_CONTRACT | [TENANCY_KERNEL_CONTRACT.md](./TENANCY_KERNEL_CONTRACT.md) |

---

### 2.3 tasks-engine (Motor de Tarefas)

**Descrição:** Tarefas operacionais, execução de tarefas, KDS (cozinha), atribuição e estado de tarefas.

| Contrato | Caminho |
|----------|---------|
| CORE_TASK_EXECUTION_CONTRACT | [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md) |
| CORE_KDS_CONTRACT | [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md) |
| CORE_TIME_AND_TURN_CONTRACT | [CORE_TIME_AND_TURN_CONTRACT.md](./CORE_TIME_AND_TURN_CONTRACT.md) |

---

### 2.4 shifts-time (Turnos e Tempo)

**Descrição:** Turnos (shifts), check-in/check-out, presença, governação de tempo e imutabilidade de turnos.

| Contrato | Caminho |
|----------|---------|
| CORE_IMMUTABLE_SHIFT_CONTRACT | [CORE_IMMUTABLE_SHIFT_CONTRACT.md](./CORE_IMMUTABLE_SHIFT_CONTRACT.md) |
| CORE_TIME_AND_TURN_CONTRACT | [CORE_TIME_AND_TURN_CONTRACT.md](./CORE_TIME_AND_TURN_CONTRACT.md) |
| CORE_TIME_GOVERNANCE_CONTRACT | [CORE_TIME_GOVERNANCE_CONTRACT.md](./CORE_TIME_GOVERNANCE_CONTRACT.md) |
| WORK_LOG_EXPORT | [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) |

---

### 2.5 ops-signals (Operação e Sinais)

**Descrição:** Modelo de falha, resiliência operacional, gates operacionais, heartbeat e sinais de estado (online/offline).

| Contrato | Caminho |
|----------|---------|
| CORE_FAILURE_MODEL | [CORE_FAILURE_MODEL.md](./CORE_FAILURE_MODEL.md) |
| CORE_OPERATIONAL_UI_CONTRACT | [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md) |
| CORE_OPERATIONAL_GOVERNANCE_CONTRACT | [CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md](./CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md) |
| CORE_OPERATIONAL_COMMUNICATION_CONTRACT | [CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md](./CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md) |
| HEARTBEAT_MINIMAL_CONTRACT | [HEARTBEAT_MINIMAL_CONTRACT.md](./HEARTBEAT_MINIMAL_CONTRACT.md) |
| RUNTIME_CONNECTIVITY_CONTRACT | [RUNTIME_CONNECTIVITY_CONTRACT.md](./RUNTIME_CONNECTIVITY_CONTRACT.md) |

---

### 2.6 notifications (Notificações)

**Descrição:** Comunicação operacional (push, alertas), notificações ao staff e ao KDS; integração com CORE_OPERATIONAL_COMMUNICATION.

| Contrato | Caminho |
|----------|---------|
| CORE_OPERATIONAL_COMMUNICATION_CONTRACT | [CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md](./CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md) |
| CORE_APPSTAFF_CONTRACT | [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md) (notificações no AppStaff) |
| EVENT_TAXONOMY | [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) (eventos que podem disparar notificações) |

---

### 2.7 gamification (Gamificação)

**Descrição:** XP, achievements e incentivos ao staff; lógica pode estar no AppStaff ou em serviços; contratos formais a expandir.

| Contrato / Referência | Caminho |
|-----------------------|---------|
| CORE_APPSTAFF_CONTRACT | [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md) (contexto AppStaff) |
| FUTURE_CONTRACTS_MAP | [FUTURE_CONTRACTS_MAP.md](./FUTURE_CONTRACTS_MAP.md) (evolução) |
| ARCHITECTURE_DECISION_RECORDS | [ARCHITECTURE_DECISION_RECORDS.md](./ARCHITECTURE_DECISION_RECORDS.md) (ex.: Gamification-Safety) |

*Nota:* Domínio com lógica existente; documentação de README/DATA_MODEL/EVENTS/RULES pode ser criada quando o produto estabilizar.

---

### 2.8 analytics (Analytics e Observabilidade)

**Descrição:** Métricas, dashboards, logging, monitorização e observabilidade operacional.

| Contrato / Referência | Caminho |
|-----------------------|---------|
| MONITORING_GUIDE | [MONITORING_GUIDE.md](./MONITORING_GUIDE.md) |
| MONITORING_LOGGING | [../MONITORING_LOGGING.md](../MONITORING_LOGGING.md) |
| METRICS_DICTIONARY | [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md) |
| EVENT_TAXONOMY | [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) |
| ANOMALY_DEFINITION | [ANOMALY_DEFINITION.md](./ANOMALY_DEFINITION.md) |
| SLO_SLI | [SLO_SLI.md](./SLO_SLI.md) (quando existir) |

---

### 2.9 compliance-audit (Compliance e Auditoria)

**Descrição:** Enforço de contratos, trilha de auditoria, conformidade (GDPR, fiscal), DSR e export.

| Contrato / Referência | Caminho |
|-----------------------|---------|
| CONTRACT_ENFORCEMENT | [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md) |
| AUDIT_LOG_SPEC | [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) |
| CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT | [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) |
| GDPR_MAPPING | [GDPR_MAPPING.md](./GDPR_MAPPING.md) |
| DATA_SUBJECT_REQUESTS | [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) |
| FISCAL_POSITIONING | [FISCAL_POSITIONING.md](./FISCAL_POSITIONING.md) |
| RETENTION_POLICY | [RETENTION_POLICY.md](./RETENTION_POLICY.md) |

---

## 3. Índice geral de contratos

Para o índice completo e hierarquia Core (Soberania Financeira, 4 terminais, piloto), ver [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md).

---

## 4. Próximos passos (opcional)

- **Por domínio:** Criar README dedicado (ex.: docs/architecture/domains/identity-access/README.md) com DATA_MODEL, EVENTS, RULES e FAILURE_MODES quando o produto e a equipa estabilizarem.
- **Atualização:** Ao adicionar novos contratos, referenciá-los neste índice na secção do domínio correspondente.

---

**Referências:** [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) · [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](../GAP_ANALYSIS_LIVRO_ARQUITETURA.md).
