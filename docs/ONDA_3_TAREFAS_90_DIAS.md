# Onda 3 (61–90 dias) — Tarefas de Engenharia

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) · [LIVRO_ARQUITETURA_INDEX.md](./LIVRO_ARQUITETURA_INDEX.md)  
**Objetivo:** Observabilidade real, hardening de segurança e dados, preparação para Owner Dashboard e evolução (motor cognitivo, IA). **Pré-requisito:** Onda 2 concluída (1 Fev 2026).

---

## Foco da Onda 3

| Área | O que passa de "parcial" para "robusto" | Doc de referência |
|------|----------------------------------------|-------------------|
| **THREAT_MODEL** | Mitigações implementadas ou planeadas com dono | [THREAT_MODEL.md](./architecture/THREAT_MODEL.md) |
| **AUDIT_LOG_SPEC** | Trilha alargada (login, caixa, config, admin); purge conforme retenção | [AUDIT_LOG_SPEC.md](./architecture/AUDIT_LOG_SPEC.md) |
| **Event taxonomy + métricas** | Pipeline de eventos; dashboards e alertas | [EVENT_TAXONOMY.md](./architecture/EVENT_TAXONOMY.md), [METRICS_DICTIONARY.md](./architecture/METRICS_DICTIONARY.md) |
| **SLO monitorados** | SLO_SLI instrumentados e alertas | [SLO_SLI.md](./architecture/SLO_SLI.md), [ANOMALY_DEFINITION.md](./architecture/ANOMALY_DEFINITION.md) |
| **DATA_LINEAGE (mínimo)** | Rastreio de origem/uso de dados (manual ou pipeline simples) | [DATA_LINEAGE.md](./architecture/DATA_LINEAGE.md) |

**Critério de sucesso Onda 3:** Dashboards e alertas alinhados ao Livro; SLO visíveis; security backlog priorizado; base pronta para Owner Dashboard e evolução.

---

## Tarefas sugeridas (backlog)

### Bloco E — Security / THREAT_MODEL (dias 61–70)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| E1 | Mapear mitigações do THREAT_MODEL a controles existentes ou em falta | Matriz ou doc (threat → mitigação → dono/estado) | Doc / Engenharia | Cada ameaça com mitigação planeada ou implementada |
| E2 | Priorizar e implementar controles críticos em falta (ex.: rate limit, validação entrada) | Código ou config + registo em THREAT_MODEL | Engenharia | Backlog de segurança com donos e prazos |
| E3 | Alinhar OWASP_ASVS_CHECKLIST a testes ou revisões | Checklist com evidência (teste, revisão) | Engenharia / Doc | Checklist com estado por item |

### Bloco F — Audit alargado (dias 65–75)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| F1 | Emitir eventos login_success, login_failure, logout (quando aplicável) em gm_audit_logs | Código (auth callback ou boundary) + migração se necessário | Engenharia | Trilha de autenticação consultável |
| F2 | Emitir cash_register_opened, cash_register_closed nos RPCs de abertura/fecho de caixa | Código (RPC ou trigger) | Engenharia | Trilha de caixa consultável |
| F3 | Política de purge/retenção para gm_audit_logs (job ou processo conforme RETENTION_POLICY) | Job, doc ou runbook | Engenharia / Doc | Purge autorizado conforme política; não ad-hoc |

### Bloco G — Pipeline eventos + SLO (dias 70–85)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| G1 | Pipeline de eventos (ex.: gm_audit_logs → agregador ou stream) para dashboards externos | Config ou código (Supabase Realtime, worker, ou export periódico) | Engenharia | Eventos consumíveis por Grafana/Sentry ou interno |
| G2 | Definir e publicar SLO concretos (ex.: disponibilidade API, latência P95) em SLO_SLI.md | Doc atualizado + métricas expostas | Doc / Engenharia | SLO_SLI com números e janelas |
| G3 | Alertas para limiares (ex.: login_failure_count > N, heartbeat_missed) conforme ANOMALY_DEFINITION | Regras em Sentry/Grafana ou equivalente | Engenharia | Alertas operacionais ativos |
| G4 | Dashboard operacional por tenant (pedidos, receita, turnos, eventos) — UI ou link Supabase/Grafana | Dashboard + doc em DASHBOARD_METRICS | Engenharia / Doc | Visibilidade mínima validada |

### Bloco H — DATA_LINEAGE (mínimo) (dias 80–90)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| H1 | Documentar origem e uso dos dados críticos (pedidos, pagamentos, audit) em DATA_LINEAGE.md | Doc atualizado (tabelas → fontes → consumidores) | Doc | Lineage mínimo documentado |
| H2 | (Opcional) Pipeline ou processo simples de lineage (ex.: log de leituras/escritas por job) | Código ou processo + doc | Engenharia | Rastreio mínimo operacional |

---

## Ordem sugerida

1. **E1 → E2 → E3** (security backlog e THREAT_MODEL).  
2. **F1 → F2 → F3** (audit alargado e retenção).  
3. **G1 → G2 → G3 → G4** (pipeline, SLO, alertas, dashboard).  
4. **H1 → H2** (lineage doc e opcional pipeline).

Blocos E e F podem sobrepor-se; G e H podem sobrepor-se. Ajustar conforme capacidade.

---

## Progresso Onda 3

| ID | Estado | Notas |
|----|--------|-------|
| E1 | ✅ Concluído | [THREAT_MODEL_MITIGATION_MATRIX.md](docs/architecture/THREAT_MODEL_MITIGATION_MATRIX.md) |
| E2 | ✅ Concluído | Validação: 20260201130000_e2_input_validation_rpcs.sql + 20260228120000; doc [RATE_LIMITING_AND_INPUT_VALIDATION.md](docs/architecture/RATE_LIMITING_AND_INPUT_VALIDATION.md) |
| E3 | ✅ Concluído | Coluna Evidência em [OWASP_ASVS_CHECKLIST.md](docs/architecture/OWASP_ASVS_CHECKLIST.md); 7.3.1 ✅ |
| F1 | ✅ Concluído | Migração 20260228130000_f1_auth_audit_events.sql; authAudit.ts + AuthPage, AdminSidebar, SetupLayout, DraftDashboard |
| F2 | ✅ Concluído | Triggers gm_cash_registers: 20260228140000_f2_cash_register_audit_events.sql |
| F3 | ✅ Concluído | Migração 20260228150000_f3_audit_log_purge_policy.sql; [AUDIT_LOG_PURGE_RUNBOOK.md](docs/ops/AUDIT_LOG_PURGE_RUNBOOK.md) |
| G1 | ✅ Concluído | Realtime: 20260228160000_g1_audit_logs_realtime.sql; [EVENT_PIPELINE.md](docs/ops/EVENT_PIPELINE.md) |
| G2 | ✅ Concluído | [SLO_SLI.md](docs/architecture/SLO_SLI.md) §2.1 e §3 (números e janelas) |
| G3 | ✅ Concluído | Regras em [alerts.md](docs/ops/alerts.md) §G3 (ANOMALY_DEFINITION) |
| G4 | ✅ Concluído | UI: OperationalMetricsCards + useOperationalMetrics no Dashboard; doc [DASHBOARD_METRICS.md](docs/ops/DASHBOARD_METRICS.md) §5 (G4) |
| H1 | ✅ Concluído | [DATA_LINEAGE.md](docs/architecture/DATA_LINEAGE.md) §3 (tabelas → fontes → consumidores: gm_orders, gm_payments, gm_audit_logs, turn_sessions, gm_cash_registers) |
| H2 | ✅ Concluído | Processo em [DATA_LINEAGE.md](docs/architecture/DATA_LINEAGE.md) §5.1; script `scripts/lineage-check.sh` para verificação periódica |

---

## Referências

- [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) — Onda 3 §3
- [ONDA_2_TAREFAS_60_DIAS.md](./ONDA_2_TAREFAS_60_DIAS.md) — Onda 2 concluída
- [CHECKLIST_FECHO_GAPS.md](./CHECKLIST_FECHO_GAPS.md) — Atualizar estado ao fechar cada capacidade
- Specs: THREAT_MODEL, [THREAT_MODEL_MITIGATION_MATRIX](docs/architecture/THREAT_MODEL_MITIGATION_MATRIX.md), AUDIT_LOG_SPEC, EVENT_TAXONOMY, METRICS_DICTIONARY, SLO_SLI, ANOMALY_DEFINITION, DATA_LINEAGE, RETENTION_POLICY
- **Próximo:** [ONDA_4_POS_ULTRA_RAPIDO.md](./ONDA_4_POS_ULTRA_RAPIDO.md)

---

*Documento vivo. Ao concluir tarefas, atualizar esta tabela e CHECKLIST_FECHO_GAPS.*
