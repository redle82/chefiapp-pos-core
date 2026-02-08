# ROADMAP ESTRATÉGICO E TÉCNICO — FECHO DE GAPS CHEFIAPP™

**Data:** 1 de Fevereiro de 2026  
**Contexto:** Roadmap 2026 – Fecho de GAPs Arquiteturais do ChefIApp  
**Fonte de verdade:** [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md)

Este documento traduz os GAPs identificados no GAP Analysis num plano claro, executável e priorizado. Não substitui o GAP Analysis; consolida-o como mapa-mãe para 2026.

---

## 1. Enquadramento: O que são os GAPs

### O que significa GAP neste contexto

**GAP** é a diferença entre o **estado actual** do repositório ChefIApp (documentação, contratos, código) e o **alvo 2026** definido no Livro de Arquitetura. Cada GAP foi classificado no [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md) como **Coberto**, **Parcial** ou **Em falta**.

- **Coberto** — Existe no repo com função equivalente clara.  
- **Parcial** — Existe conteúdo relevante, mas disperso, incompleto ou fora do formato esperado.  
- **Em falta** — Não existe documento ou equivalente funcional.

### Três naturezas de GAP

| Natureza | Significado | Como fechar |
|----------|-------------|-------------|
| **GAP de Documentação** | O conhecimento existe no repo (contratos, strategy, ops), mas está disperso ou sem nome canónico. | Consolidar, dar nome oficial, criar 1 doc canónico, apontar links. **Só escrita e organização.** |
| **GAP de Formalização** | O sistema já faz ou pressupõe algo; nunca foi formalizado como padrão (C4, event taxonomy, threat model, SLO). | Reflexão, decisões explícitas, documento de referência. **Documentação, não engenharia pesada.** |
| **GAP de Sistema / Engenharia** | O sistema ainda não executa certas capacidades que o Livro descreve (audit log imutável, export real, DSR, lineage em pipeline). | Especificação + plano de implementação; fechamento real exige **código, infra ou processo.** |

### Porque o ChefIApp não tem GAPs existenciais

Nenhum GAP mapeado exige:

- Refazer o core  
- Mudar o modelo mental (multi-tenant, contratos, domínios)  
- Trocar de stack  
- Abandonar decisões anteriores  

Todas as lacunas são **evolutivas**: fecháveis dentro da arquitetura actual. Isso indica que as decisões estruturais iniciais estavam correctas; o trabalho restante é documentar, formalizar e implementar capacidades já previstas ou especificáveis.

---

## 2. Classificação oficial dos GAPs

Tabela derivada directamente do [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md).  
**Tipo** = Documentação / Formalização / Engenharia · **Impacto** = Baixo / Médio / Alto / Crítico · **Natureza** = domínio estratégico.

| GAP | Secção | Tipo | Impacto | Natureza |
|-----|--------|------|---------|----------|
| VISION.md | 00 | Documentação | Médio | Evolução interna |
| WHY_CHEFIAPP_EXISTS.md | 00 | Documentação | Médio | Evolução interna |
| WHAT_CHEFIAPP_IS_NOT.md | 00 | Formalização | Médio | Defesa legal |
| TARGET_RESTAURANT_PROFILE.md | 00 | Documentação | Médio | Evolução interna |
| NON_GOALS.md | 00 | Documentação | Baixo | Evolução interna |
| ARCHITECTURE_OVERVIEW.md | 10 | Documentação | Alto | Evolução interna |
| C4_CONTEXT.md | 10 | Formalização | Médio | Evolução interna |
| C4_CONTAINER.md | 10 | Formalização | Médio | Evolução interna |
| C4_COMPONENT.md | 10 | Formalização | Médio | Evolução interna |
| BOUNDARY_CONTEXTS.md | 10 | Documentação | Alto | Evolução interna |
| OFFLINE_STRATEGY.md | 10 | Documentação | Alto | Escala |
| EDGE_CASES.md | 10 | Documentação | Alto | Segurança / Observabilidade |
| ADR-001 a ADR-005 | 11 | Documentação | Médio | Evolução interna |
| identity-access/ (domínio) | 20 | Documentação | Alto | Evolução interna |
| organization-locations/ | 20 | Documentação | Alto | Evolução interna |
| tasks-engine/ | 20 | Documentação | Alto | Evolução interna |
| shifts-time/ | 20 | Documentação | Alto | Evolução interna |
| ops-signals/ | 20 | Documentação | Médio | Observabilidade |
| notifications/ | 20 | Documentação | Médio | Evolução interna |
| gamification/ | 20 | Documentação | Baixo | Evolução interna |
| analytics/ | 20 | Documentação | Alto | Observabilidade |
| compliance-audit/ | 20 | Documentação | Crítico | Defesa legal |
| EVENT_TAXONOMY.md | 30 | Formalização | Alto | Observabilidade |
| METRICS_DICTIONARY.md | 30 | Formalização | Alto | Observabilidade |
| DATA_LINEAGE.md | 30 | Formalização + Engenharia | Alto | Observabilidade / Escala |
| RETENTION_POLICY.md | 30 | Documentação | Alto | Defesa legal |
| EXPORT_FORMATS.md | 30 | Formalização + Engenharia | Crítico | Defesa legal |
| ANOMALY_DEFINITION.md | 30 | Formalização | Médio | Observabilidade |
| THREAT_MODEL.md | 40 | Formalização | Crítico | Segurança |
| OWASP_ASVS_CHECKLIST.md | 40 | Formalização | Crítico | Segurança |
| ACCESS_CONTROL_MATRIX.md | 40 | Documentação | Alto | Segurança |
| AUDIT_LOG_SPEC.md | 40 | Formalização + Engenharia | Crítico | Segurança / Defesa legal |
| INCIDENT_RESPONSE.md | 40 | Documentação | Alto | Segurança |
| GDPR_MAPPING.md | 50 | Formalização | Crítico | Defesa legal |
| DATA_SUBJECT_REQUESTS.md | 50 | Formalização + Engenharia | Crítico | Defesa legal |
| WORK_LOG_EXPORT.md | 50 | Formalização + Engenharia | Crítico | Defesa legal |
| FISCAL_POSITIONING.md | 50 | Formalização | Crítico | Defesa legal |
| WHAT_WE_DO_NOT_PROCESS.md | 50 | Formalização | Crítico | Defesa legal |
| DEPLOYMENT.md | 60 | Documentação | Alto | Escala |
| BACKUP_RESTORE.md | 60 | Documentação | Alto | Segurança |
| SLO_SLI.md | 60 | Formalização | Alto | Observabilidade |
| RUNBOOKS.md | 60 | Documentação | Alto | Segurança |
| PRD_TASKS.md | 70 | Documentação | Médio | Evolução interna |
| PRD_SHIFTS.md | 70 | Documentação | Médio | Evolução interna |
| PRD_ALERTS.md | 70 | Documentação | Médio | Evolução interna |
| PRD_OWNER_DASHBOARD.md | 70 | Formalização | Alto | Evolução interna |
| USER_JOURNEYS.md | 70 | Documentação | Médio | Evolução interna |
| LOAD_SCENARIOS.md | 80 | Formalização | Médio | Observabilidade |
| CHAOS_CASES.md | 80 | Formalização | Médio | Segurança |
| RELEASE_CHECKLIST.md | 80 | Documentação | Alto | Segurança |

*Nota:* Itens com “Formalização + Engenharia” fecham primeiro no papel (especificação); o fechamento completo exige implementação nas Ondas 2 ou 3.

---

## 3. Roadmap em 3 Ondas (30 / 60 / 90 dias)

### 🔴 Onda 1 — 0 a 30 dias (Fundação & Defesa)

**Foco:** Compliance mínimo, segurança base, prova e trilhas, documentação canónica.

| GAP que fecha | Resultado esperado | Tipo | Risco mitigado |
|---------------|--------------------|------|----------------|
| GDPR_MAPPING, WHAT_WE_DO_NOT_PROCESS, DATA_SUBJECT_REQUESTS, FISCAL_POSITIONING, WORK_LOG_EXPORT (spec) | Docs canónicos de compliance; especificação de export e DSR | Doc / Spec | Exposição legal e fiscal |
| THREAT_MODEL, OWASP_ASVS_CHECKLIST, ACCESS_CONTROL_MATRIX, AUDIT_LOG_SPEC (spec), INCIDENT_RESPONSE | Modelo de ameaças; checklist; matriz de acesso; spec de audit log; processo de incidente | Doc / Spec | Risco de segurança e auditoria |
| EVENT_TAXONOMY, METRICS_DICTIONARY, RETENTION_POLICY, EXPORT_FORMATS (spec), DATA_LINEAGE (spec), ANOMALY_DEFINITION | Taxonomia de eventos; dicionário de métricas; política de retenção; specs de export/lineage; definição de anomalia | Doc / Spec | Falta de observabilidade e defesa em auditoria |
| Domínios (README por domínio + links) | Secção “Domínios e Contratos” com identidade, org, tasks, shifts, ops-signals, notificações, gamificação, analytics, compliance-audit | Doc | Onboarding e clareza interna |
| VISION, WHY_CHEFIAPP_EXISTS, WHAT_CHEFIAPP_IS_NOT, TARGET_RESTAURANT_PROFILE, NON_GOALS | Visão única; racional; limites; perfil alvo; não-objectivos | Doc | Alinhamento estratégico |
| ARCHITECTURE_OVERVIEW, BOUNDARY_CONTEXTS, OFFLINE_STRATEGY, EDGE_CASES, C4 (Context/Container/Component), ADRs | Visão consolidada AS-IS + to-be; contextos de limite; offline; edge cases; diagramas C4; ADRs | Doc | Consistência arquitetural |
| DEPLOYMENT, SLO_SLI, RUNBOOKS, BACKUP_RESTORE | Deploy unificado; definição SLO/SLI; índice de runbooks; backup/restore detalhado | Doc | Risco operacional |
| PRD_TASKS, PRD_SHIFTS, PRD_ALERTS, PRD_OWNER_DASHBOARD, USER_JOURNEYS | PRDs formais e user journeys consolidados | Doc | Clareza de produto |
| LOAD_SCENARIOS, CHAOS_CASES, RELEASE_CHECKLIST | Cenários de carga; casos de caos; checklist de release genérico | Doc | Risco de release e resiliência |

**Critério de sucesso Onda 1:** Índice do Livro completo; cada secção com doc canónico ou link; tabela “Estado por secção” com badge; **Livro v1 congelado como baseline 2026.**

---

### 🟡 Onda 2 — 31 a 60 dias (Estrutura & Clareza)

**Foco:** Data taxonomy, métricas, domínios, formalização arquitetural; **primeira execução de engenharia (Compliance mínimo).**

| GAP que fecha | O que passa de “especificado” para “implementado” | Tipo | Risco mitigado |
|---------------|---------------------------------------------------|------|----------------|
| Trilhas de auditoria (AUDIT_LOG_SPEC) | Audit log imutável em produção (quem fez o quê, quando) | Engenharia | Auditoria e conformidade |
| Export real (WORK_LOG_EXPORT, EXPORT_FORMATS) | Fluxo de export de trabalho/dados (ex.: csv/json) testado e utilizável | Engenharia | Pedidos legais e fiscais |
| DSR (DATA_SUBJECT_REQUESTS) | Fluxo operacional para acesso, retificação, apagamento, portabilidade | Engenharia | GDPR e defesa legal |
| Data taxonomy + métricas (instrumentação inicial) | Eventos e métricas do dicionário começam a ser emitidos/agregados | Engenharia | Observabilidade e decisão |

**Critério de sucesso Onda 2:** Export e DSR utilizáveis por equipa legal/DPO; trilha de auditoria consultável; primeiros dashboards alinhados ao Livro.

---

### 🟢 Onda 3 — 61 a 90 dias (Escala & Inteligência)

**Foco:** Observabilidade real, exportações robustas, lineage, preparação para IA e expansão; **hardening de segurança e dados.**

| GAP que fecha | Resultado esperado | Tipo | Relação com futuro ChefIApp |
|---------------|--------------------|------|-----------------------------|
| Controles do THREAT_MODEL | Mitigações implementadas ou planeadas com dono | Engenharia | Segurança como base para escala |
| AUDIT_LOG_SPEC em produção | Trilha alargada e imutável conforme spec | Engenharia | Prova jurídica e operacional |
| Event taxonomy + METRICS_DICTIONARY instrumentados | Pipeline de eventos; métricas em dashboards e alertas | Engenharia | Base para **motor cognitivo** e analytics |
| SLO monitorados | SLO_SLI não só definidos; instrumentação e alertas | Engenharia | Operação previsível e **Owner Dashboard** confiável |
| DATA_LINEAGE (mínimo) | Rastreio de origem/uso de dados (manual ou pipeline simples) | Engenharia | Compliance e preparação para IA |

**Critério de sucesso Onda 3:** Dashboards e alertas alinhados ao Livro; SLO visíveis; security backlog priorizado; base de dados e eventos pronta para evolução (Owner Dashboard, motor cognitivo, expansão).

---

## 4. Mapa “Documento vs Engenharia”

Objectivo: evitar confusão entre “está escrito” e “está implementado”.

### GAPs que fecham 100% com documentação

Consolidar ou escrever; nenhuma alteração de código/infra obrigatória para considerar o GAP “fechado no papel”.

- **00 Vision:** VISION, WHY_CHEFIAPP_EXISTS, WHAT_CHEFIAPP_IS_NOT, TARGET_RESTAURANT_PROFILE, NON_GOALS  
- **10–11 Arch:** ARCHITECTURE_OVERVIEW, BOUNDARY_CONTEXTS, OFFLINE_STRATEGY, EDGE_CASES, C4_*, ADRs  
- **20 Domains:** README por domínio + links para contratos  
- **40 Security (parcial):** ACCESS_CONTROL_MATRIX, INCIDENT_RESPONSE  
- **60 Ops:** DEPLOYMENT, RUNBOOKS, BACKUP_RESTORE  
- **70 Product:** PRD_*, USER_JOURNEYS  
- **80 Testing:** LOAD_SCENARIOS, CHAOS_CASES, RELEASE_CHECKLIST  
- **30 Data (parcial):** RETENTION_POLICY (doc canónico)  
- **50 Compliance (parcial):** GDPR_MAPPING, WHAT_WE_DO_NOT_PROCESS, FISCAL_POSITIONING (como posicionamento/doc)

### GAPs que exigem engenharia mínima

Doc primeiro (especificação); depois implementação limitada (configuração, fluxos operacionais, integrações existentes).

- SLO_SLI — Definir no papel (Onda 1); instrumentar e monitorar (Onda 2–3).  
- EVENT_TAXONOMY / METRICS_DICTIONARY — Formalizar (Onda 1); emitir/agregar eventos (Onda 2–3).  
- INCIDENT_RESPONSE — Processo geral (Onda 1); runbooks e treino (contínuo).

### GAPs que exigem novos componentes de sistema

Não se fecham só com documento; exigem código, pipeline ou processo novo.

- **AUDIT_LOG_SPEC** — Trilha imutável “quem fez o quê, quando” (Onda 2–3).  
- **WORK_LOG_EXPORT / EXPORT_FORMATS** — Export real de dados (Onda 2).  
- **DATA_SUBJECT_REQUESTS** — Fluxo DSR (download, delete, anonymize, portabilidade) (Onda 2).  
- **DATA_LINEAGE** — Pipeline ou processo de lineage (Onda 3).  
- **SLO monitorados** — Instrumentação e alertas (Onda 3).

---

## 5. Critérios de Fecho de GAP

Quando um GAP pode ser considerado fechado (total ou parcial) ou ainda aberto.

| Estado | Critério | Exemplos |
|--------|----------|----------|
| 🟢 **Fechado** | Documento canónico existe e foi validado **e**, quando aplicável, a capacidade está implementada e utilizável. | MULTI_TENANCY documentado e em produção; ROLLBACK_PLAN documentado e testado; export de trabalho funcional e testado. |
| 🟡 **Parcialmente fechado** | Documento existe e foi validado; implementação pendente ou parcial. | GDPR_MAPPING aprovado; fluxo DSR ainda manual. AUDIT_LOG_SPEC aprovado; trilha ainda não imutável. |
| 🔴 **Aberto** | Falta documento canónico **ou** falta implementação onde o doc já exige capacidade operacional. | Sem THREAT_MODEL; sem export real apesar de WORK_LOG_EXPORT especificado. |

**Regra prática:**

- **Só doc:** GAP fechado quando o doc existe, está no índice do Livro e foi revisto.  
- **Doc + sistema:** GAP fechado quando o doc existe **e** a feature/export/trilha está implementada, logável ou testada conforme spec.

---

## 6. Visão Executiva (1 página)

### Onde o ChefIApp estava

- Conhecimento arquitectural e operacional **disperso** (contratos, strategy, ops em vários ficheiros).  
- Difícil responder de forma objectiva: “O que falta?” e “Em que ordem fechar?”.  
- Risco de confundir “temos doc” com “temos sistema”.

### Onde está agora

- **GAP Analysis** completo: estado actual vs alvo 2026, por secção (00–80).  
- **Classificação oficial** de cada GAP (Documentação / Formalização / Engenharia) com Impacto e Natureza.  
- **Roadmap em 3 Ondas** (30 / 60 / 90 dias) com foco em Fundação & Defesa → Estrutura & Clareza → Escala & Inteligência.  
- **Mapa Documento vs Engenharia** e **critérios de fecho** explícitos (🟢 / 🟡 / 🔴).  
- **Nenhum GAP existential**: todas as lacunas são evolutivas, dentro da arquitectura actual.

### Onde estará após o roadmap

- **30 dias:** Livro de Arquitetura v1 congelado (baseline 2026); documentação canónica de Compliance, Security, Data, Vision, Arch, Ops, Product, Testing.  
- **60 dias:** Compliance mínimo em operação (trilhas de auditoria, export real, DSR); data taxonomy e métricas em instrumentação inicial.  
- **90 dias:** Observabilidade real (SLO monitorados, eventos/métricas em pipeline); segurança alinhada ao threat model; base pronta para Owner Dashboard e motor cognitivo.

### Porque este roadmap torna o sistema defensável, escalável e auditável

- **Defensável:** Compliance e segurança documentados e priorizados; defesa legal (GDPR, fiscal, “o que não processamos”) explícita; trilhas e exports como prova.  
- **Escalável:** Arquitectura e domínios claros; SLO e métricas definidos e depois instrumentados; preparação para IA e expansão.  
- **Auditável:** Cada GAP tem tipo, impacto e natureza; critérios de fecho evitam “promessa sem prova”; Livro v1 serve de referência para due diligence e auditorias.

---

**Fim do documento.**

Qualquer pessoa (técnica, jurídica ou executiva) pode, a partir deste roadmap e do [GAP_ANALYSIS_LIVRO_ARQUITETURA.md](./GAP_ANALYSIS_LIVRO_ARQUITETURA.md), responder:

- Sabemos **quais eram** os GAPs do ChefIApp.  
- Sabemos **em que ordem** fechá-los.  
- Sabemos **quando** o sistema estará completo para 2026.

**Próximos níveis possíveis:** transformar este roadmap em épicos/sprints; gerar versão jurídica/defensiva; ligar cada onda a capacidades do motor cognitivo.

---

## Próximas ondas (pós-Onda 3)

Com a Onda 3 concluída, o foco passa para execução de produto e geração de receita.

- Estratégia e roadmap macro: [ONDAS_4_A_7_ESTRATEGIA.md](./ONDAS_4_A_7_ESTRATEGIA.md)
- Próxima entrega: [ONDA_4_POS_ULTRA_RAPIDO.md](./ONDA_4_POS_ULTRA_RAPIDO.md)
